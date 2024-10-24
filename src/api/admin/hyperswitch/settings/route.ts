import type { MedusaRequest, MedusaResponse } from "@medusajs/medusa";
import { MedusaError } from "@medusajs/utils";
import CredentialsService from "../../../../services/credentials";
import Logger from "../../../../utils/logger";

const logger = new Logger();

const logApi = (level: string, message: string, req: MedusaRequest, res: MedusaResponse, responseTime: number) => {
  logger.logApi(
    level,
    message,
    {
      requestType: req.method,
      endpoint: req.path,
      browser: req.headers['user-agent']?.split(' ')[0] || 'Unknown',
      userAgent: req.headers['user-agent'] || 'Unknown',
      statusCode: res.statusCode,
      requestId: req.headers['x-request-id'],
      clientIp: req.ip,
      responseTime
    },
    "HYPERSWITCH SETTINGS"
  );
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const start = Date.now();
  try {
    const credentialsService: CredentialsService = req.scope.resolve("credentialsService");
    const credentials = await credentialsService.extract();
    const responseTime = Date.now() - start;
    logApi("INFO", "Credentials extracted in GET", req, res, responseTime);
    res.json({ credentials });
  } catch (e) {
    const responseTime = Date.now() - start;
    logApi("ERROR", "Error extracting credentials in GET", req, res, responseTime);
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Error extracting credentials");
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const start = Date.now();
  try {
    const credentialsService: CredentialsService = req.scope.resolve("credentialsService");
    const data = req.body;
    await credentialsService.upsert(data as any);
    const responseTime = Date.now() - start;
    logApi("INFO", "Credentials updated in POST", req, res, responseTime);
    res.json({ message: "Successfully updated the credentials!" });
  } catch (e) {
    const responseTime = Date.now() - start;
    logApi("ERROR", "Error updating credentials in POST", req, res, responseTime);
    throw new MedusaError(MedusaError.Types.DB_ERROR, "Error updating credentials");
  }
};
