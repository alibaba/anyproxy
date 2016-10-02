import {
    take,
    put,
    call,
    fork
} from 'redux-saga/effects';

import {
    FETCH_REQUEST_LOG,
    CLEAR_ALL_RECORD,
    updateWholeRequest,
    clearAllLocalRecord
} from 'action/requestAction';

import ApiUtil, { getJSON } from 'common/ApiUtil';

function* doFetchRequestList() {
    const data = yield call(getJSON, '/lastestLog');
    yield put(updateWholeRequest(data));
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

export default function* root() {
    yield fork(fetchRequestSaga);
    yield fork(clearRequestRecordSaga);
}