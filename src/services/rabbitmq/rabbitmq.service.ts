import amqp, { Connection, Channel } from 'amqplib';
import {
  RABBITMQ_HOST,
  RABBITMQ_USER,
  RABBITMQ_PASS,
  RABBITMQ_PORT,
  RABBITMQ_JOB_QUEUE_NAME,
  RABBITMQ_JOB_QUEUE_PREFETCH,
  RABBITMQ_JOB_PAUSE_SECONDS,
  NODE_ENV,
} from '@config';

import { HandleJobMessage, JobDataInterface } from '@services/rabbitmq/rabbitmq.service.interface';
import { safeJsonParse } from '@system/utils';
import { ConsumeMessage } from 'amqplib/properties';

export class RabbitMQJobConsumer {
  conn: Connection | null = null;
  channel: Channel | null = null;
  consumerTag: string = '';
  isPaused: boolean = false;
  isConnectionOpen: boolean = false;
  isChannelOpen: boolean = false;

  // eslint-disable-next-line @typescript-eslint/require-await
  handleMessage: HandleJobMessage = async () => undefined;

  setJobHandle(handleMessage: HandleJobMessage) {
    this.handleMessage = handleMessage;
  }

  async connect() {
    this.conn = await amqp.connect(
      `${NODE_ENV === 'local' ? 'amqps' : 'amqp'}://${RABBITMQ_USER}:${RABBITMQ_PASS}@${RABBITMQ_HOST}:${RABBITMQ_PORT}`
    );

    this.isConnectionOpen = true;
    this.conn.on('close', () => {
      this.isConnectionOpen = false;
    });
    this.conn.on('error', () => {
      this.isConnectionOpen = false;
    });

    this.channel = await this.conn.createChannel(); // Create a channel
    await this.channel.assertQueue(RABBITMQ_JOB_QUEUE_NAME, { durable: true }); // Assert the queue exists
    await this.channel.prefetch(RABBITMQ_JOB_QUEUE_PREFETCH);

    this.isChannelOpen = true;
    this.channel.on('close', () => {
      this.isChannelOpen = false;
    });
    this.channel.on('error', () => {
      this.isChannelOpen = false;
    });

    await this.createConsumer();

    process.on('exit', () => {
      console.info('Closing rabbitMQ connection');
      if (this.isConnectionOpen) this.channel?.close();
    });
  }

  status() {
    return {
      connectionOpen: this.isConnectionOpen,
      channelOpen: this.isChannelOpen,
    };
  }

  async messageCount() {
    if (this.channel) {
      const { messageCount } = await this.channel.checkQueue(RABBITMQ_JOB_QUEUE_NAME);
      return messageCount;
    }
    return -1;
  }

  async pauseConsumer(seconds: number) {
    if (this.channel) {
      this.isPaused = true;
      await this.channel.cancel(this.consumerTag);
      console.info(`Pausing consumer for ${seconds} seconds.`);
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      setTimeout(async () => {
        try {
          await this.createConsumer();
        } catch (e) {
          this.isChannelOpen = false;
        }
      }, seconds * 1000);
    }
  }

  ack(msg: ConsumeMessage) {
    this.channel?.ack(msg);
  }

  async nack(msg: ConsumeMessage) {
    await this.pauseConsumer(RABBITMQ_JOB_PAUSE_SECONDS);
    this.channel?.nack(msg, false, true);
  }

  async createConsumer() {
    if (this.channel) {
      this.isPaused = false;

      const { consumerTag } = await this.channel.consume(
        RABBITMQ_JOB_QUEUE_NAME,
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        async (msg): Promise<void> => {
          if (!msg) {
            console.info('Received empty message');
            return;
          }

          if (this.isPaused) {
            this.channel?.nack(msg, false, true);
            return;
          }

          const jobData = safeJsonParse<JobDataInterface>(msg.content.toString());
          if (!jobData) {
            console.error('Failed to parse JSON Message!');
            await this.nack(msg);
            return;
          }

          try {
            await this.handleMessage(
              msg,
              jobData,
              () => this.ack(msg),
              async () => this.nack(msg)
            );
          } catch (e) {
            console.error(e);
            await this.nack(msg);
          }
        },
        { noAck: false }
      );
      this.consumerTag = consumerTag;
    }
  }
}

export const rabbitMqConsumer = new RabbitMQJobConsumer();
