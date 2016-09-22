import requestListReducer from './requestListReducer';

const defaultState = {
    requestList: []
};

export default function(state = defaultState, action) {
    return {
        requestList: requestListReducer(state.requestList, action)
    };
}