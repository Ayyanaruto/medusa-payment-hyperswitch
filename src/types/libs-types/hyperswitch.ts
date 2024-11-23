import { BigNumberInput, PaymentProviderSessionResponse } from "@medusajs/framework/types";
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";
  export interface RequestOptions {
    path: string;
    method: HTTPMethod;
    headers?: Record<string, string>;
    body?:
      | Record<string, unknown>
      | TransactionCreateParams
      | TransactionUpdateParams
      | TransactionFetchParams
      | TransactionCaptureParams
      | TransactionCancelParams
      | TransactionRefundParams;
    query?: Record<string, unknown>;
  }
export interface HyperSwitchResponse<T> {
  data: T;
}

export interface Address {
  first_name?: string;
  last_name?: string;
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  zip?: string;
  state?: string;
}

interface Customer {
  id?: string;
  email?: string;
  phone?: string;
  name?: string;
}
export interface TransactionCreateParams {
  amount: BigNumberInput;
  currency: string;
  capture_method: "manual" | "automatic";
  confirm?: boolean;
  profile_id: string;
  setup_future_usage?: string;
  description?: string;
  billing: {
    address: Address
  };
  shipping: {
    address: Address
    phone:{
      number: string;
    },
    email: string;
  };
  customer?: Customer;
  metadata?: Record<string, unknown>;
}

export interface TransactionUpdateParams {
payment_id: string;
capture_method: string;
profile_id: string;
billing_address: {
  address:Address
};
shipping: {
  address:Address
  email: string;
  phone: string;
};
customer?: Customer
}
export interface TransactionFetchParams {
  payment_id: string;
}

export interface TransactionCaptureParams {
  payment_id: string;
  amount_to_capture?: number;
}

export interface TransactionCancelParams {
  payment_id: string;
  cancellation_reason?: string;
}

export interface TransactionRefundParams {
  payment_id: string;
  amount: number;
  reason?: string;
}

export interface TransactionAuthorizeParams {
  payment_id: string;
 client_secret?: string;
 amount: BigNumberInput
}

export interface TransactionResponse extends PaymentProviderSessionResponse {
 payment_id: string;
  status: string;
  amount: number;
  currency: string;
  capture_method: string;
  setup_future_usage: string;
  client_secret: string;
  metadata: Record<string, unknown>;
  profileId: string;
  billing_address: {
    address:Address
  };
  shipping: {
    address:Address
    email: string;
    phone: string;
  };
  customer?: Customer;
}

