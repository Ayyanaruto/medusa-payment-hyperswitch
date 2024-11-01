import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorSessionResponse,
  CartService,
  PaymentSessionStatus,
} from "@medusajs/medusa";

import { MedusaError, MedusaErrorTypes } from "@medusajs/utils";

import CredentialsService from "./credentials";
import { CredentialsType } from "../types";
import HyperSwitch, { TransactionStatus } from "../libs/hyperswitch";
import { filterNull } from "../utils/filterNull";
import Logger from "../utils/logger";

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
  protected hyperswitch: HyperSwitch;
  protected readonly cartService: CartService;
  private captureMethod: string;
  private setupFutureUsage: boolean;
  protected readonly logger: Logger;
  static readonly identifier = "hyperswitch";

  constructor(
    {
      credentialsService,
      cartService,
    }: HyperswitchPaymentProcessorDependencies,
    context: any
  ) {
    super(context);
    this.credentialsService = credentialsService;
    this.cartService = cartService;
    this.logger = new Logger();
  }

  private async initializeHyperSwitch(): Promise<void> {
    try {
      const credentials = await this.credentialsService.extract() as CredentialsType;
      this.captureMethod = credentials.capture_method;
      this.setupFutureUsage = credentials.enable_save_cards;

      if (!credentials.secret_key) {
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          "No hyperswitch credentials found"
        );
      }

      this.hyperswitch = new HyperSwitch(credentials.secret_key);
    } catch (error) {
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        "Failed to initialize HyperSwitch"
      );
    }
  }

  private async createTransaction(context: PaymentProcessorContext) {
    try {
      const { amount, currency_code, resource_id } = context;

      const response = await this.hyperswitch.transactions.create({
        amount,
        currency: currency_code.toUpperCase(),
        setup_future_usage: "on_session",
        capture_method: this.captureMethod,
        metadata: {
          cart_id: resource_id,
        },
      });
      return this.formatResponse(response);
    } catch (error) {
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        "Failed to create transaction"
      );
    }
  }

  private async updateTransaction(context: PaymentProcessorContext) {
    try {
      const { amount, billing_address, customer, paymentSessionData } = context;
      const response = await this.hyperswitch.transactions.update({
        payment_id: paymentSessionData.payment_id as string,
        billing: {
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
        },
        customer: {
          id: customer.id,
          email: customer.email,
          name: `${billing_address.first_name} ${billing_address.last_name}`,
          phone: billing_address.phone,
        },
        amount,
        customer_id: customer.id,
      });
      return this.formatResponse(response);
    } catch (error) {
      this.logger.error("Failed to update transaction", { error });
      throw new MedusaError(
        MedusaErrorTypes.UNEXPECTED_STATE,
        "Failed to update transaction"
      );
    }
  }

  async initiatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      await this.initializeHyperSwitch();
      const response = await this.createTransaction(context);
      return this.handleResponse(response, "Failed to initiate payment");
    } catch (error) {
      return this.buildError("Failed to initiate payment", error);
    }
  }

  async updatePayment(
    context: PaymentProcessorContext
  ): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    try {
      await this.initializeHyperSwitch();
      const response = await this.updateTransaction(context);
      return this.handleResponse(response, "Failed to update payment");
    } catch (error) {
      return this.buildError("Failed to update payment", error);
    }
  }

  async getPaymentStatus(
    context: PaymentProcessorContext & { data?: Record<string, unknown> }
  ): Promise<PaymentSessionStatus> {
    const { data } = context;
    try {
      const paymentData = await this.hyperswitch.transactions.fetch({
        payment_id: data.payment_id as string,
      });
      
      console.log("getPaymentStatus", paymentData.data);
      switch (paymentData.data.status) {
        case TransactionStatus.SUCCEEDED:
          return PaymentSessionStatus.AUTHORIZED;
        case TransactionStatus.FAILED:
          return PaymentSessionStatus.ERROR;
        case TransactionStatus.REQUIRES_CAPTURE:
          return PaymentSessionStatus.REQUIRES_MORE;
        default:
          return PaymentSessionStatus.PENDING;
      }
    } catch (error) {
      return PaymentSessionStatus.ERROR;
    }
  }

  async capturePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<Record<string, unknown> | PaymentProcessorError> {
    try {
      return paymentSessionData;
    } catch (error) {
      return this.buildError("Failed to capture payment", error);
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProcessorError
    | { status: PaymentSessionStatus; data: Record<string, unknown> }
  > {
    try {
      const { payment_id } = paymentSessionData;

      if (!payment_id) {
        this.logger.error("No payment_id provided", { context });
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          "No payment_id provided"
        );
      }

      const paymentData = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });
      const data = filterNull(paymentData.data);

      switch (paymentData.data.status) {
        case TransactionStatus.SUCCEEDED:
          return {
            status: PaymentSessionStatus.AUTHORIZED,
            data: data as Record<string, unknown>,
          };
        case TransactionStatus.FAILED:
          return {
            status: PaymentSessionStatus.ERROR,
            data: data as Record<string, unknown>,
          };
        case TransactionStatus.REQUIRES_CAPTURE:
          return {
            status: PaymentSessionStatus.REQUIRES_MORE,
            data: data as Record<string, unknown>,
          };
        default:
          return {
            status: PaymentSessionStatus.PENDING,
            data: data as Record<string, unknown>,
          };
      }
    } catch (error) {
      return this.buildError("Failed to authorize payment", error);
    }
  }

  async retrievePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<
    PaymentProcessorError | PaymentProcessorSessionResponse["session_data"]
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
      return this.buildError("Failed to retrieve payment", error);
    }
  }

  protected buildError(
    message: string,
    e:
      | {
          code?: string;
          detail: string;
        }
      | Error
  ): PaymentProcessorError {
    const errorMessage = "Hyperswitch Payment error: " + message;
    const code = e instanceof Error ? e.message : e.code;
    const detail = e instanceof Error ? e.stack : e.detail;
    this.logger.error(errorMessage, e);
    return {
      error: errorMessage,
      code: code ?? "",
      detail: detail ?? "",
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
    errorMessage: string
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
