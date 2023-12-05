import { config } from 'dotenv-flow';

config();

export const MONGO_CONNECTION_STRING: string = process.env.MONGO_CONNECTION_STRING || '';
export const STATUS_PORT: number = parseInt(process.env.STATUS_PORT || '') || 0;
export const NODE_ENV: string = process.env.NODE_ENV || '';

export const RABBITMQ_HOST: string = process.env.RABBITMQ_HOST || '';
export const RABBITMQ_USER: string = process.env.RABBITMQ_USER || '';
export const RABBITMQ_PASS: string = process.env.RABBITMQ_PASS || '';
export const RABBITMQ_PORT: number = parseInt(process.env.RABBITMQ_PORT || '') || 0;
export const RABBITMQ_JOB_QUEUE_NAME: string = process.env.RABBITMQ_JOB_QUEUE_NAME || '';
export const RABBITMQ_JOB_QUEUE_PREFETCH: number = parseInt(process.env.RABBITMQ_JOB_QUEUE_PREFETCH || '') || 1;
export const RABBITMQ_JOB_PAUSE_SECONDS: number = parseInt(process.env.RABBITMQ_JOB_PAUSE_SECONDS || '') || 60;
export const OPENAI_API_KEY: string = process.env.OPENAI_API_KEY || '';

if (!MONGO_CONNECTION_STRING) {
  throw new Error('Service configuration error: Missing MONGO_CONNECTION_STRING');
}

if (!STATUS_PORT) {
  throw new Error('Service configuration error: Missing STATUS_PORT');
}

if (!RABBITMQ_HOST) {
  throw new Error('Service configuration error: Missing RABBITMQ_HOST');
}

if (!RABBITMQ_PORT) {
  throw new Error('Service configuration error: Missing RABBITMQ_PORT');
}

if (!RABBITMQ_USER) {
  throw new Error('Service configuration error: Missing RABBITMQ_USER');
}

if (!RABBITMQ_PASS) {
  throw new Error('Service configuration error: Missing RABBITMQ_PASS');
}
if (!RABBITMQ_JOB_QUEUE_NAME) {
  throw new Error('Service configuration error: Missing RABBITMQ_JOB_QUEUE_NAME');
}

if (!OPENAI_API_KEY) {
  throw new Error('Service configuration error: Missing OPENAI_API_KEY');
}