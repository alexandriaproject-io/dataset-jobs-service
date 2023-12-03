import {Schema, model, Document, ObjectId} from 'mongoose';

export enum ProviderType {
    User = 'user',
    Assistant = 'assistant',
    Memory = 'memory',
    Search = 'search',
    Segment = 'segment'
}

export enum StateType {
    New = 'new'
}

export interface Message {
    provider: ProviderType;
    message: string;
}

export interface DatasetRowInterface extends Document {
    _id: ObjectId;
    datasetId: ObjectId;
    rawJsonId: ObjectId | null;
    systemMessage: string;
    contextMessages: string[];
    state: StateType;
    seriesPosition: number;
    messages: Message[];
}

const messageSchema = new Schema<Message>({
    provider: {type: String, enum: Object.values(ProviderType)},
    message: {type: String, required: true}
});

const datasetRowSchema = new Schema<DatasetRowInterface>({
    datasetId: {type: Schema.Types.ObjectId, index: true},
    rawJsonId: {type: Schema.Types.ObjectId, index: true, default: null},
    systemMessage: {type: String, default: ''},
    contextMessages: [String],
    state: {type: String, default: StateType.New, enum: Object.values(StateType)},
    seriesPosition: {type: Number, required: true},
    messages: [messageSchema]
}, {
    timestamps: false,
    versionKey: false
});

datasetRowSchema.index({rawJsonId: 1}, {name: 'rawJsonId_ind_1'});
datasetRowSchema.index({state: 1}, {name: 'state_ind_1'});
datasetRowSchema.index({datasetId: 1}, {name: 'datasetId_ind_1'});


export const DatasetRowModel = model<DatasetRowInterface>('dataset_rows', datasetRowSchema);
