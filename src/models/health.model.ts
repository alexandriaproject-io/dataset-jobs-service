import { Schema, model } from 'mongoose';

export interface HealthModelInterface {
  type: string;
}

const HealthSchema = new Schema<HealthModelInterface>(
  {
    type: { type: String, default: 'health' },
  },
  {
    versionKey: false,
  }
);

export const HealthModel = model<HealthModelInterface>('health', HealthSchema);
