import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

import { handleApiLogs } from "../../../../utils/logger";
import { CUSTOMIZATION_MODULE } from "../../../../modules/customization";
import CustomizationService from "../../../../modules/customization/service";
import { CustomizationType } from "../../../../types/models-types";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const start = Date.now();
    const customizationService:CustomizationService = req.scope.resolve(CUSTOMIZATION_MODULE)
    const customisations = await customizationService.extract();
    const end = Date.now();

    handleApiLogs( {
      message: "Customization extracted successfully",
      source: "HYPER_SWITCH_CUSTOMIZATION_API",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: end - start,
      requestBody: req.body,
      responseBody: { ...customisations },
      headers: req.headers,
    });

    res.status(200).json({ customisations });
  }
  catch (error) {
    handleApiLogs({
      message: "Error in extracting customization" ,
      source: "HYPER_SWITCH_CUSTOMIZATION_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in extracting customization"
    );
  }
};

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
const customizationService:CustomizationService = req.scope.resolve(CUSTOMIZATION_MODULE)
  const data = req.body as CustomizationType;
  try {
    const customisation = await customizationService.upsert(data);
    res.status(200).json({ customisation });
  } catch (error) {
    handleApiLogs({
      message: "Error in creating customization" ,
      source: "HYPER_SWITCH_CUSTOMIZATION_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in creating customization"
    );
  }
}
