import amqp, {Connection, Channel} from 'amqplib';
import {
    RABBITMQ_HOST,
    RABBITMQ_USER,
    RABBITMQ_PASS,
    RABBITMQ_PORT,
    RABBITMQ_JOB_QUEUE_NAME,
    RABBITMQ_JOB_QUEUE_PREFETCH,
    RABBITMQ_JOB_PAUSE_SECONDS,
    NODE_ENV
} from "@config"

import {HandleJobMessage, JobDataInterface} from "@services/rabbitmq/rabbitmq.service.interface";
import {safeJsonParse} from "@system/utils";

export class RabbitMQJobConsumer {
    conn: Connection | null = null
    channel: Channel | null = null
    consumerTag: string = ''
    isPaused: boolean = false
    isConnectionOpen: boolean = false
    isChannelOpen: boolean = false
    handleMessage: HandleJobMessage = () => undefined as any

    setJobHandle(handleMessage: HandleJobMessage) {
        this.handleMessage = handleMessage;
    }

    async connect() {
        this.conn = await amqp.connect(
            `${NODE_ENV === 'local' ? 'amqps' : 'amqp'}://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`
        );
        this.isConnectionOpen = true;
        this.conn.on("close", () => this.isConnectionOpen = false);
        this.conn.on("error", () => this.isConnectionOpen = false);

        this.channel = await this.conn.createChannel(); // Create a channel
        await this.channel.assertQueue(RABBITMQ_JOB_QUEUE_NAME, {durable: true}); // Assert the queue exists
        await this.channel.prefetch(RABBITMQ_JOB_QUEUE_PREFETCH);
        this.isChannelOpen = true;
        this.channel.on("close", () => this.isChannelOpen = false);
        this.channel.on("error", () => this.isChannelOpen = false);
        this.conn.on("data", (a, b, c) => console.log(a, b, c));
        await this.createConsumer()

        process.on('exit', () => {
            console.log("Closing rabbitMQ connection");
            this.isConnectionOpen && this.channel && this.channel.close();
            // Perform cleanup or other necessary tasks here
        });
    }

    status() {
        return {
            connectionOpen: this.isConnectionOpen,
            channelOpen: this.isChannelOpen,
        }
    }

    async messageCount() {
        if (this.channel) {
            const {messageCount} = await this.channel.checkQueue(RABBITMQ_JOB_QUEUE_NAME);
            return messageCount;
        }
        return -1;
    }

    async pauseConsumer(seconds: number) {
        if (this.channel) {
            this.isPaused = true;
            await this.channel.cancel(this.consumerTag);
            console.log(`Pausing consumer for ${seconds} seconds.`)
            setTimeout(async () => {
                try {
                    await this.createConsumer()
                } catch (e) {
                  this.isChannelOpen = false
                }
            }, seconds * 1000)
        }
    }

    async createConsumer() {
        if (this.channel) {
            this.isPaused = false;
            const {consumerTag} = await this.channel.consume(RABBITMQ_JOB_QUEUE_NAME, (msg) => {
                if (this.isPaused && msg !== null) {
                    return this.channel && this.channel.nack(msg, false, true);
                }

                if (msg !== null && msg.content) {
                    const jobData = safeJsonParse<JobDataInterface>(msg.content.toString())
                    if (jobData) {
                        this.handleMessage(
                            msg,
                            jobData,
                            () => {
                                this.channel && this.channel.ack(msg);
                            },
                            async () => {
                                await this.pauseConsumer(RABBITMQ_JOB_PAUSE_SECONDS);
                                this.channel && this.channel.nack(msg, false, true);
                            }
                        );
                    } else {
                        console.error("Failed to parse JSON Message!")
                    }
                }
            }, {noAck: false});
            this.consumerTag = consumerTag;
        }
    }
}

export const rabbitMqConsumer = new RabbitMQJobConsumer()