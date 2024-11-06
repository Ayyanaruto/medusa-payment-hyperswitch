import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import CustomisationService from '../../../../services/customisation';
import Logger from '../../../../utils/logger';
import { CustomisationTypes } from '../../../../types';

const logger = new Logger();

interface LogDetails {
  requestType: string;
  endpoint: string;
  browser: string;
  userAgent: string;
  statusCode: number;
  requestId: string | undefined;
  clientIp: string;
  responseTime: number;
  error?: string;
  stack?: string;
}

const createLogDetails = (
  req: MedusaRequest,
  res: MedusaResponse,
  responseTime: number,
  error?: Error
): LogDetails => ({
  requestType: req.method,
  endpoint: req.path,
  browser: req.headers['user-agent']?.split(' ')[0] || 'Unknown',
  userAgent: req.headers['user-agent'] || 'Unknown',
  statusCode: res.statusCode,
  requestId: Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : req.headers['x-request-id'],
  clientIp: req.ip,
  responseTime,
  error: error?.message,
  stack: error?.stack,
});

const logApi = (
  level: 'INFO' | 'ERROR',
  message: string,
  req: MedusaRequest,
  res: MedusaResponse,
  responseTime: number,
  error?: Error
): void => {
  const logDetails = createLogDetails(req, res, responseTime, error);
  if (level === 'ERROR' && error) {
    logger.error(message, logDetails, 'CUSTOMISATION SETTINGS');
  } else {
    logger.logApi(level, message, logDetails, 'CUSTOMISATION SETTINGS');
  }
};

const handleGetRequest = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const start = Date.now();
  try {
    const customisationService: CustomisationService = req.scope.resolve('customisationService');
    const customisation = await customisationService.extract();
    const responseTime = Date.now() - start;
    logApi('INFO', 'Customisation extracted successfully in GET', req, res, responseTime);
    res.json({ customisation });
  } catch (error) {
    const responseTime = Date.now() - start;
    logApi('ERROR', 'Error extracting customisation in GET', req, res, responseTime, error);
    throw new MedusaError(MedusaError.Types.DB_ERROR, 'Error extracting customisation');
  }
};

const handlePostRequest = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const start = Date.now();
  try {
    const customisationService: CustomisationService = req.scope.resolve('customisationService');
    const data = req.body;
    await customisationService.upsert(data as CustomisationTypes);
    const responseTime = Date.now() - start;
    logApi('INFO', 'Customisation updated successfully in POST', req, res, responseTime);
    res.json({ message: 'Successfully updated the customisation!' });
  } catch (error) {
    const responseTime = Date.now() - start;
    logApi('ERROR', 'Error updating customisation in POST', req, res, responseTime, error);
    throw new MedusaError(MedusaError.Types.DB_ERROR, 'Error updating customisation');
  }
};

export const GET = handleGetRequest;
export const POST = handlePostRequest;