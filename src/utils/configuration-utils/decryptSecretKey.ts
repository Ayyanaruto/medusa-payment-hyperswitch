
import { decrypt } from './sub:configuration-utils'
/**
 * Decrypts an encrypted secret key.
 *
 * @param {string} encryptedKey - The encrypted key in string format.
 * @returns {Promise<string>} - A promise that resolves to the decrypted secret key.
 * @throws {Error} - Throws an error if decryption fails.
 */
export const decryptSecretKey = async (encryptedKey: string): Promise<string> => {
  try{
  const secretKey = JSON.parse(encryptedKey);
  secretKey.key = process.env.HYPERSWITCH_SECRET_KEY;
  return await decrypt(secretKey);
  }
  catch(e){
    throw new Error("Error in decrypting secret key");
  }
};
