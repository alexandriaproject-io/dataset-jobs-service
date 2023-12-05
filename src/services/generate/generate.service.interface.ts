import { DatasetRowInterface } from '@models/datasetrow.model';
import { JobInterface } from '@models/job.model';

export type generateFunction = (datasetRow: DatasetRowInterface, jobRow: JobInterface) => Promise<string>;
