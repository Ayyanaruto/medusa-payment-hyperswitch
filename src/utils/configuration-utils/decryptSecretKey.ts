
import { decrypt } from './sub:configuration-utils'
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
