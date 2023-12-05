import { JobInterface, JobStatus, JobTarget } from '@models/job.model';
import { DatasetRowInterface, DatasetRowModel } from '@models/datasetrow.model';
import { generateSystemMessageGpt } from '@repositories/chatgpt';
import { generateFunction } from '@services/generate/generate.service.interface';
import { SUPPORTED_TOOLS } from '@system/utils';

const getGenerateSystemFunction = (tool: SUPPORTED_TOOLS): generateFunction | null => {
  switch (tool) {
    case SUPPORTED_TOOLS.DEFAULT:
    case SUPPORTED_TOOLS.GPT4_1106_PREVIEW:
    case SUPPORTED_TOOLS.GPT4_0613:
    case SUPPORTED_TOOLS.GPT4_0314:
    case SUPPORTED_TOOLS.GPT4:
    case SUPPORTED_TOOLS.GPT3_5_TURBO_16K_0613:
    case SUPPORTED_TOOLS.GPT3_5_TURBO_16K:
    case SUPPORTED_TOOLS.GPT3_5_TURBO_1106:
    case SUPPORTED_TOOLS.GPT3_5_TURBO_0613:
    case SUPPORTED_TOOLS.GPT3_5_TURBO_0301:
    case SUPPORTED_TOOLS.GPT3_5_TURBO:
      return generateSystemMessageGpt;
    default:
      console.error(`Missing generation function for ${tool}`);
      return null;
  }
};

export const handleGenerateSystemJob = async (
  jobRow: JobInterface,
  datasetRow: DatasetRowInterface
): Promise<boolean> => {
  if (datasetRow.systemMessage) {
    console.info('Dataset Row already contains system message');
    return true;
  }
  const generateSystemFunction: generateFunction | null = getGenerateSystemFunction(jobRow.tool);
  if (!generateSystemFunction) {
    return false;
  }

  let generatedSystemMessage = '';
  if (datasetRow.seriesPosition > 0) {
    const initialRow = await DatasetRowModel.findOne({
      rawJsonId: datasetRow.rawJsonId,
      seriesPosition: 0,
    });
    if (!initialRow) {
      console.error('Could not find the first in the conversation series!');
      return false;
    }
    generatedSystemMessage = initialRow.systemMessage;
    if (!generatedSystemMessage) {
      generatedSystemMessage = await generateSystemFunction(initialRow, jobRow);
    }
  } else {
    generatedSystemMessage = await generateSystemFunction(datasetRow, jobRow);
  }

  datasetRow.systemMessage = generatedSystemMessage;
  await datasetRow.save();
  jobRow.completedDate = new Date();
  jobRow.status = JobStatus.Completed;
  await jobRow.save();

  return true;
};

export const handleGenerateJob = async (jobRow: JobInterface, datasetRow: DatasetRowInterface): Promise<boolean> => {
  switch (jobRow?.target) {
    case JobTarget.System:
      return handleGenerateSystemJob(jobRow, datasetRow);
    case JobTarget.Messages:
      console.error(`Unknown target ${jobRow?.target}`);
      return false;
    case JobTarget.Context:
      console.error(`Unknown target ${jobRow?.target}`);
      return false;
    default:
      console.error(`Unknown target ${jobRow?.target}`);
      return false;
  }
};
