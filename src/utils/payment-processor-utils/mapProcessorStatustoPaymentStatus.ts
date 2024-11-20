import { PaymentSessionStatus } from "@medusajs/framework/utils";
import { ProcessorStatus } from "../../types/payment-processor-types";

/**
 * Maps the processor status to the corresponding payment session status.
 *
 * @param status - The status of the processor.
 * @returns The corresponding payment session status.
 */
export const mapProcessorStatusToPaymentStatus=(
    status: ProcessorStatus,
  ): PaymentSessionStatus =>{
    switch (status) {
      case ProcessorStatus.SUCCEEDED:
        return PaymentSessionStatus.AUTHORIZED;
      case ProcessorStatus.FAILED:
        return PaymentSessionStatus.ERROR;
      case ProcessorStatus.REQUIRES_CAPTURE:
      case ProcessorStatus.REQUIRES_CONFIRMATION:
      case ProcessorStatus.REQUIRES_PAYMENT_METHOD:
      case ProcessorStatus.REQUIRES_CUSTOMER_ACTION:
      case ProcessorStatus.REQUIRES_MERCHANT_ACTION:
        return PaymentSessionStatus.REQUIRES_MORE;
      default:
        return PaymentSessionStatus.PENDING;
    }
  }
