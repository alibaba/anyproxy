const defaultList = [];
import {
    UPDATE_WHOLE_REQUEST,
    UPDATE_SINGLE_RECORD
} from 'action/requestAction';

function requestListReducer (state = defaultList, action) {
    switch (action.type) {
        case UPDATE_WHOLE_REQUEST: {
            console.info('update whole data', action);
            return action.data;
        }

        case UPDATE_SINGLE_RECORD: {
            const list = state.slice();

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
            return list;
        }

        default: {
            return state;
        }
    }
}

export default requestListReducer;