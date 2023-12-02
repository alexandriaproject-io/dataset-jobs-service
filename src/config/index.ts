import { config } from 'dotenv-flow';

config();

export const MONGO_CONNECTION_STRING: string = process.env.MONGO_CONNECTION_STRING || '';
export const STATUS_PORT: number = parseInt(process.env.STATUS_PORT || '') || 0;
export const NODE_ENV: string = process.env.NODE_ENV || '';


if (!MONGO_CONNECTION_STRING) {
  throw new Error('Service configuration error: Missing MONGO_CONNECTION_STRING');
}

if (!STATUS_PORT) {
  throw new Error('Service configuration error: Missing STATUS_PORT');
}
