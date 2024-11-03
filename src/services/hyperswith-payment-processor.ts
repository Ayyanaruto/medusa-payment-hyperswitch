import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorSessionResponse,
  CartService,
  PaymentSessionStatus,
} from '@medusajs/medusa';
import { MedusaError, MedusaErrorTypes } from '@medusajs/utils';
import CredentialsService from './credentials';
import { CredentialsType } from '../types';
import HyperSwitch, { TransactionStatus } from '../libs/hyperswitch';
import { filterNull } from '../utils/filterNull';
import Logger from '../utils/logger';

interface HyperswitchPaymentProcessorDependencies {
  credentialsService: CredentialsService;
  cartService: CartService;
}

interface PaymentProcessorError {
  error: string;
  code?: string;
  detail?: any;
}

abstract class HyperswitchPaymentProcessor extends AbstractPaymentProcessor {
  protected readonly credentialsService: CredentialsService;
  protected hyperswitch!: HyperSwitch;
  protected readonly cartService: CartService;
  private captureMethod!: string;
  private setupFutureUsage!: boolean;
  protected readonly logger: Logger;
  static readonly identifier = 'hyperswitch';

  constructor(
    {
      credentialsService,
      cartService,
    }: HyperswitchPaymentProcessorDependencies,
    context: any,
  ) {
    super(context);
    this.credentialsService = credentialsService;
    this.cartService = cartService;
    this.logger = new Logger();
  }

