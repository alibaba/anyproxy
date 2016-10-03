import requestRecordReducer from './requestRecordReducer';
import globalStatusReducer from './globalStatusReducer';

const defaultState = {
    requestRecord: {
        recordList: [],
        recordDetail: null
    }
};

export default function(state = defaultState, action) {
    return {
        requestRecord: requestRecordReducer(state.requestRecord, action),
        globalStatus:  globalStatusReducer(state.globalStatus, action)
    };
}