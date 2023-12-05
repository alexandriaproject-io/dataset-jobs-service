import OpenAI from 'openai';
import { OPENAI_API_KEY } from '@config';
import { DatasetRowInterface } from '@models/datasetrow.model';
import { JobInterface, JobSource } from '@models/job.model';
import { GPT_TYPES } from '@repositories/chatgpt/chatgpt.service.interface';
import { SUPPORTED_TOOLS } from '@system/utils';
import systemPromptJson from './prompts/generate_system.json';

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});

export const promptGpt = async (
  model: GPT_TYPES,
  system: string,
  prompt: string,
  temperature: number
): Promise<string> => {
  const params: OpenAI.Chat.ChatCompletionCreateParams = {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ],
    model,
    temperature,
    top_p: 1,
    max_tokens: 4000,
  };
  const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
  return chatCompletion.choices[0]?.message?.content || '';
};

export const getGptModelFromTool = (tool: SUPPORTED_TOOLS): GPT_TYPES | null => {
  switch (tool) {
    case SUPPORTED_TOOLS.DEFAULT:
      return GPT_TYPES.GPT4;
    case SUPPORTED_TOOLS.GPT4_1106_PREVIEW:
      return GPT_TYPES.GPT4_1106_PREVIEW;
    case SUPPORTED_TOOLS.GPT4_0613:
      return GPT_TYPES.GPT4_0613;
    case SUPPORTED_TOOLS.GPT4_0314:
      return GPT_TYPES.GPT4_0314;
    case SUPPORTED_TOOLS.GPT4:
      return GPT_TYPES.GPT4;
    case SUPPORTED_TOOLS.GPT3_5_TURBO_16K_0613:
      return GPT_TYPES.GPT3_5_TURBO_16K_0613;
    case SUPPORTED_TOOLS.GPT3_5_TURBO_16K:
      return GPT_TYPES.GPT3_5_TURBO_16K;
    case SUPPORTED_TOOLS.GPT3_5_TURBO_1106:
      return GPT_TYPES.GPT3_5_TURBO_1106;
    case SUPPORTED_TOOLS.GPT3_5_TURBO_0613:
      return GPT_TYPES.GPT3_5_TURBO_0613;
    case SUPPORTED_TOOLS.GPT3_5_TURBO_0301:
      return GPT_TYPES.GPT3_5_TURBO_0301;
    case SUPPORTED_TOOLS.GPT3_5_TURBO:
      return GPT_TYPES.GPT3_5_TURBO;
    default:
      return null;
  }
};

export const generateMessageGpt = async (
  datasetRow: DatasetRowInterface,
  jobRow: JobInterface,
  systemPrompt: string,
  promptTemplate: string,
  temperature: number = 0
): Promise<string> => {
  const { sources, tool } = jobRow;

  if (sources.includes(JobSource.System)) {
    promptTemplate = promptTemplate.replace('{{source-system}}', datasetRow.systemMessage);
  }

  if (sources.includes(JobSource.Context)) {
    const contexts = datasetRow.contextMessages.map((contextMessage) => `- ${contextMessage} \n`);
    promptTemplate = promptTemplate.replace('{{source-contexts}}', contexts.join('\n'));
  }

  if (sources.includes(JobSource.Messages)) {
    const messages = datasetRow.messages.map(({ provider, message }) => `- ${provider.toUpperCase()}: ${message} \n`);
    promptTemplate = promptTemplate.replace('{{source-messages}}', messages.join('\n'));
  }

  const modelName = getGptModelFromTool(tool);
  if (!modelName) {
    console.error('GPT encountered unknown tool, returning empty string!');
    return '';
  }

  try {
    return await promptGpt(modelName, systemPrompt, promptTemplate, temperature);
  } catch (e) {
    console.error(e);
    return '';
  }
};

export const generateSystemMessageGpt = async (
  datasetRow: DatasetRowInterface,
  jobRow: JobInterface,
  temperature: number = 0
): Promise<string> =>
  generateMessageGpt(
    datasetRow,
    jobRow,
    systemPromptJson.systemMessageTemplate,
    systemPromptJson.promptTemplate,
    temperature
  );
