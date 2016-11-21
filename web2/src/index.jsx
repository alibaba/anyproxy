import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { Button, LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'saga/rootSaga';
import { fetchRequestLog } from 'action/recordAction';
import { MenuKeyMap } from 'common/Constant';

import reducer from 'reducer/rootReducer';
import HeaderMenu from 'component/header-menu';
import RecordPanel from 'component/record-panel';
import RecordFilter from 'component/record-filter';
import MapLocal from 'component/map-local';
import WsListener from 'component/ws-listener';
import RecordDetail from 'component/record-detail';
import ResizablePanel from 'component/resizable-panel';
import LeftMenu from 'component/left-menu';
import DownloadRootCA from 'component/download-root-ca';

require('./lib/font-awesome/css/font-awesome.css');
require('./style/antd-reset.global.less');
import Style from './index.less';

const {
    RECORD_FILTER: RECORD_FILTER_MENU_KEY,
    MAP_LOCAL: MAP_LOCAL_MENU_KEY,
    ROOT_CA: ROOT_CA_MENU_KEY
} = MenuKeyMap;
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
        requestRecord: PropTypes.object,
        globalStatus: PropTypes.object
    }

    componentDidMount () {
        this.props.dispatch(fetchRequestLog());
    }

    onResizePanelClose () {
        this.setState({
            showResizePanel: false
        });
    }

    getMiddlePanel () {
        const { activeMenuKey } = this.props.globalStatus;
        let middlePanel = null;

        // TODO: move the logic of resizepanel out to here, keep each panel component independant
        switch (activeMenuKey) {
            case RECORD_FILTER_MENU_KEY: {
                middlePanel = <RecordFilter />;
                break;
            }

            case MAP_LOCAL_MENU_KEY: {
                middlePanel = <MapLocal />;
                break;
            }

            case ROOT_CA_MENU_KEY: {
                middlePanel = <DownloadRootCA />;
                break;
            }

            default: {
                middlePanel = null;
                break;
            }
        }

        return middlePanel;
    }

    render () {
        return (
            <div className={Style.indexWrapper} >
                <div className={Style.leftPanel} >
                    <LeftMenu />
                </div>
                <div className={Style.middlePanel} >
                    {this.getMiddlePanel()}
                </div>
                <div className={Style.rightPanel} >
                    <div className={Style.headerWrapper} >
                        <HeaderMenu />
                    </div>
                    <div className={Style.tableWrapper} >
                        <RecordPanel
                            data={this.props.requestRecord.recordList}
                            globalStatus={this.props.globalStatus}
                            dispatch={this.props.dispatch}
                        />
                    </div>
                </div>
                <WsListener />
                <RecordDetail
                    globalStatus={this.props.globalStatus}
                    requestRecord={this.props.requestRecord}
                    dispatch={this.props.dispatch}
                />
            </div>
        );
    }
}

function select (state) {
    return {
        requestRecord: state.requestRecord,
        globalStatus: state.globalStatus
    };
}

const ReduxApp = connect(select)(App);

ReactDOM.render(
    <LocaleProvider
        locale={enUS}>
        <Provider
            store={store} >
                <ReduxApp />
        </Provider>
    </LocaleProvider>, document.getElementById('root'));
