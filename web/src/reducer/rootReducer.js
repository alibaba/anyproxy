import requestRecordReducer from './requestRecordReducer';
import globalStatusReducer from './globalStatusReducer';

const defaultState = {

};

export default function(state = defaultState, action) {
    return {
        requestRecord: requestRecordReducer(state.requestRecord, action),
        globalStatus:  globalStatusReducer(state.globalStatus, action)
    };
}