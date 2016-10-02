export const STOP_RECORDING = 'STOP_RECORDING';
export const RESUME_RECORDING = 'RESUME_RECORDING';
export const SHOW_FILTER = 'SHOW_FILTER';
export const HIDE_FILTER = 'HIDE_FILTER';
export const UPDATE_FILTER = 'UPDATE_FILTER';

export function stopRecording() {
    return {
        type: STOP_RECORDING
    };
}

export function resumeRecording() {
    return {
        type: RESUME_RECORDING
    };
}

export function showFilter() {
    return {
        type: SHOW_FILTER
    };
}

export function hideFilter() {
    return {
        type: HIDE_FILTER
    };
}

export function updateFilter(filterStr) {
    return {
        type: UPDATE_FILTER,
        data: filterStr
    };
}