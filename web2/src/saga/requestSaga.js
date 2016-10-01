import {
    take,
    put,
    call,
    fork
} from 'redux-saga/effects';
import * as RequestAction from 'action/requestAction';

import ApiUtil, { getJSON } from 'common/ApiUtil';

function* doFetchRequestList() {
    const data = yield call(getJSON, '/lastestLog');
    yield put(RequestAction.updateWholeRequest(data));
}

function* fetchRequestSaga() {
    while (true) {
        yield take(RequestAction.FETCH_REQUEST_LOG);
        yield fork(doFetchRequestList);
    }
}

export default function* root() {
    yield fork(fetchRequestSaga);
}