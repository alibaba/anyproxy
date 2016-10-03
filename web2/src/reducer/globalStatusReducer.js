const defaultStatus = {
    recording: true,
    showFilter: false, // if the filter panel is showing
    showMapLocal: false,
    filterStr: '',
    directory: [],
    mappedConfig:[] // configured map config
};

import {
    STOP_RECORDING,
    RESUME_RECORDING,
    SHOW_FILTER,
    HIDE_FILTER,
    UPDATE_FILTER,
    UPDATE_LOCAL_DIRECTORY,
    SHOW_MAP_LOCAL,
    HIDE_MAP_LOCAL,
    UPDATE_LOCAL_MAPPED_CONFIG
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

function requestListReducer (state = defaultStatus, action) {
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
            newState.showFilter = true;
            return newState;
        }

        case HIDE_FILTER: {
            const newState = Object.assign({}, state);
            newState.showFilter = false;
            return newState;
        }

        case UPDATE_FILTER: {
            const newState = Object.assign({}, state);
            newState.filterStr = action.data;
            return newState;
        }

        case SHOW_MAP_LOCAL: {
            const newState = Object.assign({}, state);
            newState.showMapLocal = true;
            return newState;
        }

        case HIDE_MAP_LOCAL: {
            const newState = Object.assign({}, state);
            newState.showMapLocal = false;
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

        default: {
            return state;
        }
    }
}

export default requestListReducer;