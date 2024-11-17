import { MedusaService } from "@medusajs/framework/utils";
import { MedusaError } from "@medusajs/framework/utils";
import { CustomizationType } from "../../types/models-types";
import Customization from "./models/customization";
import { Logger } from "../../utils";

type Customization = CustomizationType;
const logger = new Logger();

class CustomizationService extends MedusaService({
  Customization,
}) {
  async upsert(data: Customization): Promise<Customization> {
    try {
      let result: CustomizationType;
      const existingCustomization = (await this.listCustomizations())[0];

      if (existingCustomization) {
        result = await this.updateCustomizations({
          id: existingCustomization.id,
          ...data,
        });
        logger.debug(
          "Customization updated successfully",
          { result },
          "HYPER_SWITCH_CUSTOMIZATION_DATABASE"
        );
      } else {
        result = await this.createCustomizations(data);
        logger.debug(
          "Customization created successfully",
          { result },
          "HYPER_SWITCH_CUSTOMIZATION_DATABASE"
        );
      }

      return result;
    } catch (e) {
      logger.error(
        "Error in upserting customization",
        e.message,
        "HYPER_SWITCH_CUSTOMIZATION_DATABASE"
      );
      throw new MedusaError(
        MedusaError.Types.DB_ERROR,
        "Error in upserting customization"
      );
    }
  }

  async extract(): Promise<Customization> {
    try {
      const customization = (await this.listCustomizations())[0];
      if (!customization) {
        return {
          id: "",
          theme: "light",
          styles: {},
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: new Date(),
        };
      }

      return customization;
    } catch (e) {
      logger.error(
        "Error in extracting customization",
        e.message,
        "HYPER_SWITCH_CUSTOMIZATION_DATABASE"
      );
      throw new MedusaError(
        MedusaError.Types.DB_ERROR,
        "Error in extracting customization"
      );
    }
  }
}

export default CustomizationService;
