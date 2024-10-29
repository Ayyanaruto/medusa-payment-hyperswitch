import {
  AbstractPaymentProcessor,
  PaymentProcessorContext,
  PaymentProcessorError,
  PaymentProcessorSessionResponse,
  CartService,
  PaymentSessionStatus,
} from "@medusajs/medusa";
import { MedusaError, MedusaErrorTypes } from "@medusajs/utils";

import CredentialsService from "./credentials";
import { CredentialsType } from "../types";
import HyperSwitch from "../libs/hyperswitch";
import Logger from "../utils/logger";
import { PaymentMethod } from "../libs/hyperswitch";

abstract class HyperswitchPaymentProcessor extends AbstractPaymentProcessor {
  protected readonly credentialsService: CredentialsService;
  protected hyperswitch: HyperSwitch;
  protected readonly cartService: CartService;
  private captureMethod: string;
  private setupFutureUsage: boolean;

  static readonly identifier = "hyperswitch";

  constructor(container: any, context: any) {
    super(container, context);
    this.credentialsService = container.credentialsService;
    this.cartService = container.cartService;
  }

  private async initializeHyperSwitch(): Promise<void> {
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
  }

  private async createTransaction(context: PaymentProcessorContext) {
    const { amount, currency_code, resource_id } = context;
    return await this.hyperswitch.transactions.create({
      amount,
      currency: currency_code.toUpperCase(),
      setup_future_usage: "on_session",
      capture_method: this.captureMethod,
      metadata: {
        cart_id: resource_id,
      },
    });
  }

  private async updateTransaction(context: PaymentProcessorContext) {
    const { amount, billing_address, customer, paymentSessionData } = context;
    return await this.hyperswitch.transactions.update({
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
      return_url:"http://localhost:3000/checkout/payment",
      amount,
      customer_id: customer.id,
     
    });
  }

  async initiatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    await this.initializeHyperSwitch();
    const response = await this.createTransaction(context);
    return response.data;
  }

  async updatePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse> {
    await this.initializeHyperSwitch();
    const response = await this.updateTransaction(context);
    return response.data;
  }

  async capturePayment(context: PaymentProcessorContext): Promise<PaymentProcessorError | PaymentProcessorSessionResponse|any> {
    console.log("capturePayment");
    return { status: "success" }; // Placeholder return value
  }
  
  async authorizePayment(paymentSessionData: Record<string, unknown>, context: Record<string, unknown>): Promise<PaymentProcessorError | { status: PaymentSessionStatus; data: PaymentProcessorSessionResponse["session_data"]; } > {
    console.log("authorizePayment");
    return { status: PaymentSessionStatus.AUTHORIZED, data: {} }; // Placeholder return value
  }
  async getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
    console.log("getPaymentStatus");
    return PaymentSessionStatus.PENDING; // Placeholder return value
  }
}


export default HyperswitchPaymentProcessor;
