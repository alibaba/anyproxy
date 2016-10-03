import requestRecordReducer from './requestRecordReducer';
import globalStatusReducer from './globalStatusReducer';

const defaultState = {
    requestRecord: {
        requestList: [],
        requestDetail: {}
    }
};

export default function(state = defaultState, action) {
    return {
        requestRecord: requestRecordReducer(state.requestRecord, action),
        globalStatus:  globalStatusReducer(state.globalStatus, action)
    };
}