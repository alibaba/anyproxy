import requestRecordReducer from './requestRecordReducer';

const defaultState = {
    requestList: []
};

export default function(state = defaultState, action) {
    return {
        requestList: requestRecordReducer(state.requestList, action)
    };
}