  private async initializeHyperSwitch(): Promise<void> {
    try {
      const credentials =
        (await this.credentialsService.extract()) as CredentialsType;
      this.captureMethod = credentials.capture_method;
      this.setupFutureUsage = credentials.enable_save_cards;

      if (!credentials.secret_key) {
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          'No hyperswitch credentials found',
        );
      }

      this.hyperswitch = new HyperSwitch(credentials.secret_key);
    } catch (error) {
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        'Failed to initialize HyperSwitch',
      );
    }
  }

  private async createTransaction(context: PaymentProcessorContext) {
    const { amount, currency_code, resource_id } = context;
    try {
      const response = await this.hyperswitch.transactions.create({
        amount,
        currency: currency_code.toUpperCase(),
        setup_future_usage: this.setupFutureUsage
          ? 'on_session'
          : 'off_session',
        capture_method: this.captureMethod,
        metadata: { cart_id: resource_id },
      });
      return this.formatResponse(response);
    } catch (error) {
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        'Failed to create transaction',
      );
    }
  }

  private async updateTransaction(context: PaymentProcessorContext) {
    const { amount, billing_address, customer, paymentSessionData } = context;
    try {
      const response = await this.hyperswitch.transactions.update({
        payment_id: paymentSessionData.payment_id as string,
        capture_method: this.captureMethod,
        billing: this.formatBillingAddress(billing_address),
        customer: this.formatCustomerData(customer, billing_address),
        amount,
        customer_id: customer.id,
      });
      return this.formatResponse(response);
    } catch (error) {
      this.logger.error('Failed to update transaction', { error },"HYPERSWITCH PAYMENT PROCESSOR");
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        'Failed to update transaction',
      );
    }
  }

  private formatBillingAddress(billing_address: any) {
    return {
      address: {
        city: billing_address.city,
        country: billing_address.country_code.toUpperCase(),
        first_name: billing_address.first_name,
        last_name: billing_address.last_name,
        line1: billing_address.address_1,
        line2: billing_address.address_2,
        zip: billing_address.postal_code,
        state: billing_address.province,
      },
    };
  }

  private formatCustomerData(customer: any, billing_address: any) {
    return {
      id: customer.id,
      email: customer.email,
      name: `${billing_address.first_name} ${billing_address.last_name}`,
      phone: billing_address.phone,
    };
  }

  async initiatePayment(
    context: PaymentProcessorContext,
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      await this.initializeHyperSwitch();
      const response = await this.createTransaction(context);
      return this.handleResponse(response, 'Failed to initiate payment');
    } catch (error) {
      return this.buildError('Failed to initiate payment', error);
    }
  }

  async updatePayment(
    context: PaymentProcessorContext,
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      await this.initializeHyperSwitch();
      const response = await this.updateTransaction(context);
      return this.handleResponse(response, 'Failed to update payment');
    } catch (error) {
      return this.buildError('Failed to update payment', error);
    }
  }

  async getPaymentStatus(
    context: PaymentProcessorContext & { data?: Record<string, unknown> },
  ): Promise<PaymentSessionStatus> {
    const { data } = context;
    try {
      const paymentData = await this.hyperswitch.transactions.fetch({
        payment_id: data?.payment_id as string,
      });

      return this.mapTransactionStatusToPaymentSessionStatus(
        paymentData.data.status as TransactionStatus,
      );
    } catch (error) {
      return PaymentSessionStatus.ERROR;
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      const { payment_id } = paymentSessionData.data as { payment_id: string };
      const fetchPayment = await this.hyperswitch.transactions.fetch({
        payment_id,
      });

      if (
        this.isValidCaptureStatus(fetchPayment.data.status as TransactionStatus)
      ) {
        const response = await this.hyperswitch.transactions.capture({
          payment_id,
        });
        return this.handleResponse(response, 'Failed to capture payment');
      } else if (fetchPayment.data.status === TransactionStatus.SUCCEEDED) {
        return {
          data: filterNull(fetchPayment.data),
        };
      } else if (fetchPayment.data.status === TransactionStatus.FAILED) {
        return this.buildError('Failed to capture payment', {
          code: '400',
          detail: 'Payment cannot be captured in its current status',
        });
      }
    } catch (error) {
      return this.buildError('Failed to capture payment', error);
    }
  }

  private isValidCaptureStatus(status: TransactionStatus): boolean {
    const validStatuses = [
      TransactionStatus.REQUIRES_CAPTURE,
      TransactionStatus.PARTIALLY_CAPTURED_AND_CAPTURABLE,
      TransactionStatus.PROCESSING,
    ];
    return validStatuses.includes(status);
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>,
  ): Promise<
    | PaymentProcessorError
    | { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    try {
      await this.initializeHyperSwitch(); // Initialize hyperswitch
      const { payment_id } = paymentSessionData;

      if (!payment_id) {
        this.logger.error('No payment_id provided', { context }, "HYPERSWITCH PAYMENT PROCESSOR");
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          'No payment_id provided',
        );
      }

      const paymentData = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });
      const data = filterNull(paymentData.data);

      return {
        status: this.mapTransactionStatusToPaymentSessionStatus(
          paymentData.data.status as TransactionStatus,
        ),
        data: data as Record<string, unknown>,
      };
    } catch (error) {
      return this.buildError('Failed to authorize payment', error);
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse['session_data']
  > {
    const { payment_id } = paymentSessionData;
    try {
      const paymentData = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });
      return {
        data: filterNull(paymentData.data),
      };
    } catch (error) {
      return this.buildError('Failed to retrieve payment', error);
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse['session_data']
  > {
    const { payment_id } = paymentSessionData as { payment_id: string };

    try {
      await this.initializeHyperSwitch();
      const paymentData = await this.hyperswitch.transactions.cancel({
        payment_id,
      });
      return {
        data: filterNull(paymentData.data),
      };
    } catch (error) {
      return this.buildError('Failed to cancel payment', error);
    }
  }

  async cancelPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse['session_data']
  > {
    const { payment_id } = paymentSessionData.data as { payment_id: string };

    try {
      await this.initializeHyperSwitch();
      const fetchPayment = await this.hyperswitch.transactions.fetch({
        payment_id,
      });

      if (this.canCancelPayment(fetchPayment.data)) {
        const paymentData = await this.hyperswitch.transactions.cancel({
          payment_id,
        });
        return {
          data: filterNull(paymentData.data),
        };
      } else {
        return this.buildError('Failed to cancel payment', {
          code: '400',
          detail: 'Payment cannot be cancelled in its current status',
        });
      }
    } catch (error) {
      return this.buildError('Failed to cancel payment', error);
    }
  }

  private canCancelPayment(paymentData: any): boolean {
    const cancellableStatuses = [
      TransactionStatus.REQUIRES_PAYMENT_METHOD,
      TransactionStatus.REQUIRES_CAPTURE,
      TransactionStatus.REQUIRES_CONFIRMATION,
      TransactionStatus.REQUIRES_CUSTOMER_ACTION,
    ];
    return cancellableStatuses.includes(paymentData.status);
  }

  async refundPayment(
    paymentSessionData: Record<string, unknown>,
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse['session_data']
  > {
    const { payment_id, amount, currency } = paymentSessionData.data as {
      payment_id: string;
      amount: number;
      currency: string;
    };

    try {
      await this.initializeHyperSwitch();
      const fetchPayment = await this.hyperswitch.transactions.fetch({
        payment_id,
      });

      if (this.canRefundPayment(fetchPayment.data, amount, currency)) {
        const paymentData = await this.hyperswitch.transactions.refund({
          payment_id,
        });
        return {
          data: filterNull(paymentData.data),
        };
      } else {
        return this.buildError('Failed to refund payment', {
          code: '400',
          detail: 'Payment cannot be refunded or amount is invalid',
        });
      }
    } catch (error) {
      return this.buildError('Failed to refund payment', error);
    }
  }
  private canRefundPayment(
    paymentData: any,
    amount: number,
    currency: string,
  ): boolean {
    return (
      (paymentData.status === TransactionStatus.SUCCEEDED ||
        paymentData.status === TransactionStatus.PARTIALLY_CAPTURED ||
        paymentData.status ===
          TransactionStatus.PARTIALLY_CAPTURED_AND_CAPTURABLE) &&
      paymentData.amount > 0 &&
      paymentData.amount === amount &&
      paymentData.currency === currency
    );
  }

  private mapTransactionStatusToPaymentSessionStatus(
    status: TransactionStatus,
  ): PaymentSessionStatus {
    switch (status) {
      case TransactionStatus.SUCCEEDED:
        return PaymentSessionStatus.AUTHORIZED;
      case TransactionStatus.FAILED:
        return PaymentSessionStatus.ERROR;
      case TransactionStatus.REQUIRES_CAPTURE:
      case TransactionStatus.REQUIRES_CONFIRMATION:
      case TransactionStatus.REQUIRES_PAYMENT_METHOD:
      case TransactionStatus.REQUIRES_CUSTOMER_ACTION:
      case TransactionStatus.REQUIRES_MERCHANT_ACTION:
        return PaymentSessionStatus.REQUIRES_MORE;
      default:
        return PaymentSessionStatus.PENDING;
    }
  }

  protected buildError(
    message: string,
    e:
      | {
          code?: string;
          detail: string;
        }
      | Error,
  ): PaymentProcessorError {
    const errorMessage = 'Hyperswitch Payment error: ' + message;
    const code = e instanceof Error ? e.message : e.code;
    const detail = e instanceof Error ? e.stack : e.detail;
    this.logger.error(errorMessage, e, "HYPERSWITCH PAYMENT PROCESSOR");
    return {
      error: errorMessage,
      code: code ?? '',
      detail: detail ?? '',
    };
  }

  private formatResponse(response: any) {
    return {
      data: filterNull(response.data),
      status: response.status,
    };
  }

  private handleResponse(
    response: any,
    errorMessage: string,
  ): PaymentProcessorError | PaymentProcessorSessionResponse {
    if (response.data.status === TransactionStatus.FAILED) {
      return this.buildError(errorMessage, {
        code: response.data.error.code,
        detail: response.data.error.detail,
      });
    }
    return response.data;
  }
}

export default HyperswitchPaymentProcessor;
