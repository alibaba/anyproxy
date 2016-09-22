export const FETCH_REQUEST_LOG = 'FETCH_REQUEST_LOG';
export const UPDATE_WHOLE_REQUEST = 'UPDATE_WHOLE_REQUEST';

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