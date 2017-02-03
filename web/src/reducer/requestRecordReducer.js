const defaultState = {
    recordList: [],
    recordDetail: null
};

import {
    UPDATE_WHOLE_REQUEST,
    UPDATE_SINGLE_RECORD,
    CLEAR_ALL_LOCAL_RECORD,
    UPDATE_MULTIPLE_RECORDS,
    SHOW_RECORD_DETAIL,
    HIDE_RECORD_DETAIL
} from 'action/recordAction';

const getRecordInList = function (recordId, recordList) {
    const newRecordList = recordList.slice();
    for (let i = 0; i< newRecordList.length ; i++) {
        const record = newRecordList[i];
        if (record.id === recordId) {
            return record;
        }
    }
};

function requestListReducer (state = defaultState, action) {
    switch (action.type) {
        case UPDATE_WHOLE_REQUEST: {
            const newState = Object.assign({}, state);
            newState.recordList = action.data.slice();
            return newState;
        }

        case UPDATE_SINGLE_RECORD: {

            const newState = Object.assign({}, state);

            const list = newState.recordList.slice();

            list.forEach((item) => {
                item._render = false;
            });

            const record = action.data;

            const index = list.findIndex((item) => {
                return item.id === record.id;
            });

            if (index >= 0) {
                // set the mark to ensure the item get re-rendered
                record._render = true;
                list[index] = record;
            } else {
                list.push(record);
            }

            newState.recordList = list;
            return newState;
        }

        case UPDATE_MULTIPLE_RECORDS: {
            const newState = Object.assign({}, state);
            const list = newState.recordList.slice();

            list.forEach((item) => {
                item._render = false;
            });

            const records = action.data;
            records.forEach((record) => {
                const index = list.findIndex((item) => {
                    return item.id === record.id;
                });

                if (index >= 0) {
                    // set the mark to ensure the item get re-rendered
                    record._render = true;
                    list[index] = record;
                } else {
                    list.push(record);
                }
            });

            newState.recordList = list;
            return newState;
        }

        case CLEAR_ALL_LOCAL_RECORD: {
            const newState = Object.assign({}, state);
            newState.recordList = [];
            return newState;
        }

        case SHOW_RECORD_DETAIL: {
            const newState = Object.assign({}, state);
            const responseBody = action.data;
            const originRecord = getRecordInList(responseBody.id, newState.recordList);
            // 只在id存在的时候，才更新, 否则取消
            if (originRecord) {
                newState.recordDetail =  Object.assign(responseBody, originRecord);
            } else {
                newState.recordDetail = null;
            }

            return newState;
        }

        case HIDE_RECORD_DETAIL: {
            const newState = Object.assign({}, state);
            newState.recordDetail = null;
            return newState;
        }

        default: {
            return state;
        }
    }
}

export default requestListReducer;