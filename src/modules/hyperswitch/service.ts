import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus as PaymentSession,
} from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/framework";
import {
  PaymentProviderError,
  PaymentProviderSessionResponse,
  PaymentSessionStatus,
  UpdatePaymentProviderSession,
} from "@medusajs/types";

import HyperSwitch from "@/src/libs/hyperswitch";
import { configWorkflow, customWorkflow, proxyWorkflow } from "@/src/workflows";
import {
  Logger,
  toHyperSwitchAmount,
  canCancelPayment,
  formatPaymentData,
  mapProcessorStatusToPaymentStatus,
  filterNull,
  fromHyperSwitchAmount,
  validateWebhook,
} from "@/src/utils";
import { CreatePaymentProviderSession } from "@/src/types/payment-processor-types";
import {
  ProviderWebhookPayload,
  WebhookActionResult,
} from "@medusajs/framework/types";

class HyperswitchPaymentProvider extends AbstractPaymentProvider {
  static identifier: string = "hyperswitch";

  private hyperswitch: HyperSwitch;
  private captureMethod: "manual" | "automatic";
  private setupFutureUsage: boolean;
  private paymentResponseHashKey: string;
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
      this.paymentResponseHashKey = configResult.paymentHashKey;
      this.theme = customResult.theme;
      this.styles = customResult.styles;

      this.logger.info("Hyperswitch initialized successfully", {
        ...configResult,
        ...proxyResult,
        ...customResult,
      }, "HYPERSWITCH_INIT_SUCCESS");
    } catch (e) {
      this.logger.error(
        "Error in initializing Hyperswitch",
        e,
        "HYPERSWITCH_INIT_ERROR"
      );
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
    try {
      await this.initializeHyperswitch();
      const formattedData = formatPaymentData(
        context,
        this.setupFutureUsage,
        this.captureMethod,
        this.profileId,
        toHyperSwitchAmount
      );
      const response = await this.hyperswitch.transactions.create(
        formattedData
      );
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
      this.logger.error(
        "Error in initiating payment",
        e,
        "HYPERSWITCH_INITIATE_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in initiating payment",
        "500"
      );
    }
  }
  async updatePayment(context: UpdatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    try {
      await this.initializeHyperswitch();
      const formattedData = formatPaymentData(
        context as CreatePaymentProviderSession,
        this.setupFutureUsage,
        this.captureMethod,
        this.profileId,
        toHyperSwitchAmount
      );
      const response = await this.hyperswitch.transactions.update(
      formattedData as any
      );
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
      this.logger.error(
        "Error in updating payment",
        e,
        "HYPERSWITCH_UPDATE_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in updating payment",
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
      const currentStatus = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });

      if (!canCancelPayment(currentStatus.data)) {
        this.logger.error(
          "Payment cannot be deleted",
          "400",
          "HYPERSWITCH_DELETE_PAYMENT_ERROR"
        );
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
      this.logger.error(
        "Error in deleting payment",
        e,
        "HYPERSWITCH_DELETE_PAYMENT_ERROR"
      );
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
    try {
      const status = await this.getPaymentStatus(paymentSessionData);
      const paymentSession = filterNull(paymentSessionData);
      return {
        status,
        data: {
          ...paymentSession,
        },
      };
    } catch (e) {
      this.logger.error(
        "Error in authorizing payment",
        e,
        "HYPERSWITCH_AUTHORIZE_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in authorizing payment",
        "500"
      );
    }
  }

  async capturePayment(
    paymentData: Record<string, unknown>
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const { payment_id } = paymentData as { payment_id: string };
      const amount = paymentData.amount as number;
      await this.initializeHyperswitch();
      const currentStatus = await this.getPaymentStatus(paymentData);
      console.log(currentStatus);
      if (currentStatus !== PaymentSession.CAPTURED) {
        const { data } = await this.hyperswitch.transactions.capture({
          payment_id: payment_id as string,
          amount_to_capture: amount,
        });
        const filteredData = filterNull(data);
        console.log(filteredData);
        return {
          status: PaymentSession.CAPTURED,
          data: {
            ...paymentData,
            ...filteredData,
          },
        };
      } else {
        return {
          status: PaymentSession.CAPTURED,
          data: {
            ...paymentData,
          },
        };
      }
    } catch (e) {
      this.logger.error(
        "Error in capturing payment",
        e,
        "HYPERSWITCH_CAPTURE_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in capturing payment",
        "500"
      );
    }
  }
