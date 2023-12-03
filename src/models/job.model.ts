import {Schema, model, Document, ObjectId} from 'mongoose';

export enum JobType {
    Generate = 'generate',
    Expand = 'expand',
    Rephrase = 'rephrase'
}

export enum JobTarget {
    Messages = 'messages',
    System = 'system',
    Context = 'context'
}

export enum JobStatus {
    New = 'new',
    Queued = 'queued',
    Error = 'error',
    Completed = 'completed'
}

export enum JobTool {
    Default = 'default',
    GPT35 = 'gpt-3.5',
    GPT4 = 'gpt-4',
    GPT41106Preview = 'gpt-4-1106-preview',
    Llama7B = 'llama-7b',
    Llama7BChat = 'llama-7b-chat',
    Llama13B = 'llama-13b',
    Llama13BChat = 'llama-13b-chat'
}

export interface JobInterface extends Document {
    _id: ObjectId;
    datasetId: ObjectId;
    datasetRowId: ObjectId;
    jobHash: string;
    type: JobType;
    target: JobTarget;
    sources: Array<JobTarget>;
    status: JobStatus;
    tool: JobTool;
    completedDate: Date | null;
}

const jobSchema = new Schema({
    datasetId: Schema.Types.ObjectId,
    datasetRowId: Schema.Types.ObjectId,
    jobHash: {type: String, unique: true},
    type: {type: String, enum: Object.values(JobType)},
    target: {type: String, enum: Object.values(JobTarget)},
    sources: [{type: String, enum: Object.values(JobTarget)}],
    status: {type: String, default: JobStatus.New, enum: Object.values(JobStatus)},
    tool: {type: String, enum: Object.values(JobTool)},
    completedDate: {type: Date, default: null, sparse: true}
}, {
    timestamps: false,
    versionKey: false
});

jobSchema.index({jobHash: 1}, {unique: true, name: 'jobHash_ind_unq_1'});
jobSchema.index({datasetId: 1}, {name: 'datasetId_ind_1'});
jobSchema.index({completedDate: 1}, {expireAfterSeconds: 604800, name: 'completedDate_ttl_1', sparse: true});


export const JobModel = model<JobInterface>('dataset_jobs_test', jobSchema);
