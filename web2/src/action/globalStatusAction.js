export const STOP_RECORDING = 'STOP_RECORDING';
export const RESUME_RECORDING = 'RESUME_RECORDING';
export const SHOW_FILTER = 'SHOW_FILTER';
export const HIDE_FILTER = 'HIDE_FILTER';
export const UPDATE_FILTER = 'UPDATE_FILTER';
export const SHOW_MAP_LOCAL = 'SHOW_MAP_LOCAL';
export const HIDE_MAP_LOCAL = 'HIDE_MAP_LOCAL';
export const FETCH_DIRECTORY = 'FETCH_DIRECTORY'; // fetch the directory
export const UPDATE_LOCAL_DIRECTORY = 'UPDATE_LOCAL_DIRECTORY';
export const FETCH_MAPPED_CONFIG = 'FETCH_MAPPED_CONFIG';
export const UPDATE_LOCAL_MAPPED_CONFIG = 'UPDATE_LOCAL_MAPPED_CONFIG';
export const UPDATE_REMOTE_MAPPED_CONFIG = 'UPDATE_REMOTE_MAPPED_CONFIG';

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

export function showMapLocal () {
    return {
        type: SHOW_MAP_LOCAL
    };
}

export function hideMapLocal () {
    return {
        type: HIDE_MAP_LOCAL
    };
}

export function fetchDirectory (path) {
    return {
        type: FETCH_DIRECTORY,
        data: path
    };
}

export function updateLocalDirectory (path, sub) {
    return {
        type: UPDATE_LOCAL_DIRECTORY,
        data: {
            path: path,
            sub: sub
        }
    };
}

export function fetchMappedConfig () {
    return {
        type: FETCH_MAPPED_CONFIG
    };
}

export function updateLocalMappedConfig (config) {
    return {
        type: UPDATE_LOCAL_MAPPED_CONFIG,
        data: config
    };
}

export function updateRemoteMappedConfig (config) {
    return {
        type: UPDATE_REMOTE_MAPPED_CONFIG,
        data: config
    };
}