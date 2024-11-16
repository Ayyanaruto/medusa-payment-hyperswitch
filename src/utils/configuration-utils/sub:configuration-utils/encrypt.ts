import crypto from "crypto";
import { MedusaError } from "@medusajs/framework/utils";

import { EncryptionResult } from "../../../types/utils-types";

export const encrypt = async (
  key: string,
  plaintext: string
): Promise<EncryptionResult> => {
  try {
    const iv = crypto.randomBytes(12).toString("base64");
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "base64"),
      Buffer.from(iv, "base64")
    );
    let ciphertext = cipher.update(plaintext, "utf8", "base64");
    ciphertext += cipher.final("base64");
    const tag = cipher.getAuthTag();
    // logger.logEncryption("Encryption successful", { ciphertext, tag, iv });
    return { ciphertext, tag, iv };
  } catch (error) {
    // logger.error("Encryption failed:", error.message, "ENCRYPTION");
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Unable to encrypt data");
  }
};