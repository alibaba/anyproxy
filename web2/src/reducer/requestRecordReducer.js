const defaultState = {
    recordList: [],
    recordDetail: null
};

import {
    UPDATE_WHOLE_REQUEST,
    UPDATE_SINGLE_RECORD,
    CLEAR_ALL_LOCAL_RECORD
} from 'action/requestAction';

function requestListReducer (state = defaultState, action) {
    switch (action.type) {
        case UPDATE_WHOLE_REQUEST: {
            console.info('update whole data', action);
            const newState = Object.assign({}, state);
            newState.recordList = action.data;
            return newState;
        }

        case UPDATE_SINGLE_RECORD: {
            const newState = Object.assign({}, state);

            const list = newState.recordList.slice();

            const record = action.data;

            const index = list.findIndex((item) => {
                return item.id === record.id;
            });

            if (index >= 0) {
                // set the mark to ensure the item get re-rendered
                record._render = true;
                list[index] = record;
            } else {
                list.unshift(record);
            }

            newState.recordList = list;
            return newState;
        }

        case CLEAR_ALL_LOCAL_RECORD: {
            console.info('clear local reducer');
            const newState = Object.assign({}, defaultState);
            newState.recordList = [];
            return newState;
        }

        default: {
            return state;
        }
    }
}

export default requestListReducer;