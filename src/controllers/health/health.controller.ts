import {
  ProviderHealthResponse,
  ProviderHealthStatuses,
  ProviderLivelinessResponse,
  ProviderReadyResponse,
  ProviderStatuses,
  ProviderStatusResponse,
} from '@niftylius/simple-status-provider';
import { HealthModel } from '@models/health.model';
import { rabbitMqConsumer } from '@services/rabbitmq';

const checkMongoLiveliness = async (): Promise<boolean> => {
  try {
    return (await HealthModel.find().lean()).length > 0;
  } catch (e) {
    return false;
  }
};

let isReady = false;
export const getReadyState = async (): Promise<ProviderReadyResponse> => {
  try {
    const { connectionOpen, channelOpen } = rabbitMqConsumer.status();
    const isRabbitReady = connectionOpen && channelOpen;
    const isMongoAlive = await checkMongoLiveliness();
    // ready when nats is connected, sometimes it takes a minute, we dont test afterwards - liveliness takes care of that
    isReady = isReady || (isMongoAlive && isRabbitReady);
    return {
      ready: isReady,
    };
  } catch (e) {
    return { ready: false };
  }
};

const getRabbitMessageCount = async (): Promise<number> => {
  try {
    return await rabbitMqConsumer.messageCount();
  } catch (e) {
    return -1;
  }
};

export const getLivelinessState = async (): Promise<ProviderLivelinessResponse> => {
  // if alive is false and ready is false - convert alive to true ( assume connecting to nats )
  try {
    const [isMongoAlive, rabbitMqMessageCount] = await Promise.all([checkMongoLiveliness(), getRabbitMessageCount()]);
    return {
      alive: isMongoAlive && rabbitMqMessageCount > -1,
    };
  } catch (e) {
    return { alive: !isReady };
  }
};

export const getStatusState = async (): Promise<ProviderStatusResponse> => {
  const mongoResponseStartTime = process.hrtime();
  const isMongoAlive = await checkMongoLiveliness();
  const mongoResponseTime = process.hrtime(mongoResponseStartTime);
  const mongoResponseMs = Number((mongoResponseTime[1] / 1000000).toFixed(3));

  const { connectionOpen, channelOpen } = rabbitMqConsumer.status();
  const isRabbitAlive = connectionOpen && channelOpen;

  const rabbitResponseStartTime = process.hrtime();
  const rabbitMessageCount = isRabbitAlive ? await getRabbitMessageCount() : -1;
  const rabbitResponseMs = Number((rabbitResponseStartTime[1] / 1000000).toFixed(3));

  const { ready } = await getReadyState();
  return {
    ready,
    alive: isMongoAlive && isRabbitAlive,
    error: !isMongoAlive || !isRabbitAlive,
    databaseResponseTime: isMongoAlive ? mongoResponseMs : 9999,
    database: isMongoAlive
      ? mongoResponseMs > 60
        ? ProviderStatuses.BUSY
        : ProviderStatuses.OK
      : ProviderStatuses.ERROR,
    rabbitMq: isRabbitAlive
      ? rabbitResponseMs > 1000
        ? ProviderStatuses.BUSY
        : ProviderStatuses.OK
      : ProviderStatuses.ERROR,
    rabbitMqResponseTime: isRabbitAlive ? rabbitResponseMs : 9999,
    rabbitMqQueueSize: isRabbitAlive ? rabbitMessageCount : -1,
  };
};

export const getHealthState = (): ProviderHealthResponse => ({
  error: false,
  status: ProviderHealthStatuses.HEALTHY,
});

export const getHealthRequest = (): ProviderHealthResponse => ({
  error: false,
  status: ProviderHealthStatuses.HEALTHY,
});
