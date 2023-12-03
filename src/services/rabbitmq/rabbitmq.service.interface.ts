import {ConsumeMessage} from "amqplib/properties";
import {JobSource, JobTarget, JobTool, JobType} from "@models/job.model";


export type HandleJobMessage = (msg: ConsumeMessage, jobData: JobDataInterface, ack: () => void, nack: ()=> void) => Promise<void>

export interface JobDataInterface {
    jobId: String;
    datasetId: String;
    datasetRowId: String;
    type: JobType;
    target: JobTarget
    sources: JobSource[],
    tool: JobTool
}