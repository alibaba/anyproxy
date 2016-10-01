import requestRecordReducer from './requestRecordReducer';
import globalStatusReducer from './globalStatusReducer';

const defaultState = {
    requestList: []
};

export default function(state = defaultState, action) {
    return {
        requestList: requestRecordReducer(state.requestList, action),
        globalStatus:  globalStatusReducer(state.globalStatus, action)
    };
}