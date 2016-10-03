export const FETCH_REQUEST_LOG = 'FETCH_REQUEST_LOG';
export const UPDATE_WHOLE_REQUEST = 'UPDATE_WHOLE_REQUEST';
export const UPDATE_SINGLE_RECORD = 'UPDATE_SINGLE_RECORD';
export const CLEAR_ALL_RECORD = 'CLEAR_ALL_RECORD';
export const CLEAR_ALL_LOCAL_RECORD = 'CLEAR_ALL_LOCAL_RECORD';
export const FETCH_RECORD_DETAIL = 'FETCH_RECORD_DETAIL';
export const SHOW_RECORD_DETAIL = 'SHOW_RECORD_DETAIL';
export const HIDE_RECORD_DETAIL = 'HIDE_RECORD_DETAIL';

export function fetchRequestLog() {
    return {
        type: FETCH_REQUEST_LOG
    };
}

export function updateWholeRequest(data) {
    return {
        type: UPDATE_WHOLE_REQUEST,
        data: data
    };
}

export function updateRecord(record) {
    return {
        type: UPDATE_SINGLE_RECORD,
        data: record
    };
}

export function clearAllRecord () {
    return {
        type: CLEAR_ALL_RECORD
    };
}

export function clearAllLocalRecord () {
    return {
        type: CLEAR_ALL_LOCAL_RECORD
    };
}

export function fetchRecordDetail (record) {
    return {
        type: FETCH_RECORD_DETAIL,
        data: record
    };
}

export function showRecordDetail (record) {
    return  {
        type: SHOW_RECORD_DETAIL,
        data: record
    };
}

export function hideRecordDetail () {
    return {
        type: HIDE_RECORD_DETAIL
    };
}

