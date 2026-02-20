import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

function loadEnv(fileName: string) {
  const p = path.resolve(process.cwd(), fileName);
  if (fs.existsSync(p)) dotenv.config({ path: p });
}

loadEnv('.env.test');
loadEnv('.env');

process.env.NODE_ENV = process.env.NODE_ENV || 'test';