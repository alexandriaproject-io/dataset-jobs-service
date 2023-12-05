import { ConsumeMessage } from 'amqplib/properties';
import { JobSource, JobTarget, JobTool, JobType } from '@models/job.model';

export type HandleJobMessage = (
  msg: ConsumeMessage,
  jobData: JobDataInterface,
  ack: () => void,
  nack: () => Promise<void>
) => Promise<void>;

export interface JobDataInterface {
  jobId: string;
  datasetId: string;
  datasetRowId: string;
  type: JobType;
  target: JobTarget;
  sources: JobSource[];
  tool: JobTool;
}
