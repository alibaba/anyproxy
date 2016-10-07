import {
    take,
    put,
    call,
    fork
} from 'redux-saga/effects';

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
    updateLocalDirectory,
    updateLocalMappedConfig,
    updateActiveRecordItem
} from 'action/globalStatusAction';

import ApiUtil, { getJSON, postJSON } from 'common/ApiUtil';

function* doFetchRequestList() {
    const data = yield call(getJSON, '/lastestLog');
    yield put(updateWholeRequest(data));
}

function* doFetchDirectory (path = '') {
    const sub = yield call(getJSON, '/filetree', { root: path });
    yield put(updateLocalDirectory(path, sub));
}

function* doFetchMappedConfig () {
    const config = yield call(getJSON, '/getMapConfig');
    yield put(updateLocalMappedConfig(config));
}

function* doFetchRecordBody (record) {
    record = Object.assign({}, record);
    const body = yield call(getJSON, '/fetchBody', { id: record.id });
    record.resBody = body.content;
    yield put(showRecordDetail(record));
}

function* doUpdateRemoteMappedConfig (config) {
    const newConfig = yield call(postJSON, '/setMapConfig', config);
    yield put(updateLocalMappedConfig(newConfig));
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

function * fetchDirectorySaga () {
    while(true) {
        const action = yield take(FETCH_DIRECTORY);
        yield fork(doFetchDirectory, action.data);
    }
}

function * fetchMappedConfigSaga () {
    while (true) {
        yield take(FETCH_MAPPED_CONFIG);
        yield fork(doFetchMappedConfig);
    }
}

function * updateRemoteMappedConfigSaga () {
    while (true) {
        const action = yield take(UPDATE_REMOTE_MAPPED_CONFIG);

        yield fork(doUpdateRemoteMappedConfig, action.data);
    }
}

function * fetchRecordBodySaga () {
    while (true) {
        const action = yield take(FETCH_RECORD_DETAIL);
        // update the global recordItem index
        // ** postponed, as it will not trigger the shoudComponentUpdate
        // yield put(updateActiveRecordItem(action.data.id));

        yield fork(doFetchRecordBody, action.data);
    }
}

export default function* root() {
    yield fork(fetchRequestSaga);
    yield fork(clearRequestRecordSaga);
    yield fork(fetchDirectorySaga);
    yield fork(fetchMappedConfigSaga);
    yield fork(updateRemoteMappedConfigSaga);
    yield fork(fetchRecordBodySaga);
}