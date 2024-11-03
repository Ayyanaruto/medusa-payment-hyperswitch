import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';

import readline from 'readline';
import process from 'process';
import fs from 'fs';

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logfiles = [
    `${process.cwd()}/application.log`,
    `${process.cwd()}/analytics.log`,
  ];

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  try {
    const logs = await Promise.all(logfiles.map(readLogs));
    const allLogs = logs.flat().reverse(); // Reverse the order of logs
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    res.json({
      logs: paginatedLogs,
      page,
      limit,
      totalLogs: allLogs.length,
      totalPages: Math.ceil(allLogs.length / limit),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to read logs' });
  }
};

const readLogs = (file: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const logs: string[] = [];
    const fileStream = fs.createReadStream(file).on('error', reject);

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    rl.on('line', (line) => {
      logs.push(line);
    });

    rl.on('close', () => {
      resolve(logs);
    });
  });
};