import { BigNumberInput } from "@medusajs/framework/types";
import { TransactionCreateParams ,Address} from "@/src/types/libs-types";
interface ConAddress {
  first_name?: string;
  last_name?: string;
  city?: string;
  country_code?: string;
  address_1?: string;
  address_2?: string;
  postal_code?: string;
  province?: string;
  phone?: string;
}

interface Customer {
  id?: string;
  email?: string;
  phone?: string;
  first_name?: string;
  last_name?: string;
}

interface PaymentContext {
  amount:BigNumberInput;
  currency_code: string;
  context: {
    session_id: string;
    billing_address?: ConAddress;
    shipping_address?: ConAddress;
    customer?: Customer;
  };
}




/**
 * Formats payment data for transaction creation.
 *
 * @param context - The payment context containing amount, currency code, and metadata.
 * @param setupFutureUsage - A boolean indicating whether to set up future usage.
 * @param captureMethod - The capture method to be used ("manual" or "automatic").
 * @param profileId - The profile ID associated with the payment.
 * @param toHyperSwitchAmount - A function to convert the amount to HyperSwitch format.
 * @returns The formatted transaction creation parameters.
 */
export const formatPaymentData = (
  context: PaymentContext,
  setupFutureUsage: boolean,
  captureMethod: string,
  profileId: string,
  toHyperSwitchAmount: (params: { amount: number; currency: string }) => number
): TransactionCreateParams => {
  const { amount, currency_code, context: meta } = context;

  const formatAddress = (address?: ConAddress): Address=> ({
    first_name: address?.first_name,
    last_name: address?.last_name,
    city: address?.city,
    country: address?.country_code?.toUpperCase(),
    line1: address?.address_1,
    line2: address?.address_2,
    zip: address?.postal_code,
    state: address?.province,
  });

  const customerName =
    meta?.customer?.first_name && meta?.customer?.last_name
      ? `${meta.customer.last_name} ${meta.customer.first_name}`
      : `${meta.shipping_address?.first_name} ${meta.shipping_address?.last_name}`;
console.log("captureMethod",captureMethod);
  return {
    amount: toHyperSwitchAmount({ amount: Number(amount), currency: currency_code }),
    currency: currency_code.toUpperCase(),
    setup_future_usage: setupFutureUsage ? "on_session" : "off_session",
    capture_method: captureMethod as ("manual" | "automatic"),
    description: "Payment for order",
    profile_id: profileId,
    billing: {
      address: formatAddress(meta?.billing_address),
    },
    shipping: {
      address: formatAddress(meta?.shipping_address),
      phone: meta?.shipping_address?.phone
        ? {
            number: meta.shipping_address.phone,
          }
        : undefined,
      email: meta?.customer?.email,
    },
    customer: {
      id: meta?.customer?.id,
      email: meta?.customer?.email,
      phone: meta?.customer?.phone,
      name: customerName.trim(),
    },
    metadata: {
      session_id: meta.session_id,
    },
  };
};

// Usage example:
/*
const formattedData = formatPaymentData(
  context,
  this.setupFutureUsage,
  this.captureMethod,
  this.profileId,
  toHyperSwitchAmount
);

const response = await this.hyperswitch.transactions.create(formattedData);
*/
