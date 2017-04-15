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
export const UPDATE_ACTIVE_RECORD_ITEM = 'UPDATE_ACTIVE_RECORD_ITEM';
export const UPDATE_GLOBAL_WSPORT = 'UPDATE_GLOBAL_WSPORT';

export const TOGGLE_REMOTE_INTERCEPT_HTTPS = 'TOGGLE_REMOTE_INTERCEPT_HTTPS';
export const UPDATE_LOCAL_INTERCEPT_HTTPS_FLAG = 'UPDATE_LOCAL_INTERCEPT_HTTPS_FLAG';

export const TOGGLE_REMORE_GLOBAL_PROXY_FLAG = 'TOGGLE_REMORE_GLOBAL_PROXY_FLAG';
export const UPDATE_LOCAL_GLOBAL_PROXY_FLAG = 'UPDATE_LOCAL_GLOBAL_PROXY_FLAG';

export const SHOW_ROOT_CA = 'SHOW_ROOT_CA';
export const HIDE_ROOT_CA = 'HIDE_ROOT_CA';

export const UPDATE_CAN_LOAD_MORE = 'UPDATE_CAN_LOAD_MORE';
export const INCREASE_DISPLAY_RECORD_LIST = 'INCREASE_DISPLAY_RECORD_LIST';
export const UPDATE_SHOULD_CLEAR_RECORD = 'UPDATE_SHOULD_CLEAR_RECORD';
export const UPDATE_APP_VERSION = 'UPDATE_APP_VERSION';
export const UPDATE_IS_ROOTCA_EXISTS = 'UPDATE_IS_ROOTCA_EXISTS';

// should we display the tip for new record
export const UPDATE_SHOW_NEW_RECORD_TIP = 'UPDATE_SHOW_NEW_RECORD_TIP';
// update if currently loading the record from server
export const UPDATE_FETCHING_RECORD_STATUS = 'UPDATE_FETCHING_RECORD_STATUS';

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

export function showMapLocal() {
  return {
    type: SHOW_MAP_LOCAL
  };
}

export function hideMapLocal() {
  return {
    type: HIDE_MAP_LOCAL
  };
}

export function fetchDirectory(path) {
  return {
    type: FETCH_DIRECTORY,
    data: path
  };
}

export function updateLocalDirectory(path, sub) {
  return {
    type: UPDATE_LOCAL_DIRECTORY,
    data: {
      path,
      sub
    }
  };
}

export function fetchMappedConfig() {
  return {
    type: FETCH_MAPPED_CONFIG
  };
}

export function updateLocalMappedConfig(config) {
  return {
    type: UPDATE_LOCAL_MAPPED_CONFIG,
    data: config
  };
}

export function updateRemoteMappedConfig(config) {
  return {
    type: UPDATE_REMOTE_MAPPED_CONFIG,
    data: config
  };
}

export function updateActiveRecordItem(id) {
  return {
    type: UPDATE_ACTIVE_RECORD_ITEM,
    data: id
  };
}

export function updateLocalInterceptHttpsFlag(flag) {
  return {
    type: UPDATE_LOCAL_INTERCEPT_HTTPS_FLAG,
    data: flag
  };
}

export function toggleRemoteInterceptHttpsFlag(flag) {
  return {
    type: TOGGLE_REMOTE_INTERCEPT_HTTPS,
    data: flag
  };
}

export function toggleRemoteGlobalProxyFlag(flag) {
  return {
    type: TOGGLE_REMORE_GLOBAL_PROXY_FLAG,
    data: flag
  };
}

export function updateLocalGlobalProxyFlag(flag) {
  return {
    type: UPDATE_LOCAL_GLOBAL_PROXY_FLAG,
    data: flag
  };
}

export function showRootCA() {
  return {
    type: SHOW_ROOT_CA
  };
}

export function hideRootCA() {
  return {
    type: HIDE_ROOT_CA
  };
}

export function updateCanLoadMore(canLoadMore) {
  return {
    type: UPDATE_CAN_LOAD_MORE,
    data: canLoadMore
  };
}

export function increaseDisplayRecordLimit(moreToAdd) {
  return {
    type: INCREASE_DISPLAY_RECORD_LIST,
    data: moreToAdd
  };
}

export function updateShouldClearRecord(shouldClear) {
  return {
    type: UPDATE_SHOULD_CLEAR_RECORD,
    data: shouldClear
  };
}

export function updateLocalAppVersion(version) {
  return {
    type: UPDATE_APP_VERSION,
    data: version
  };
}

export function updateShowNewRecordTip(shouldShow) {
  return {
    type: UPDATE_SHOW_NEW_RECORD_TIP,
    data: shouldShow
  };
}

export function updateIsRootCAExists(exists) {
  return {
    type: UPDATE_IS_ROOTCA_EXISTS,
    data: exists
  };
}

export function updateGlobalWsPort(wsPort) {
  return {
    type: UPDATE_GLOBAL_WSPORT,
    data: wsPort
  }
}

export function updateFechingRecordStatus(isFetching) {
  return {
    type: UPDATE_FETCHING_RECORD_STATUS,
    data: isFetching
  }
}
