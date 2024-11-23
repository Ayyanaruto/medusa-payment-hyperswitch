import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { MedusaError } from "@medusajs/framework/utils";

import { handleApiLogs } from "@/src//utils/logger";
import { ProxyType } from "@/src//types/models-types";
import { PROXY_MODULE } from "@/src//modules/proxy";
import  ProxyService  from "@/src//modules/proxy/service";

export const GET = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  try {
    const start = Date.now();
    const proxyService:ProxyService = req.scope.resolve(PROXY_MODULE)
    const proxy = await proxyService.extract();
    const end = Date.now();

    handleApiLogs( {
      message: "Proxy extracted successfully",
      source: "HYPER_SWITCH_PROXY_API",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: end - start,
      requestBody: req.body,
      responseBody: { ...proxy },
      headers: req.headers,
    });

    res.status(200).json({ proxy });
  }
  catch (error) {
    handleApiLogs({
      message: "Error in extracting proxy" ,
      source: "HYPER_SWITCH_PROXY_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in extracting proxy"
    );
  }
};


export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> => {
  const proxyService:ProxyService = req.scope.resolve(PROXY_MODULE)
  const data = req.body;
  try {
    const start = Date.now();
    console.log("data", data);
    const proxy = await proxyService.upsert(data as ProxyType);
    const end = Date.now();

    handleApiLogs( {
      message: "Proxy upserted successfully",
      source: "HYPER_SWITCH_PROXY_API",
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: end - start,
      requestBody: req.body,
      responseBody: { ...proxy },
      headers: req.headers,
    });

    res.status(200).json({ proxy });
  }
  catch (error) {
    handleApiLogs({
      message: "Error in upserting proxy" ,
      source: "HYPER_SWITCH_PROXY_API",
      method: req.method,
      url: req.originalUrl,
      status: 500,
      responseTime: 0,
      error: error.message,
      headers: req.headers,
    });
    throw new MedusaError(
      MedusaError.Types.DB_ERROR,
      "Error in upserting proxy"
    );
  }
};
