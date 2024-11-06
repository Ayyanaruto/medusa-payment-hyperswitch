import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import { ProxyTypes } from '../../../../types';
import ProxyService from '../../../../services/proxy';
import Logger from '../../../../utils/logger';

class ProxyController {
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger();
  }

  private logApi(
    level: string,
    message: string,
    req: MedusaRequest,
    res: MedusaResponse,
    responseTime: number
  ): void {
    this.logger.logApi(
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
      'PROXY SETTINGS'
    );
  }

  public async getProxy(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const start = Date.now();
    try {
      const proxyService: ProxyService = req.scope.resolve('proxyService');
      const proxy:ProxyTypes = await proxyService.extract() as ProxyTypes;
      if (!proxy || typeof proxy.host === 'undefined' || typeof proxy.port === 'undefined') {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Invalid proxy data');
      }
      const responseTime = Date.now() - start;
      this.logApi('INFO', 'Proxy extracted in GET', req, res, responseTime);
      res.json({ proxy });
    } catch (error) {
      this.handleError('Error extracting proxy in GET', error, req, res, start);
    }
  }

  public async updateProxy(req: MedusaRequest, res: MedusaResponse): Promise<void> {
    const start = Date.now();
    try {
      const proxyService: ProxyService = req.scope.resolve('proxyService');
      const data: ProxyTypes = req.body as ProxyTypes;
      await proxyService.upsert(data);
      const responseTime = Date.now() - start;
      this.logApi('INFO', 'Proxy updated in POST', req, res, responseTime);
      res.json({ message: 'Successfully updated the proxy!' });
    } catch (error) {
      this.handleError('Error updating proxy in POST', error, req, res, start);
    }
  }

  private handleError(
    logMessage: string,
    error: unknown,
    req: MedusaRequest,
    res: MedusaResponse,
    start: number
  ): void {
    const responseTime = Date.now() - start;
    this.logApi('ERROR', logMessage, req, res, responseTime);
    throw new MedusaError(MedusaError.Types.DB_ERROR, logMessage);
  }
}

const proxyController = new ProxyController();

export const GET = (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  return proxyController.getProxy(req, res);
};

export const POST = (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  return proxyController.updateProxy(req, res);
};