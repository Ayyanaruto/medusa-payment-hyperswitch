import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

import { handleApiLogs } from "@/src/utils/logger";
import { CONFIG_MODULE } from "@/src/modules/configurations";
import ConfigurationsService from "@/src/modules/configurations/service";
import { ConfigurationType } from "@/src/types/models-types";




export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const start = Date.now();
    const configurationsService:ConfigurationsService = req.scope.resolve(CONFIG_MODULE)
    const configurations = await configurationsService.extract();
    const end = Date.now();

    handleApiLogs( {
      message: "Configuration extracted successfully",
      source: "HYPER_SWITCH_CONFIGURATION_API",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: end - start,
      requestBody: req.body,
      responseBody: { ...configurations },
      headers: req.headers,
    });

    res.status(200).json({ configurations });
  }
  catch (error) {
    handleApiLogs({
      message: "Error in extracting configuration" ,
      source: "HYPER_SWITCH_CONFIGURATION_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in extracting configuration"
    );
  }
};

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
const configurationsService:ConfigurationsService = req.scope.resolve(CONFIG_MODULE)
  const data = req.body;
  try {
    const start = Date.now();
    const configuration = await configurationsService.upsert(data as ConfigurationType);
    const end = Date.now();

    handleApiLogs({
      message: "Configuration upserted successfully",
      source: "HYPER_SWITCH_CONFIGURATION_API",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: end - start,
      requestBody: req.body,
      responseBody: { ...configuration },
      headers: req.headers,
    });

    res.status(200).json({ configuration });
  } catch (error) {
    handleApiLogs({
      message: "Error in upserting configuration",
      source: "HYPER_SWITCH_CONFIGURATION_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      stack: error.stack,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in upserting configuration"
    );
  }
};
