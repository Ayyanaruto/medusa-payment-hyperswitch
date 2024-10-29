import { MedusaError } from "@medusajs/utils";
import { Credentials } from "../models/credentials";
import { CredentialsType } from "../types";
import { dataSource } from "@medusajs/medusa/dist/loaders/database";
import Logger from "../utils/logger";
import { encrypt, decrypt } from "../utils/encrypt";
import path from "path";

const logger = new Logger();

const hashSecretKey = async (key: string, secretKey: string): Promise<string> => {
  return JSON.stringify(await encrypt(key, secretKey));
};

const decryptSecretKey = async (encryptedKey: string): Promise<string> => {
  const secretKey = JSON.parse(encryptedKey);
  secretKey.key = process.env.HYPERSWITCH_SECRET_KEY;
  return await decrypt(secretKey);
};

const createOrUpdateCredentials = async function (data: CredentialsType) {
  try {
    const key = process.env.HYPERSWITCH_SECRET_KEY;
    const hashedSecretKey = await hashSecretKey(key, data.secret_key);

    let existingCredentials = await this.find();
    logger.logDatabase("Checking for Existing Credentials", existingCredentials);

    existingCredentials = existingCredentials[0];

    if (existingCredentials) {
      await this.update(
        { id: existingCredentials.id },
        { ...data, secret_key: hashedSecretKey }
      );
      logger.logDatabase("Updated Credentials", data);
    } else {
      const newCredentials = this.create({
        ...data,
        secret_key: hashedSecretKey,
      });
      await this.save(newCredentials);
      logger.logDatabase("Created Credentials", data);
    }

    const result = await this.findOne({
      where: {
        publishable_key: data.publishable_key,
        environment: data.environment,
      },
    });

    logger.logDatabase("Created/Updated Credentials", result);
    return result;
  } catch (e) {
    logger.error("Error in Credentials Creation/Update", e, path.basename(__filename));
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Error in createOrUpdate");
  }
};

const extractCredentials = async function (): Promise<CredentialsType | {}> {
  try {
    const credentials: CredentialsType[] = await this.find();
    if (!credentials[0]) {
      return {};
    }

    const decryptedSecretKey = await decryptSecretKey(credentials[0].secret_key);
    credentials[0]["secret_key"] = decryptedSecretKey;

    logger.logDatabase("Extracted credentials from Database", credentials[0]);
    return { ...credentials[0] };
  } catch (e) {
    logger.error("Error in Credentials Extraction", e, path.basename(__filename));
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Error in extract");
  }
};

export const CredentialsRepository = dataSource.getRepository(Credentials).extend({
  createOrUpdate: createOrUpdateCredentials,
  extract: extractCredentials,
});
