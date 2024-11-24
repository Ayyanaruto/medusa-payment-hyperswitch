
import { MedusaError } from "@medusajs/utils";
import crypto from "crypto";
import { Logger } from "../logger/logger";

const logger = new Logger();
export const validateWebhook = async (
  paymentResponseHashKey: string,
  rawBody: string | Buffer,
  headers: any
) => {
  try {
    logger.debug(
      `Payment response hash key:`,{paymentResponseHashKey},"WEBHOOK VALIDATOR"
    );

    if (!paymentResponseHashKey) {
      logger.error(
        "Payment response hash key not provided",
        "WEBHOOK VALIDATOR"
      );
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Payment response hash key not provided"
      );
    }

    const signature = headers["x-webhook-signature-512"];

    if (!signature) {
      logger.error("Missing signature in request",{
        headers
      }, "WEBHOOK VALIDATOR");
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Missing signature in request",
        "401"
      );
    }

    // Use the rawBody for signature verification
    const hash = crypto
      .createHmac("sha512", paymentResponseHashKey)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      logger.error("Invalid signature",{hash,signature},"WEBHOOK VALIDATOR");
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid signature",
        "401"
      );
    }

    logger.debug(
      "Webhook signature validated successfully",{hash,signature},"WEBHOOK VALIDATOR"
    );

    return true;
  } catch (error) {
    logger.error(error.message, "WEBHOOK VALIDATOR");
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error.message, "401");
  }
};

export default validateWebhook;
