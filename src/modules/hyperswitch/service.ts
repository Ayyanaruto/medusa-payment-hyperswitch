import {
  AbstractPaymentProvider,
  MedusaError,
  PaymentSessionStatus as PaymentSession
} from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/framework";
import {
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus
} from "@medusajs/types";

import HyperSwitch from "../../libs/hyperswitch";
import { configWorkflow, customWorkflow, proxyWorkflow } from "../../workflows";
import {
  Logger,
  toHyperSwitchAmount,
  canCancelPayment,
  formatPaymentData,
  mapProcessorStatusToPaymentStatus,
} from "../../utils";
import { CreatePaymentProviderSession } from "../../types/payment-processor-types";


class HyperswitchPaymentProvider extends AbstractPaymentProvider {
  static identifier: string = "hyperswitch";

  private hyperswitch: HyperSwitch;
  private captureMethod: "manual" | "automatic";
  private setupFutureUsage: boolean;
  private profileId: string;
  private theme: string;
  private styles: Record<string, unknown>;
  protected logger: Logger;

  constructor(container: MedusaContainer) {
    super(container);
    this.logger = new Logger();
  }

  private async initializeHyperswitch(): Promise<void> {
    try {
      const { result: configResult } = await configWorkflow().run();
      const { result: proxyResult } = await proxyWorkflow().run();
      const { result: customResult } = await customWorkflow().run();

      this.hyperswitch = new HyperSwitch(
        configResult.secretKey,
        configResult.environment,
        proxyResult
      );
      this.captureMethod = configResult.captureMethod;
      this.setupFutureUsage = configResult.enableSaveCards;
      this.profileId = configResult.profileId;
      this.theme = customResult.theme;
      this.styles = customResult.styles;

      this.logger.info("Hyperswitch initialized successfully", {
        ...configResult,
        ...proxyResult,
        ...customResult,
      });
    } catch (e) {
      this.logger.error("Error in initializing Hyperswitch", e, "HYPERSWITCH_INIT_ERROR");
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in initializing Hyperswitch",
        "500"
      );
    }
  }

  async initiatePayment(
    context: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    await this.initializeHyperswitch();
    try {
      const { amount, currency_code, context: meta } = context;
      const formattedData = formatPaymentData(
        context,
        this.setupFutureUsage,
        this.captureMethod,
        this.profileId,
        toHyperSwitchAmount
      );
      const response = await this.hyperswitch.transactions.create(formattedData);
      return {
        data: {
          client_secret: response.data.client_secret,
          amount: response.data.amount,
          currency: response.data.currency,
          status: response.data.status,
          payment_id: response.data.payment_id,
          theme: this.theme,
          styles: this.styles,
        },
      };
    } catch (e) {
      this.logger.error("Error in initiating payment", e, "HYPERSWITCH_INITIATE_PAYMENT_ERROR");
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in initiating payment",
        "500"
      );
    }
  }

  async deletePayment(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const { payment_id } = paymentSessionData;
      if (!payment_id) {
        return {
          status: PaymentSession.CANCELED,
          data: {},
        };
      }
      await this.initializeHyperswitch();
      const currentStatus = await this.hyperswitch.transactions.fetch({ payment_id: payment_id as string });

      if (!canCancelPayment(currentStatus.data)) {
        this.logger.error("Payment cannot be deleted", "400", "HYPERSWITCH_DELETE_PAYMENT_ERROR");
        throw new MedusaError(
          MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
          "Payment cannot be deleted",
          "500"
        );
      }

      await this.hyperswitch.transactions.cancel({
        payment_id: payment_id as string,
        cancellation_reason: "requested_by_customer",
      });

      return {
        status: PaymentSession.CANCELED,
        data: {},
      };
    } catch (e) {
      this.logger.error("Error in deleting payment", e, "HYPERSWITCH_DELETE_PAYMENT_ERROR");
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in deleting payment",
        "500"
      );
    }
  }

  async authorizePayment(
    paymentSessionData: Record<string, unknown>,
    context: Record<string, unknown>
  ): Promise<
    | PaymentProviderError
    | {
        status: PaymentSessionStatus;
        data: PaymentProviderSessionResponse["data"];
      }
  > {
    const status = await this.getPaymentStatus(paymentSessionData);
    return {
      status,
      data: {
        ...paymentSessionData,
      },
    };
  }

 async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    try {
      const { payment_id } = paymentSessionData;
      await this.initializeHyperswitch();
      const { data } = await this.hyperswitch.transactions.fetch({ payment_id: payment_id as string });
      return mapProcessorStatusToPaymentStatus(data.status as any);
    } catch (e) {
      this.logger.error("Error in getting payment status", e, "HYPERSWITCH_GET_PAYMENT_STATUS_ERROR");
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in getting payment status",
        "500"
      );
    }
  }
}

export default HyperswitchPaymentProvider;
