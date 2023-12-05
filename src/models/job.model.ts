import { Schema, model, Document, ObjectId } from 'mongoose';
import { SUPPORTED_TOOLS } from '@system/utils';

export enum JobType {
  Generate = 'generate',
  Expand = 'expand',
  Rephrase = 'rephrase',
  Unknown = 'unknown',
}

export enum JobTarget {
  Messages = 'messages',
  System = 'system',
  Context = 'context',
  Unknown = 'unknown',
}

export enum JobSource {
  Messages = 'messages',
  System = 'system',
  Context = 'context',
  Unknown = 'unknown',
}

export enum JobStatus {
  New = 'new',
  Queued = 'queued',
  Error = 'error',
  Completed = 'completed',
}

export interface JobInterface extends Document {
  _id: ObjectId;
  datasetId: ObjectId;
  datasetRowId: ObjectId;
  jobHash: string;
  type: JobType;
  target: JobTarget;
  sources: Array<JobSource>;
  status: JobStatus;
  tool: SUPPORTED_TOOLS;
  completedDate: Date | null;
}

const jobSchema = new Schema(
  {
    datasetId: Schema.Types.ObjectId,
    datasetRowId: Schema.Types.ObjectId,
    jobHash: { type: String, unique: true },
    type: { type: String, enum: Object.values(JobType) },
    target: { type: String, enum: Object.values(JobTarget) },
    sources: [{ type: String, enum: Object.values(JobSource) }],
    status: { type: String, default: JobStatus.New, enum: Object.values(JobStatus) },
    tool: { type: String, enum: Object.values(SUPPORTED_TOOLS) },
    completedDate: { type: Date, default: null, sparse: true },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

jobSchema.index({ jobHash: 1 }, { unique: true, name: 'jobHash_ind_unq_1' });
jobSchema.index({ datasetId: 1 }, { name: 'datasetId_ind_1' });
jobSchema.index({ completedDate: 1 }, { expireAfterSeconds: 604800, name: 'completedDate_ttl_1', sparse: true });

export const JobModel = model<JobInterface>('dataset_jobs', jobSchema);
