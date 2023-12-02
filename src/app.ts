import { connect } from 'mongoose';
import { startStatusProvider } from '@niftylius/simple-status-provider';
import {
  MONGO_CONNECTION_STRING,
  STATUS_PORT,
  NODE_ENV,
} from '@config';
import { getHealthState, getLivelinessState, getReadyState, getStatusState } from '@controllers/health';

(async (): Promise<void> => {
  try {
    await connect(MONGO_CONNECTION_STRING);

    await startStatusProvider({
      port: STATUS_PORT,
      natsEnabled: false,
      readiness: getReadyState,
      liveliness: getLivelinessState,
      health: getHealthState,
      status: getStatusState,
    });

    if (NODE_ENV === 'local') {
      console.info(`Status running at: http://localhost:${STATUS_PORT}/status`);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
