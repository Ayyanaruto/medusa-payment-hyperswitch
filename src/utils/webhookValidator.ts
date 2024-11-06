import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import { createContainer,AwilixContainer } from "awilix";
import crypto from "crypto";
import Logger from "../utils/logger";
import CredentialsService from "../services/credentials";
import { CredentialsType } from "../types";

const container:AwilixContainer= createContainer();

const getPaymentHashKey = async (credentialsService:CredentialsService): Promise<string> => {
  const credentials: CredentialsType = await credentialsService.extract() as CredentialsType;
  return credentials.payment_hash_key;
};

const validateWebhook = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  const logger = new Logger();
  const credentialsService=await req.scope.resolve("credentialsService");
  const { headers, body } = req;
  try {
    const paymentResponseHashKey = await getPaymentHashKey(credentialsService);
    logger.debug(`Payment response hash key: ${paymentResponseHashKey}`, "WEBHOOK VALIDATOR");

    if (!paymentResponseHashKey) {
      logger.error("Payment response hash key not provided", "WEBHOOK VALIDATOR");
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Payment response hash key not provided");
    }

    const signature = headers["x-webhook-signature-512"];

    if (!signature) {
      logger.error("Missing signature in request", "WEBHOOK VALIDATOR");
      return res.status(400).send("Missing signature in request");
    }

    const hash = crypto.createHmac("sha512", paymentResponseHashKey).update(JSON.stringify(body)).digest("hex");
    

    if (hash !== signature) {
      logger.error("Invalid signature", "WEBHOOK VALIDATOR");
      return res.status(400).send("Invalid signature");
    }

    next();
  } catch (error) {
    logger.error(error.message, "WEBHOOK VALIDATOR");
    return res.status(500).send("Internal Server Error");
  }
};

export default validateWebhook;
