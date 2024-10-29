import crypto from 'crypto';
import Logger from './logger';
import { MedusaError } from "@medusajs/utils";

const logger = new Logger();
const algorithm = 'aes-256-cbc';
const iv = crypto.randomBytes(16);

interface EncryptionResult {
  ciphertext: string;
  tag: Buffer;
  iv: string;
}
interface DecryptionInput {
  key: string;
  ciphertext: string;
  tag: string;
  iv: string;
}

export const encrypt = async (key: string, plaintext: string): Promise<EncryptionResult> => {
  try {
    performance.mark('encryption-start');
    const iv = crypto.randomBytes(12).toString("base64");
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(key, "base64"),
      Buffer.from(iv, "base64")
    );
    let ciphertext = cipher.update(plaintext, "utf8", "base64");
    ciphertext += cipher.final("base64");
    const tag = cipher.getAuthTag();
    performance.mark('encryption-end');
    logger.logEncryption("Encryption successful", { ciphertext, tag, iv });
    return { ciphertext, tag, iv };
  } catch (error) {
    logger.error("Encryption failed:", error.message, "ENCRYPTION");
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Unable to encrypt data"
    );
  }
};


export const decrypt = async (text: DecryptionInput): Promise<string> => {
  try {
    
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      Buffer.from(text.key, "base64"),
      Buffer.from(text.iv, "base64")
    );

    decipher.setAuthTag(Buffer.from(text.tag, "base64"));
    let plaintext = decipher.update(text.ciphertext, "base64", "utf8");
    plaintext += decipher.final("utf8");
    logger.logDecryption("Decryption successful",{plaintext});
    return plaintext;
  

  } catch (error) {
    logger.error("Decryption failed:", error.message,"DECRYPTION");
    throw new Error("Unable to decrypt data");
  }
};