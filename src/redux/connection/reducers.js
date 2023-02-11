import produce from 'immer';
import i18next from 'i18n';

import {
  UPDATE_CONNECTION_STATUS_REQUESTED,
  UPDATE_CONNECTION_STATUS_COMPLETED,
  UPDATE_QUEUE_STATS_REQUESTED,
  UPDATE_QUEUE_STATS_COMPLETED,
  CHECK_CONNECTION_STATUS_REQUESTED,
  CHECK_CONNECTION_STATUS_COMPLETED,
  CHECK_ABILITIES_REQUESTED,
  CHECK_ABILITIES_COMPLETED,
  CHECK_ABILITIES_ERROR,
} from './actions';

const connection = produce(
  (draft, action) => {
    switch (action.type) {
      case UPDATE_CONNECTION_STATUS_REQUESTED:
        draft.status = UPDATE_CONNECTION_STATUS_REQUESTED;
        break;

      case UPDATE_CONNECTION_STATUS_COMPLETED:
        draft.status = UPDATE_CONNECTION_STATUS_COMPLETED;
        draft.connectionStatus = action.connectionStatus;
        draft.connectionStatusMessage = action.connectionStatusMessage;
        break;

      case UPDATE_QUEUE_STATS_REQUESTED:
        draft.status = UPDATE_QUEUE_STATS_REQUESTED;
        break;

      case UPDATE_QUEUE_STATS_COMPLETED:
        draft.status = UPDATE_QUEUE_STATS_COMPLETED;
        draft.queueStats = action.queueStats;
        break;

      case CHECK_CONNECTION_STATUS_REQUESTED:
        draft.status = CHECK_CONNECTION_STATUS_REQUESTED;
        break;

      case CHECK_CONNECTION_STATUS_COMPLETED:
        draft.status = CHECK_CONNECTION_STATUS_COMPLETED;
        break;

      case CHECK_ABILITIES_REQUESTED:
        draft.status = CHECK_ABILITIES_REQUESTED;
        break;

      case CHECK_ABILITIES_COMPLETED:
        draft.status = CHECK_ABILITIES_COMPLETED;
        draft.abilities = action.abilities;
        break;

      case CHECK_ABILITIES_ERROR:
        draft.status = CHECK_ABILITIES_ERROR;
        break;

      default:
        break;
    }
  },
  {
    connectionStatus: 'dormant',
    connectionStatusMessage: i18next.t('Connecting'),
    queueStats: { RECEIVED: 0, QUEUED: 0, RUNNING: 0, EXECUTING: 0 },
    abilities: [],
    status: '',
  },
);

export default connection;
