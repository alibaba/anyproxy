const defaultStatus = {
  recording: true,
  panelRefreshing: true,  // indicate whether the record panel should be refreshing
  showFilter: false, // if the filter panel is showing
  showMapLocal: false,
  activeMenuKey: '',
  canLoadMore: false,
  interceptHttpsFlag: false,
  globalProxyFlag: false, // is global proxy now
  filterStr: '',
  directory: [],
  lastActiveRecordId: -1,
  currentActiveRecordId: -1,
  shouldClearAllRecord: false,
  appVersion: '',
  panelLoadingNext: false,
  panelLoadingPrev: false,
  showNewRecordTip: false,
  isRootCAFileExists: false,
  fetchingRecord: false,
  wsPort: null,
  mappedConfig:[] // configured map config
};

import { MenuKeyMap } from 'common/Constant';

import {
  STOP_RECORDING,
  RESUME_RECORDING,
  SHOW_FILTER,
  HIDE_FILTER,
  UPDATE_FILTER,
  UPDATE_LOCAL_DIRECTORY,
  SHOW_MAP_LOCAL,
  HIDE_MAP_LOCAL,
  UPDATE_LOCAL_MAPPED_CONFIG,
  UPDATE_ACTIVE_RECORD_ITEM,
  UPDATE_LOCAL_INTERCEPT_HTTPS_FLAG,
  UPDATE_LOCAL_GLOBAL_PROXY_FLAG,
  HIDE_ROOT_CA,
  SHOW_ROOT_CA,
  UPDATE_CAN_LOAD_MORE,
  INCREASE_DISPLAY_RECORD_LIST,
  UPDATE_SHOULD_CLEAR_RECORD,
  UPDATE_APP_VERSION,
  UPDATE_IS_ROOTCA_EXISTS,
  UPDATE_SHOW_NEW_RECORD_TIP,
  UPDATE_GLOBAL_WSPORT,
  UPDATE_FETCHING_RECORD_STATUS
} from 'action/globalStatusAction';

// The map to save the mapping relationships of the path and it's location in the tree node
const directoryNodeMap = {};

// The map to store all the directory in a tree way
let direcotryList = [];

function getTreeMap(path, sub) {

  const children = [];
  sub.directory.forEach((item) => {
    if (!(item.name.indexOf('.') === 0)) {
      item.isLeaf = false;
      directoryNodeMap[item.fullPath] = item;
      children.push(item);
    }
  });

  sub.file.forEach((item) => {
    if (!(item.name.indexOf('.') === 0)) {
      item.isLeaf = true;
      directoryNodeMap[item.fullPath] = item;
      children.push(item);
    }
  });

  if (!path) {
    direcotryList = children;
  } else {
    directoryNodeMap[path].children = children;
  }

  return direcotryList;
}

function requestListReducer(state = defaultStatus, action) {
  switch (action.type) {
    case STOP_RECORDING: {
      const newState = Object.assign({}, state);
      newState.recording = false;
      return newState;
    }

    case RESUME_RECORDING: {
      const newState = Object.assign({}, state);
      newState.recording = true;
      return newState;
    }

    case SHOW_FILTER: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = MenuKeyMap.RECORD_FILTER;
      return newState;
    }

    case HIDE_FILTER: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = '';
      return newState;
    }

    case UPDATE_FILTER: {
      const newState = Object.assign({}, state);
      newState.filterStr = action.data;
      return newState;
    }

    case SHOW_MAP_LOCAL: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = MenuKeyMap.MAP_LOCAL;
      return newState;
    }

    case HIDE_MAP_LOCAL: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = '';
      return newState;
    }

    case UPDATE_LOCAL_DIRECTORY: {
      const newState = Object.assign({}, state);
      const { path, sub } = action.data;

      newState.directory = getTreeMap(path, sub);
      return newState;
    }

    case UPDATE_LOCAL_MAPPED_CONFIG: {
      const newState = Object.assign({}, state);
      newState.mappedConfig = action.data;

      return newState;
    }

    case UPDATE_ACTIVE_RECORD_ITEM: {
      const newState = Object.assign({}, state);
      newState.lastActiveRecordId = state.currentActiveRecordId;
      newState.currentActiveRecordId = action.data;
      return newState;
    }

    case UPDATE_LOCAL_INTERCEPT_HTTPS_FLAG: {
      const newState = Object.assign({}, state);
      newState.interceptHttpsFlag = action.data;
      return newState;
    }

    case UPDATE_LOCAL_GLOBAL_PROXY_FLAG: {
      const newState = Object.assign({}, state);
      newState.globalProxyFlag = action.data;
      return newState;
    }

    case SHOW_ROOT_CA: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = MenuKeyMap.ROOT_CA;
      return newState;
    }

    case HIDE_ROOT_CA: {
      const newState = Object.assign({}, state);
      newState.activeMenuKey = '';
      return newState;
    }

    case UPDATE_CAN_LOAD_MORE: {
      const newState = Object.assign({}, state);
      newState.canLoadMore = action.data;
      return newState;
    }

    case UPDATE_SHOULD_CLEAR_RECORD: {
      const newState = Object.assign({}, state);
      newState.shouldClearAllRecord = action.data;
      return newState;
    }

    case INCREASE_DISPLAY_RECORD_LIST: {
      const newState = Object.assign({}, state);
      newState.displayRecordLimit += action.data;
      return newState;
    }

    case UPDATE_APP_VERSION: {
      const newState = Object.assign({}, state);
      newState.appVersion = action.data;
      return newState;
    }

    case UPDATE_SHOW_NEW_RECORD_TIP: {
      const newState = Object.assign({}, state);
      newState.showNewRecordTip = action.data;
      return newState;
    }

    case UPDATE_IS_ROOTCA_EXISTS: {
      const newState = Object.assign({}, state);
      newState.isRootCAFileExists = action.data;
      return newState;
    }

    case UPDATE_GLOBAL_WSPORT: {
      const newState = Object.assign({}, state);
      newState.wsPort = action.data;
      return newState;
    }

    case UPDATE_FETCHING_RECORD_STATUS: {
      const newState = Object.assign({}, state);
      newState.fetchingRecord = action.data;
      return newState;
    }

    default: {
      return state;
    }
  }
}

export default requestListReducer;