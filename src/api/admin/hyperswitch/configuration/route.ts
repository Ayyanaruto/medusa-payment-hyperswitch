import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import CredentialsService from '../../../../services/credentials';
import Logger from '../../../../utils/logger';
import { CredentialsType } from '../../../../types';

const logger = new Logger();

interface LogData {
  level: string;
  message: string;
  request: {
    method: string;
    path: string;
    headers: {
      'user-agent': string;
      'x-request-id'?: string;
    };
    clientIp: string;
  };
  response: {
    statusCode: number;
    responseTime: number;
  };
  context: string;
  error?: {
    message: string;
    stack?: string;
  };
}

const createLogData = (
  level: string,
  message: string,
  req: MedusaRequest,
  res: MedusaResponse,
  responseTime: number,
  error?: Error
): LogData => {
  const logData: LogData = {
    level,
    message,
    request: {
      method: req.method,
      path: req.path,
      headers: {
        'user-agent': req.headers['user-agent'] || 'Unknown',
        'x-request-id': Array.isArray(req.headers['x-request-id']) ? req.headers['x-request-id'][0] : req.headers['x-request-id'],
      },
      clientIp: req.ip,
    },
    response: {
      statusCode: res.statusCode,
      responseTime,
    },
    context: 'CONFIGURATION SETTINGS',
  };

  if (error) {
    logData.error = {
      message: error.message,
      stack: error.stack,
    };
  }

  return logData;
};

const logApi = (
  level: string,
  message: string,
  req: MedusaRequest,
  res: MedusaResponse,
  responseTime: number,
  error?: Error
): void => {
  const logData = createLogData(level, message, req, res, responseTime, error);
};

const handleRequest = async (
  req: MedusaRequest,
  res: MedusaResponse,
  action: (credentialsService: CredentialsService) => Promise<void>,
  successMessage: string,
  errorMessage: string
): Promise<void> => {
  const start = Date.now();
  try {
    const credentialsService: CredentialsService = req.scope.resolve('credentialsService');
    await action(credentialsService);
    const responseTime = Date.now() - start;
    logApi('INFO', successMessage, req, res, responseTime);
    res.json({ message: successMessage });
  } catch (e) {
    const responseTime = Date.now() - start;
    logApi('ERROR', errorMessage, req, res, responseTime, e as Error);
    throw new MedusaError(MedusaError.Types.DB_ERROR, errorMessage);
  }
};

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  await handleRequest(
    req,
    res,
    async (credentialsService: CredentialsService) => {
      const credentials = await credentialsService.extract();
      res.json({ credentials });
    },
    'Credentials extracted successfully',
    'Error extracting credentials'
  );
};

export const POST = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  await handleRequest(
    req,
    res,
    async (credentialsService: CredentialsService) => {
      const data = req.body;
      await credentialsService.upsert(data as CredentialsType);
    },
    'Credentials updated successfully',
    'Error updating credentials'
  );
};