async cancelPayment(paymentData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const data  = await this.deletePayment(paymentData);
      console.log(data);
      return {
     ...data,
      };
    } catch (e) {
      this.logger.error(
        "Error in canceling payment",
        e,
        "HYPERSWITCH_CANCEL_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in canceling payment",
        "500"
      );
}
}
async retrievePayment(paymentSessionData: Record<string, unknown>): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const { payment_id } = paymentSessionData;
      if (!payment_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Payment ID is required to retrieve payment",
          "400"
        );
      }
      await this.initializeHyperswitch();
      const { data } = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });
      return {
        data: {
          ...paymentSessionData,
          ...data,
        },
      };
    } catch (e) {
      this.logger.error(
        "Error in retrieving payment",
        e,
        "HYPERSWITCH_RETRIEVE_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in retrieving payment",
        "500"
      );
    }
}
  async refundPayment(
    paymentData: Record<string, unknown>,
    refundAmount: number
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
    try {
      const { payment_id, amount, currency } = paymentData as {
        payment_id: string;
        amount: number;
        currency: string;
      };

      const refAmount = toHyperSwitchAmount({
        //@ts-ignore
        amount: refundAmount.value,
        currency: currency,
      });
      if (refundAmount > amount) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Refund amount cannot be greater than the payment amount",
          "400"
        );
      }
      await this.initializeHyperswitch();
      const { data } = await this.hyperswitch.transactions.refund({
        payment_id: payment_id as string,
        reason: "requested_by_customer",
        //@ts-ignore
        amount: refAmount,
      });
      return {
        data: {
          ...paymentData,
          ...data,
        },
      };
    } catch (e) {
      this.logger.error(
        "Error in refunding payment",
        e,
        "HYPERSWITCH_REFUND_PAYMENT_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in refunding payment",
        "500"
      );
    }
  }

  async getPaymentStatus(
    paymentSessionData: Record<string, unknown>
  ): Promise<PaymentSessionStatus> {
    try {
      const { payment_id } = paymentSessionData;
      if (!payment_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Payment ID is required to get payment status",
          "400"
        );
      }
      await this.initializeHyperswitch();
      const { data } = await this.hyperswitch.transactions.fetch({
        payment_id: payment_id as string,
      });
      return mapProcessorStatusToPaymentStatus(data.status as any);
    } catch (e) {
      this.logger.error(
        "Error in getting payment status",
        e,
        "HYPERSWITCH_GET_PAYMENT_STATUS_ERROR"
      );
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        "Error in getting payment status",
        "500"
      );
    }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    //Delay the webhook
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const { data, rawData, headers } = payload;
    if (!validateWebhook(this.paymentResponseHashKey, rawData, headers)) {
      this.logger.error(
        "Invalid webhook signature",
        "HYPERSWITCH_WEBHOOK_ERROR"
      );
      return {
        action: PaymentActions.FAILED,
      };
    }
    try {
      const { event_type, content } = data;
      const { metadata, amount, currency } = (
        content as {
          object: { metadata: any; amount: number; currency: string };
        }
      ).object;
      const session_id = metadata.session_id;
      const amountBigNumber = new BigNumber(
        fromHyperSwitchAmount({ amount: amount, currency: currency })
      );

      switch (event_type) {
        case "payment_authorized":
          this.logger.info(
            "Payment Authorized",
            {
              session_id,
              amount: amountBigNumber,
            },
            "HYPERSWITCH_WEBHOOK"
          );
          return {
            action: PaymentActions.AUTHORIZED,
            data: {
              session_id,
              amount: amountBigNumber,
            },
          };
        case "payment_succeeded":
          return {
            action: PaymentActions.SUCCESSFUL,
            data: {
              session_id,
              amount: amountBigNumber,
            },
          };
        case "payment_failed":
          this.logger.info(
            "Payment Failed",
            {
              session_id,
              amount: amountBigNumber,
            },
            "HYPERSWITCH_WEBHOOK"
          );
          return {
            action: PaymentActions.FAILED,
            data: {
              session_id,
              amount: amountBigNumber,
            },
          };
        case "payment_cancelled":
          this.logger.info(
            "Payment Cancelled",
            {
              session_id,
              amount: amountBigNumber,
            },
            "HYPERSWITCH_WEBHOOK"
          );
          return {
            action: PaymentActions.NOT_SUPPORTED,
            data: {
              session_id,
              amount: amountBigNumber,
            },
          };
        default:
          this.logger.error(
            "Webhook event not supported",
            "HYPERSWITCH_WEBHOOK_ERROR"
          );
          return {
            action: PaymentActions.NOT_SUPPORTED,
          };
      }
    } catch (e) {
      this.logger.error(
        "Error in getting webhook action and data",
        e,
        "HYPERSWITCH_WEBHOOK_ERROR"
      );
      return {
        action: PaymentActions.FAILED,
        data: {
          session_id: (
            data.content as { object: { metadata: { session_id: string } } }
          ).object.metadata.session_id,
          amount: new BigNumber(
            (data.content as { object: { amount: number } }).object.amount
          ),
        },
      };
    }
  }
}

export default HyperswitchPaymentProvider;
