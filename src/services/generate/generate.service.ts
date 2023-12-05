import {JobInterface, JobStatus, JobTarget, JobTool} from "@models/job.model";
import {DatasetRowInterface, DatasetRowModel} from "@models/datasetrow.model";
import {generateMessageGpt} from "@repositories/chatgpt";
import {generateFunction} from "@services/generate/generate.service.interface";


const getGenerateSystemFunction = (tool: JobTool): generateFunction | null => {
    switch (tool) {
        case JobTool.Default:
        case JobTool.GPT4:
        case JobTool.GPT35:
        case JobTool.GPT41106Preview:
            return generateMessageGpt;
        default:
            console.error(`Missing generation function for ${tool}`);
            return null;
    }
}


export const handleGenerateSystemJob = async (jobRow: JobInterface, datasetRow: DatasetRowInterface): Promise<boolean> => {
    if (datasetRow.systemMessage) {
        console.log("Dataset Row already contains system message");
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
            seriesPosition: 0
        })
        if (!initialRow) {
            console.log("Could not find the first in the conversation series!");
            return false;
        }
        generatedSystemMessage = initialRow.systemMessage;
        if (!generatedSystemMessage) {
            generatedSystemMessage = await generateSystemFunction(initialRow, jobRow)
        }
    } else {
        generatedSystemMessage = await generateSystemFunction(datasetRow, jobRow)
    }

    datasetRow.systemMessage = generatedSystemMessage;
    await datasetRow.save();
    jobRow.completedDate = new Date();
    jobRow.status = JobStatus.Completed;
    await jobRow.save();

    return true;
}

export const handleGenerateJob = async (jobRow: JobInterface, datasetRow: DatasetRowInterface): Promise<boolean> => {
    switch (jobRow.target) {
        case JobTarget.System:
            return handleGenerateSystemJob(jobRow, datasetRow);
        case JobTarget.Messages:
            console.error(`Unknown target ${jobRow.target}`);
            return false;
        case JobTarget.Context:
            console.error(`Unknown target ${jobRow.target}`);
            return false;
        default:
            console.error(`Unknown target ${jobRow.target}`);
            return false;
    }
}