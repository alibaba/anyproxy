import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { Button, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import createSagaMiddleware from 'redux-saga';
import { fetchRequestLog } from 'action/recordAction';

import rootSaga from 'saga/rootSaga';

import reducer from 'reducer/rootReducer';
import HeaderMenu from 'component/header-menu';
import RecordPanel from 'component/record-panel';
import RecordFilter from 'component/record-filter';
import MapLocal from 'component/map-local';
import WsListener from 'component/ws-listener';
import RecordDetail from 'component/record-detail';
import ResizablePanel from 'component/resizable-panel';
import Style from './index.less';

require('./lib/font-awesome/css/font-awesome.css');
require('./style/antd-reset.global.less');

const sagaMiddleware = createSagaMiddleware();
const store = createStore(reducer, applyMiddleware(sagaMiddleware));

sagaMiddleware.run(rootSaga);

const middlePanelIndex = {
    RECORD_FILTER: 'RECORD_FILTER',
    MAP_LOCAL: 'MAP_LOCAL'
};

class App extends React.Component{
    constructor () {
        super();
        this.state = {
            showResizePanel: false,
            panelIndex: ''
        };

        this.onResizePanelClose = this.onResizePanelClose.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        requestRecord: PropTypes.object
    }

    componentDidMount () {
        this.props.dispatch(fetchRequestLog());
    }

    onResizePanelClose () {
        this.setState({
            showResizePanel: false
        });
    }

    render () {


        return (
            <div className={Style.indexWrapper} >
                <ResizablePanel onClose={this.onResizePanelClose} visible={this.state.showResizePanel} >

                </ResizablePanel>
                <RecordFilter />
                <WsListener />
                <MapLocal />
                <div className={Style.rightPanel} >
                    <HeaderMenu />
                    <RecordPanel data={this.props.requestRecord.recordList} />
                    <RecordDetail />
                </div>
            </div>
        );
    }
}


function select (state) {
    return {
        requestRecord: state.requestRecord
    };
}

const ReduxApp = connect(select)(App);

ReactDOM.render(<LocaleProvider locale={enUS}><Provider store={store} ><ReduxApp /></Provider></LocaleProvider>, document.getElementById('root'));
