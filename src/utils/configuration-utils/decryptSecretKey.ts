
import { decrypt } from './sub:configuration-utils'
export const decryptSecretKey = async (encryptedKey: string): Promise<string> => {
  const secretKey = JSON.parse(encryptedKey);
  secretKey.key = process.env.HYPERSWITCH_SECRET_KEY;
  return await decrypt(secretKey);
};
