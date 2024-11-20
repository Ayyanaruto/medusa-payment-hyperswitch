import { encrypt } from "./sub:configuration-utils";
/**
 * Encrypts a secret key using the provided key.
 *
 * @param {string} key - The key used to encrypt the secret key.
 * @param {string} secretKey - The secret key to be encrypted.
 * @returns {Promise<string>} - A promise that resolves to the encrypted secret key in JSON string format.
 * @throws {Error} - Throws an error if encryption fails.
 */
export const encryptSecretKey = async (
  key: string,
  secretKey: string
): Promise<string> => {
  try {
    return JSON.stringify(await encrypt(key, secretKey));
  }
  catch (e) {
    throw new Error("Error in encrypting secret key");
  }
};

