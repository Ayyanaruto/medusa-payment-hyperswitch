import { MedusaService } from "@medusajs/framework/utils";
import Configuration from "./models/configuration";
import {MedusaError} from "@medusajs/framework/utils";

import { ConfigurationType } from "../../types/models-types";
import { encryptSecretKey,decryptSecretKey } from "../../utils/configuration-utils";

type Configuration = ConfigurationType;

class ConfigurationService extends MedusaService({
    Configuration,
}) {
    async upsert(data: Configuration): Promise<Configuration> {
        try {
            const key = process.env.HYPERSWITCH_SECRET_KEY;
            const hashedSecretKey = await encryptSecretKey(key, data.secretKey);
            let result: ConfigurationType;
            const existingConfig = (await this.listConfigurations())[0];

            if (existingConfig) {
                result = await this.updateConfigurations(
                   {
                    id: existingConfig.id,
                    ...data,
                    secretKey: hashedSecretKey,
                   }
                );
            } else {
                result = await this.createConfigurations({
                    ...data,
                    secretKey: hashedSecretKey,
                });
            }

            return result;
        } catch (e) {
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Error in upserting configuration"
            );
        }
    }
    async extract(): Promise<Configuration> {
        try {
            const configuration = (await this.listConfigurations())[0];
            if (!configuration) {
            return {
                id: "",
                publishableKey: "",
                secretKey: "",
                paymentHashKey: "",
                enableSaveCards: false,
                environment: "sandbox",
                captureMethod: "automatic",
                created_at: new Date(),
                updated_at: new Date(),
                deleted_at: new Date(),
            };
            }

            configuration.secretKey = await decryptSecretKey(configuration.secretKey);

            return configuration;
        } catch (e) {
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Error in retrieving configuration"
            );
        }
    }
}

export default ConfigurationService;