import { ConsumeMessage } from 'amqplib/properties';
import { JobDataInterface } from '@services/rabbitmq';
import { DatasetRowModel } from '@models/datasetrow.model';
import { JobModel, JobType } from '@models/job.model';
import { handleGenerateJob } from '@services/generate/generate.service';

export const handleJob = async (
  _msg: ConsumeMessage,
  jobData: JobDataInterface,
  ack: () => void,
  nack: () => Promise<void>
): Promise<void> => {
  const [jobRow, datasetRow] = await Promise.all([
    JobModel.findById(jobData.jobId),
    DatasetRowModel.findById(jobData.datasetRowId),
  ]);
  if (!jobRow) {
    console.error(`Failed to find related Job - jobId: ${jobData.jobId}`);
    await nack();
    return;
  }
  if (!datasetRow) {
    console.error(`Failed to find related Dataset Row - datasetRowId:${jobData.datasetRowId}`);
    await nack();
    return;
  }

  let success = false;
  switch (jobData.type) {
    case JobType.Generate:
      success = await handleGenerateJob(jobRow, datasetRow);
      break;
    case JobType.Rephrase:
    case JobType.Expand:
    default:
      console.error(`Missing handler for ${jobData.type}`);
      await nack();
      return;
  }

  if (success) {
    console.info(
      `Dataset ${datasetRow.datasetId.toString()} - Job ${jobRow._id.toString()} on ${datasetRow._id.toString()} completed.`
    );
    ack();
  } else {
    console.info(`Job unsuccessful - jobId:${jobData.jobId}`);
    await nack();
  }
};
