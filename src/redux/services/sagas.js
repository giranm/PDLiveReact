import {
  put, call, takeLatest,
} from 'redux-saga/effects';

import i18next from 'i18n';

import {
  pd,
} from 'util/pd-api-wrapper';
import {
  UPDATE_CONNECTION_STATUS_REQUESTED,
} from 'redux/connection/actions';
import {
  FETCH_EXTENSIONS_REQUESTED,
} from 'redux/extensions/actions';
import {
  FETCH_SERVICES_REQUESTED,
  FETCH_SERVICES_COMPLETED,
  FETCH_SERVICES_ERROR,
} from './actions';

export function* getServicesAsync() {
  yield takeLatest(FETCH_SERVICES_REQUESTED, getServices);
}

export function* getServices(action) {
  try {
    //  Create params and call pd lib
    const {
      teamIds,
    } = action;
    const params = { limit: 100 };
    if (teamIds.length) params['team_ids[]'] = teamIds;

    const response = yield call(pd.all, 'services', { data: { ...params } });
    if (response.status !== 200) {
      throw Error(i18next.t('Unable to fetch services'));
    }

    yield put({
      type: FETCH_SERVICES_COMPLETED,
      services: response.resource,
    });

    // We now obtain extensions for mapping once services have been fetched
    yield put({ type: FETCH_EXTENSIONS_REQUESTED });
  } catch (e) {
    // Handle API auth failure
    if (e.status === 401) {
      e.message = i18next.t('Unauthorized Access');
    }
    yield put({ type: FETCH_SERVICES_ERROR, message: e.message });
    yield put({
      type: UPDATE_CONNECTION_STATUS_REQUESTED,
      connectionStatus: 'neutral',
      connectionStatusMessage: e.message,
    });
  }
}
