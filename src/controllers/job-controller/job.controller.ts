import {ConsumeMessage} from "amqplib/properties";
import {JobDataInterface} from "@services/rabbitmq";
import {DatasetRowModel} from "@models/datasetrow.model";
import {JobModel, JobType} from "@models/job.model";
import {handleGenerateJob} from "@services/generate/generate.service";


export const handleJob = async (_msg: ConsumeMessage, jobData: JobDataInterface, ack: () => void, nack: () => void): Promise<void> => {
    const [jobRow, datasetRow] = await Promise.all([
        JobModel.findById(jobData.jobId),
        DatasetRowModel.findById(jobData.datasetRowId)
    ])
    if (!jobRow) {
        console.error(`Failed to find related Job - jobId: ${jobData.jobId}`);
        return nack();
    }
    if (!datasetRow) {
        console.error(`Failed to find related Dataset Row - datasetRowId:${jobData.datasetRowId}`);
        return nack();
    }

    switch (jobData.type) {
        case JobType.Generate:
            try {
                const success = await handleGenerateJob(jobRow, datasetRow);
                if (success) {
                    console.info(`Dataset ${datasetRow.datasetId.toString()} - Job ${jobRow._id.toString()} on ${datasetRow._id.toString()} completed.`)
                    ack();
                } else {
                    console.log(`Job unsuccessful - jobId:${jobData.jobId}`);
                    nack();
                }
            } catch (e) {
                console.error(e);
                nack();
            }
            break;
        default:
            console.error(`Missing handler for ${jobData.type}`);
            nack();
    }
}
