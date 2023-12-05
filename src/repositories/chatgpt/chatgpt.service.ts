import OpenAI from 'openai';
import {OPENAI_API_KEY} from '@config';
import systemPromptJson from './prompts/generate_system.json'
import {DatasetRowInterface} from "@models/datasetrow.model";
import {JobInterface, JobSource, JobTool} from "@models/job.model";
import {GPT_TYPES} from "@repositories/chatgpt/chatgpt.service.interface";

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY, // defaults to process.env["OPENAI_API_KEY"]
});


export const promptGpt = async (model: GPT_TYPES, system: string, prompt: string, temerature: number): Promise<string> => {
    const params: OpenAI.Chat.ChatCompletionCreateParams = {
        messages: [
            {role: 'system', content: system},
            {role: 'user', content: prompt}],
        model: model,
        temperature: temerature,
        top_p: 1,
        max_tokens: 4000
    };
    const chatCompletion: OpenAI.Chat.ChatCompletion = await openai.chat.completions.create(params);
    return chatCompletion.choices[0]?.message?.content || ''
}

export const generateMessageGpt = async (datasetRow: DatasetRowInterface, {
    sources,
    tool
}: JobInterface): Promise<string> => {
    const systemPrompt = systemPromptJson.systemMessageTemplate;
    let gptPrompt = systemPromptJson.promptTemplate;

    if (sources.includes(JobSource.System)) {
        gptPrompt = gptPrompt.replace('{{source-system}}', datasetRow.systemMessage)
    }

    if (sources.includes(JobSource.Context)) {
        const contexts = datasetRow.contextMessages.map((contextMessage) => {
            return `- ${contextMessage} \n`
        })
        gptPrompt = gptPrompt.replace('{{source-context}}', contexts.join('\n'))
    }

    if (sources.includes(JobSource.Messages)) {
        const messages = datasetRow.messages.map(({provider, message}) => {
            return `- ${provider.toUpperCase()}: ${message} \n`
        })
        gptPrompt = gptPrompt.replace('{{source-messages}}', messages.join('\n'))
    }


    let modelName;
    switch (tool) {
        case JobTool.GPT41106Preview:
            modelName = GPT_TYPES.GPT4_1106_PREVIEW
            break;
        case JobTool.GPT35:
            modelName = GPT_TYPES.GPT3_5_TURBO
            break;
        case JobTool.GPT4:
        case JobTool.Default:
        default:
            modelName = GPT_TYPES.GPT4
    }

    return promptGpt(modelName, systemPrompt, gptPrompt, 0);
}