import {
  take,
  put,
  call,
  fork
} from 'redux-saga/effects';
import { message } from 'antd';

import {
  FETCH_REQUEST_LOG,
  CLEAR_ALL_RECORD,
  FETCH_RECORD_DETAIL,
  clearAllLocalRecord,
  updateWholeRequest,
  showRecordDetail
} from 'action/recordAction';

import {
  FETCH_DIRECTORY,
  FETCH_MAPPED_CONFIG,
  UPDATE_REMOTE_MAPPED_CONFIG,
  TOGGLE_REMOTE_INTERCEPT_HTTPS,
  TOGGLE_REMORE_GLOBAL_PROXY_FLAG,
  updateLocalDirectory,
  updateLocalMappedConfig,
  updateActiveRecordItem,
  updateLocalInterceptHttpsFlag,
  updateFechingRecordStatus,
  updateLocalGlobalProxyFlag
} from 'action/globalStatusAction';

import { getJSON, postJSON, isApiSuccess } from 'common/ApiUtil';

function* doFetchRequestList() {
  const data = yield call(getJSON, '/latestLog');
  yield put(updateWholeRequest(data));
}

function* doFetchDirectory(path = '') {
  const sub = yield call(getJSON, '/filetree', { root: path });
  yield put(updateLocalDirectory(path, sub));
}

function* doFetchMappedConfig() {
  const config = yield call(getJSON, '/getMapConfig');
  yield put(updateLocalMappedConfig(config));
}

function* doFetchRecordBody(recordId) {
  // const recordBody = { id: recordId };
  yield put(updateFechingRecordStatus(true));
  const recordBody = yield call(getJSON, '/fetchBody', { id: recordId });
  if (recordBody.method && recordBody.method.toLowerCase() === 'websocket') {
    recordBody.wsMessages = yield call(getJSON, '/fetchWsMessages', { id: recordId});
  }
  recordBody.id = parseInt(recordBody.id, 10);

  yield put(updateFechingRecordStatus(false));
  yield put(updateActiveRecordItem(recordId));
  yield put(showRecordDetail(recordBody));
}

function* doUpdateRemoteMappedConfig(config) {
  const newConfig = yield call(postJSON, '/setMapConfig', config);
  yield put(updateLocalMappedConfig(newConfig));
}


function * doToggleRemoteInterceptHttps(flag) {
  yield call(postJSON, '/api/toggleInterceptHttps', { flag: flag });
  yield put(updateLocalInterceptHttpsFlag(flag));
}

function * doToggleRemoteGlobalProxy(flag) {
  const result = yield call(postJSON, '/api/toggleGlobalProxy', { flag: flag });
  const windowsMessage = 'Sucessfully turned on, it may take up to 1 min to take effect.';
  const linuxMessage = 'Sucessfully turned on.';
  const turnDownMessage = 'Global proxy has been turned down.';
  if (isApiSuccess(result)) {
    const tipMessage = result.isWindows ? windowsMessage : linuxMessage;
    message.success(flag ? tipMessage : turnDownMessage, 3);
    yield put(updateLocalGlobalProxyFlag(flag));
  } else {
    message.error(result.errorMsg, 3);
  }
}

function * fetchRequestSaga() {
  while (true) {
    yield take(FETCH_REQUEST_LOG);
    yield fork(doFetchRequestList);
  }
}

function * clearRequestRecordSaga() {
  while (true) {
    yield take(CLEAR_ALL_RECORD);
    yield put(clearAllLocalRecord());
  }
}

function * fetchDirectorySaga() {
  while (true) {
    const action = yield take(FETCH_DIRECTORY);
    yield fork(doFetchDirectory, action.data);
  }
}

function * fetchMappedConfigSaga() {
  while (true) {
    yield take(FETCH_MAPPED_CONFIG);
    yield fork(doFetchMappedConfig);
  }
}

function * updateRemoteMappedConfigSaga() {
  while (true) {
    const action = yield take(UPDATE_REMOTE_MAPPED_CONFIG);

    yield fork(doUpdateRemoteMappedConfig, action.data);
  }
}

function * fetchRecordBodySaga() {
  while (true) {
    const action = yield take(FETCH_RECORD_DETAIL);

    yield fork(doFetchRecordBody, action.data);
  }
}

function * toggleRemoteInterceptHttpsSaga() {
  while (true) {
    const action = yield take(TOGGLE_REMOTE_INTERCEPT_HTTPS);
    yield fork(doToggleRemoteInterceptHttps, action.data);
  }
}

function * toggleRemoteGlobalProxySaga() {
  while (true) {
    const action = yield take(TOGGLE_REMORE_GLOBAL_PROXY_FLAG);
    yield fork(doToggleRemoteGlobalProxy, action.data);
  }
}

export default function* root() {
  yield fork(fetchRequestSaga);
  yield fork(clearRequestRecordSaga);
  yield fork(fetchDirectorySaga);
  yield fork(fetchMappedConfigSaga);
  yield fork(updateRemoteMappedConfigSaga);
  yield fork(fetchRecordBodySaga);
  yield fork(toggleRemoteInterceptHttpsSaga);
  yield fork(toggleRemoteGlobalProxySaga);
}
