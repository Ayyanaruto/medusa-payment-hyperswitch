import crypto from "crypto";
import { MedusaError } from "@medusajs/framework/utils";
import { DecryptionInput } from "../../../types/utils-types";

import {Logger} from "../../";



export const decrypt = async (text: DecryptionInput): Promise<string> => {
  const logger = new Logger();
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(text.key, "base64"),
      Buffer.from(text.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(text.tag, "base64"));
    let plaintext = decipher.update(text.ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");
    logger.debug("Decryption successful", { plaintext }, "DECRYPTION");
    return plaintext;
  } catch (error) {
    logger.error("Decryption failed:", {
      error: error.message,
      stackTrace: error.stack,
      key: text.key,
      iv: text.iv,
      tag: text.tag,
      ciphertext: text.ciphertext,
    }, "DECRYPTION");
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Unable to decrypt data");
  }
};
