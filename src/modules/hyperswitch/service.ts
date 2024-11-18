import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { MedusaContainer } from "@medusajs/framework";
import { CreatePaymentProviderSession, PaymentProviderError, PaymentProviderSessionResponse } from "@medusajs/types";


class HyperswitchPaymentProvider extends AbstractPaymentProvider {
  static identifier: string = "hyperswitch";
  constructor(container: MedusaContainer) {
    super(container);
  }
  async initiatePayment(context: CreatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
    console.log(context);
    return {
     data: {
        id: "hyperswitch-session-id",
        status: "succeeded"
      }
    }
  }

}

export default HyperswitchPaymentProvider;
