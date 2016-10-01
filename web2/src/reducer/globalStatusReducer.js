const defaultStatus = {
    recording: true
};
import {
    STOP_RECORDING,
    RESUME_RECORDING
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

        default: {
            return state;
        }
    }
}

export default requestListReducer;