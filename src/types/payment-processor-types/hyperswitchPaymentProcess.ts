import {
  CreatePaymentProviderSession as OriginalCreatePaymentProviderSession,
  AddressDTO as OriginalAddressDTO,
  PaymentProviderContext as OriginalPaymentProviderContext,
} from "@medusajs/types";


export enum ProcessorStatus {
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  PROCESSING = "processing",
  REQUIRES_CUSTOMER_ACTION = "requires_customer_action",
  REQUIRES_MERCHANT_ACTION = "requires_merchant_action",
  REQUIRES_PAYMENT_METHOD = "requires_payment_method",
  REQUIRES_CONFIRMATION = "requires_confirmation",
  REQUIRES_CAPTURE = "requires_capture",
}

export interface CreatePaymentProviderSession
  extends OriginalCreatePaymentProviderSession {
  context: PaymentProviderContext;
}

interface AddressDTO extends OriginalAddressDTO {
  first_name?: string;
  last_name?: string;
}

interface PaymentProviderContext extends OriginalPaymentProviderContext {
  session_id: string;
  shipping_address?: AddressDTO;
  billing_address?: AddressDTO;
}
