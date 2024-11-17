import { MedusaService } from "@medusajs/framework/utils";
import {MedusaError} from "@medusajs/framework/utils";

import { ConfigurationType } from "../../types/models-types";
import Configuration from "./models/configuration";
import { encryptSecretKey,decryptSecretKey,Logger } from "../../utils";

type Configuration = ConfigurationType;
const logger = new Logger();

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
               logger.debug("Configuration updated successfully", { result }, "HYPER_SWITCH_CONFIGURATION_DATABASE");
            } else {
                result = await this.createConfigurations({
                    ...data,
                    secretKey: hashedSecretKey,
                });
                logger.debug("Configuration created successfully", { result }, "HYPER_SWITCH_CONFIGURATION_DATABASE");
            }

            return result;
        } catch (e) {
            logger.error("Error in upserting configuration", e.message, "HYPER_SWITCH_CONFIGURATION_DATABASE");
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
            logger.debug("Configuration extracted successfully", { configuration }, "HYPER_SWITCH_CONFIGURATION_DATABASE");

            return configuration;
        } catch (e) {
            logger.error("Error in retrieving configuration", e.message, "HYPER_SWITCH_CONFIGURATION_DATABASE");
            throw new MedusaError(
                MedusaError.Types.DB_ERROR,
                "Error in retrieving configuration"
            );
        }
    }
}

export default ConfigurationService;
