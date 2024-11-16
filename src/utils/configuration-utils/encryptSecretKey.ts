import { encrypt } from "./sub:configuration-utils";
export const encryptSecretKey = async (
  key: string,
  secretKey: string
): Promise<string> => {
  return JSON.stringify(await encrypt(key, secretKey));
};

