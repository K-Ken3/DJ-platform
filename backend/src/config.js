import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const backendUrl = process.env.BACKEND_URL || 'http://localhost:4000';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || `${frontendUrl},${backendUrl},http://localhost:3000,http://localhost:4000`)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendUrl,
  backendUrl,
  allowedOrigins,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  databasePath: process.env.DATABASE_PATH || path.resolve(__dirname, '../data/dj-platform.db'),
  mtnMomoNumber: process.env.MTN_MOMO_NUMBER || '0789630452',
  mtnMomoUssd: process.env.MTN_MOMO_USSD || '*182*1*1*0789630452#',
};
