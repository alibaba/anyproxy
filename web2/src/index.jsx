import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { Button } from 'antd';
import createSagaMiddleware from 'redux-saga';
import { fetchRequestLog } from 'action/requestAction';

import rootSaga from './saga/requestSaga';

import reducer from './reducer';
import HeaderMenu from './component/header-menu';
import TablePanel from './component/table-panel';
import Style from './index.less';

require('./lib/font-awesome/css/font-awesome.css');
require('./style/antd-reset.global.less');

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

class App extends React.Component{
    constructor () {
        super();

    }

    static propTypes = {
        dispatch: PropTypes.func,
        requestList: PropTypes.array
    }

    componentDidMount () {
        this.props.dispatch(fetchRequestLog());
    }

    render () {
        return (
            <div>
                <HeaderMenu />
                <TablePanel data={this.props.requestList} />
                <div> <Button type="primary">something</Button></div>
            </div>
        );
    }
}


function select (state) {
    return {
        requestList: state.requestList
    };
}

const ReduxApp = connect(select)(App);

ReactDOM.render(<Provider store={store} ><ReduxApp /></Provider>, document.getElementById('root'));