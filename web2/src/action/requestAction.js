export const FETCH_REQUEST_LOG = 'FETCH_REQUEST_LOG';
export const UPDATE_WHOLE_REQUEST = 'UPDATE_WHOLE_REQUEST';
export const UPDATE_SINGLE_RECORD = 'UPDATE_SINGLE_RECORD';
export const CLEAR_ALL_RECORD = 'CLEAR_ALL_RECORD';
export const CLEAR_ALL_LOCAL_RECORD = 'CLEAR_ALL_LOCAL_RECORD';

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