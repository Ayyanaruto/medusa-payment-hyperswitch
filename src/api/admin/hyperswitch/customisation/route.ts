import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import CustomisationService from 'src/services/customisation';
import Logger from '../../../../utils/logger';

const logger = new Logger();

const logApi = (
  level: string,
  message: string,
  req: MedusaRequest,
  res: MedusaResponse,
  responseTime: number
) => {
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
      responseTime,
    },
    'CUSTOMISATION SETTINGS'
  );
};

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const start = Date.now();
  try {
    const customisationService: CustomisationService = req.scope.resolve(
      'customisationService'
    );
    const customisation = await customisationService.extract();
    const responseTime = Date.now() - start;
    logApi('INFO', 'Customisation extracted in GET', req, res, responseTime);
    res.json({ customisation });
  } catch (e) {
    const responseTime = Date.now() - start;
    logApi('ERROR', 'Error extracting customisation in GET', req, res, responseTime);
    throw new MedusaError(MedusaError.Types.DB_ERROR, 'Error extracting customisation');
  }
};

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const start = Date.now();

  try {
    const customisationService: CustomisationService = req.scope.resolve(
      'customisationService'
    );
    const data = req.body;
    await customisationService.upsert(data as any);
    const responseTime = Date.now() - start;
    logApi('INFO', 'Customisation updated in POST', req, res, responseTime);
    res.json({ message: 'Successfully updated the customisation!' });
  } catch (e) {
    const responseTime = Date.now() - start;
    logApi('ERROR', 'Error updating customisation in POST', req, res, responseTime);
    throw new MedusaError(MedusaError.Types.DB_ERROR, 'Error updating customisation');
  }
};