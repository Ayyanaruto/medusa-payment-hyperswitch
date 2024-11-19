import {
  AbstractPaymentProvider,
  MedusaError,
} from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/framework";

import {
  CreatePaymentProviderSession,
  PaymentProviderError,
  PaymentProviderSessionResponse,
  UpdatePaymentProviderSession,
} from "@medusajs/types";

import HyperSwitch from "../../libs/hyperswitch";

import { configWorkflow, customWorkflow, proxyWorkflow } from "../../workflows";

import { Logger, toHyperSwitchAmount } from "../../utils";

class HyperswitchPaymentProvider extends AbstractPaymentProvider {
  static identifier: string = "hyperswitch";

  private hyperswitch: HyperSwitch;
  private captureMethod: "manual" | "automatic";
  private setupFutureUsage: boolean;
  private profieId: string;
  private theme: string;
  private styles: Record<string, unknown>;
  protected logger: Logger;

  constructor(container: MedusaContainer) {
    super(container);
    this.logger = new Logger();
  }
  /*Initializing Hyperswitch libs with required properties in payment flow */

  async init() {
    try {
      const { result } = await configWorkflow().run();
      const { result: proxyResult } = await proxyWorkflow().run();
      const { result: customResult } = await customWorkflow().run();
      this.hyperswitch = new HyperSwitch(
        result.secretKey,
        result.environment,
        proxyResult
      );
      this.captureMethod = result.captureMethod;
      this.setupFutureUsage = result.enableSaveCards;
      this.theme = customResult.theme;
      this.styles = customResult.styles;
      this.profieId = result.profileId;

      this.logger.info("Hyperswitch initialized successfully", {
        secretKey: result.secretKey,
        environment: result.environment,
        proxyResult: proxyResult,
        captureMethod: result.captureMethod,
        setupFutureUsage: result.enableSaveCards,
        theme: customResult.theme,
        styles: customResult.styles,
      });

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

  /*Method to create payment session for Hyperswitch */
  async initiatePayment(
    context: CreatePaymentProviderSession
  ): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    await this.init();
    try {
      const { amount, currency_code, context: meta } = context;
      const { session_id } = meta;

      const response = await this.hyperswitch.transactions.create({
        amount: toHyperSwitchAmount({ amount, currency: currency_code }),
        currency: currency_code.toUpperCase(),
        setup_future_usage: this.setupFutureUsage
          ? "on_session"
          : "off_session",
        capture_method: this.captureMethod,
        profile_id: this.profieId,
        metadata: { session_id },
      });
      return {
        data: response.data as unknown as Record<string, unknown>,
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

 
}

export default HyperswitchPaymentProvider;
