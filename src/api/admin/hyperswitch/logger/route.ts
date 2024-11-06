import type { MedusaRequest, MedusaResponse } from '@medusajs/medusa';
import { MedusaError } from '@medusajs/utils';
import readline from 'readline';
import process from 'process';
import fs from 'fs';
import path from 'path';

const LOG_FILES: readonly string[] = [
  path.join(process.cwd(), 'application.log'),
  path.join(process.cwd(), 'analytics.log'),
];

const ensureLogFilesExist = (logFiles: readonly string[]): void => {
  logFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, `[${new Date().toISOString()}] [CREATED] Created log file\n`);
    }
  });
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
      resolve(logs.reverse());
    });
  });
};

const paginateLogs = (logs: string[], page: number, limit: number) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  return logs.slice(startIndex, endIndex);
};

const mergeAndSortLogs = (logs: string[][]): string[] => {
  const allLogs = logs.flat();
  if (allLogs.length > 1) {
    const analyticsLogs = allLogs.splice(allLogs.length - 1, 1);
    allLogs.unshift(analyticsLogs[0]);
  }
  return allLogs;
};

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  ensureLogFilesExist(LOG_FILES);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 200;

  try {
    const logs = await Promise.all(LOG_FILES.map(readLogs));
    const allLogs = mergeAndSortLogs(logs);
    const paginatedLogs = paginateLogs(allLogs, page, limit);

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