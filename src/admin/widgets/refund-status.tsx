import React from "react";
import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { StatusBadge, Container, Heading, Text, Button } from "@medusajs/ui";
import { CheckCircle2, AlertCircle, RefreshCw, CreditCard } from "lucide-react";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";

// Enhanced type definitions
interface PaymentData {
  data: {
    payment_id?: string;
  };
}

interface PaymentCollection {
  payments: {
    data: PaymentData;
    refunds?: Array<{ amount: number; status: string }>;
  }[];
  refunded_amount?: number;
}

// Refund Status Utility Functions
const calculateTotalRefund = (
  paymentCollections?: PaymentCollection[]
): number => {
  return (
    paymentCollections?.[0]?.payments?.[0]?.refunds?.reduce(
      (sum, refund) => sum + refund.amount,
      0
    ) ?? 0
  );
};

type RefundStatus = "pending" | "partial_success" | "full_success" | "failed";

const getRefundStatus = (
  paymentStatus: string,
  totalRefunded: number,
  total: number,
  summary: any
): RefundStatus => {
  // Refined status determination logic
  if (!["refunded", "partially_refunded"].includes(paymentStatus)) {
    return "pending";
  }

  if (totalRefunded === total) {
    return summary?.pending_difference === -total ? "failed" : "full_success";
  }

  if (totalRefunded > 0 && totalRefunded < total) {
    const isPendingDifferenceMatching =
      -(total - (summary?.refunded_amount ?? 0)) ===
      summary?.pending_difference;
    return isPendingDifferenceMatching ? "failed" : "partial_success";
  }

  return "pending";
};

// Status Configuration
const REFUND_STATUS_CONFIG: Record<
  RefundStatus,
  {
    label: string;
    color: "grey" | "green" | "red";
    icon: React.ElementType;
    message: (amount: number) => string;
  }
> = {
  pending: {
    label: "Refund Pending",
    color: "grey",
    icon: RefreshCw,
    message: () => "The refund for this order is being processed.",
  },
  partial_success: {
    label: "Partial Refund",
    color: "green",
    icon: CheckCircle2,
    message: (amount) =>
      `A partial refund of $${amount.toFixed(2)} has been processed.`,
  },
  full_success: {
    label: "Full Refund",
    color: "green",
    icon: CheckCircle2,
    message: () => "A full refund has been successfully processed.",
  },
  failed: {
    label: "Refund Failed",
    color: "red",
    icon: AlertCircle,
    message: () => "The refund processing encountered an error.",
  },
};

const RefundStatusWidget: React.FC<
  DetailWidgetProps<
    AdminOrder & {
      payment_collections: PaymentCollection[];
    }
  >
> = ({ data }) => {
  // Calculate refund details
  const totalRefundedAmount = calculateTotalRefund(data.payment_collections);
  const refundStatus = getRefundStatus(
    data.payment_status,
    totalRefundedAmount,
    data.total,
    data.summary
  );

  // Extract payment ID
  const paymentId =
    data.payment_collections?.[0]?.payments?.[0]?.data?.data?.payment_id ||
    "N/A";

  // Current status configuration
  const statusConfig = REFUND_STATUS_CONFIG[refundStatus];

  return (
    <Container
      className="
      rounded-2xl
      shadow-2xl
      border-[1px]
      border-gray-100
      hover:shadow-xl
      transition-all
      duration-300
      ease-in-out
      bg-white
    "
    >
      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CreditCard className="text-blue-600" size={36} strokeWidth={1.5} />
            <Heading
              level="h3"
              className="
                text-gray-900
                font-semibold
                tracking-tight
              "
            >
              Refund Details
            </Heading>
          </div>

          {/* Status Badge */}
          <StatusBadge
            color={statusConfig.color}
            className="
              px-4
              py-2
              text-sm
              font-medium
              rounded-full
              flex
              items-center
              space-x-2
            "
          >
            {statusConfig.label}
          </StatusBadge>
        </div>

        {/* Status Message */}
        <div
          className="
          bg-gray-50
          border
          border-gray-100
          rounded-xl
          p-4
          flex
          items-center
          space-x-3
        "
        >
          <statusConfig.icon
            size={24}
            className={`
              ${refundStatus === "failed" ? "text-red-500" : "text-blue-500"}
            `}
          />
          <Text
            className="
            text-gray-700
            leading-relaxed
            flex-grow
          "
          >
            {statusConfig.message(totalRefundedAmount)}
          </Text>
        </div>

        {/* Payment Details */}
        <div
          className="
          border-t
          border-gray-100
          pt-4
          mt-4
          flex
          items-center
          justify-between
        "
        >
          <div className="space-y-1">
            <Text
              className="
              text-gray-500
              text-sm
              font-medium
              uppercase
              tracking-wider
            "
            >
              Payment ID
            </Text>
            <Text
              className="
              text-gray-900
              font-semibold
              tracking-tight
            "
            >
              {paymentId}
            </Text>
          </div>

          {/* Action Button */}
            {refundStatus === "failed" && (
            <Button
              variant="secondary"
              className="
              bg-blue-50
              text-blue-600
              hover:bg-blue-100
              transition-colors
              duration-200
              rounded-lg
              font-semibold
              "
            >
              Retry Refund
            </Button>
            )}
        </div>
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
});

export default RefundStatusWidget;
