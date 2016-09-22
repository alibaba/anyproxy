const defaultList = [];
import { UPDATE_WHOLE_REQUEST } from 'action/requestAction';

function requestListReducer (state = defaultList, action) {
    switch (action.type) {
    case UPDATE_WHOLE_REQUEST: {
        console.info('update whole data', action);
        return action.data;
    }

    default: {
        return state;
    }
    }
}

export default requestListReducer;