import { ProcessorStatus } from "../../types/payment-processor-types";

/**
 * Determines if a payment can be canceled based on its status.
 *
 * @param paymentData - The payment data object containing the status.
 * @returns A boolean indicating whether the payment can be canceled.
 */
export function  canCancelPayment(paymentData: any): boolean {
    const cancellableStatuses = [
     ProcessorStatus.REQUIRES_PAYMENT_METHOD,
     ProcessorStatus.REQUIRES_CAPTURE,
     ProcessorStatus.REQUIRES_CONFIRMATION,
     ProcessorStatus.REQUIRES_CUSTOMER_ACTION,
    ];
    return cancellableStatuses.includes(paymentData.status);
  }


