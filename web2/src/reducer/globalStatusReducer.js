const defaultStatus = {
    recording: true,
    showFilter: false, // if the filter panel is showing
    filterStr: ''
};
import {
    STOP_RECORDING,
    RESUME_RECORDING,
    SHOW_FILTER,
    HIDE_FILTER,
    UPDATE_FILTER
} from 'action/globalStatusAction';

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

        default: {
            return state;
        }
    }
}

export default requestListReducer;