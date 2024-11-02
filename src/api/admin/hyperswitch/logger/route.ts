import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import Logger from '../../../../utils/logger';
import fs from 'fs';
import { createReadStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

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
    'HYPERSWITCH SETTINGS'
  );
};


// export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
//     try {
//         const logFiles = ['../../../../../application.log'];
//         const readStreams = logFiles.map(file => createReadStream(file, { encoding: 'utf8' }));

//         const data: string[] = [];
//         for (const stream of readStreams) {
//             const chunks: string[] = [];
//             for await (const chunk of stream) {
//                 chunks.push(chunk);
//             }
//             data.push(chunks.join(''));
//         }

//         res.status(200).json({ logs: data });
//     } catch (error) {
//         logApi('error', 'Failed to read log files', req, res, 0);
//         res.status(500).json({ error: 'Failed to read log files' });
//     }
// };