import { encrypt } from "./sub:configuration-utils";
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

