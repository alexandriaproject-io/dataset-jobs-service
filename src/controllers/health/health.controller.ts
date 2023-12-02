import {
  ProviderHealthResponse,
  ProviderHealthStatuses,
  ProviderLivelinessResponse,
  ProviderReadyResponse,
  ProviderStatuses,
  ProviderStatusResponse,
} from '@niftylius/simple-status-provider';
import { HealthModel } from '@models/health.model';

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
    const isMongoAlive = await checkMongoLiveliness();
    // ready when nats is connected, sometimes it takes a minute, we dont test afterwards - liveliness takes care of that
    isReady = isReady || isMongoAlive;
    return {
      ready: isReady,
    };
  } catch (e) {
    return { ready: false };
  }
};

export const getLivelinessState = async (): Promise<ProviderLivelinessResponse> => {
  // if alive is false and ready is false - convert alive to true ( assume connecting to nats )
  try {
    const isMongoAlive = await checkMongoLiveliness();
    return {
      alive: isMongoAlive,
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

  return {
    alive: isMongoAlive,
    error: !isMongoAlive,
    ready: true,
    databaseResponseTime: isMongoAlive ? mongoResponseMs : 9999,
    database: isMongoAlive
      ? mongoResponseMs > 60
        ? ProviderStatuses.BUSY
        : ProviderStatuses.OK
      : ProviderStatuses.ERROR,
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
