import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { Button, LocaleProvider, Icon, Popover } from 'antd';
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
import {
    increaseDisplayRecordLimit,
    updatePanelRefreshing
} from 'action/globalStatusAction';

require('./style/antd-reset.global.less');
import Style from './index.less';
import CommonStyle from './style/common.less';

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
        this.onRecordScroll = this.onRecordScroll.bind(this);
        this.stopRefresh = this.stopRefresh.bind(this);
        this.resumeFresh = this.resumeFresh.bind(this);

        this.recordTableRef = null;
        this.wsListenerRef = null;

        this.lastScrollTop = 0;

        this.stopRefreshTimout = null;
        this.stopRefreshTokenScrollTop = -1; // the token used to decide the move distance
    }

    static propTypes = {
        dispatch: PropTypes.func,
        requestRecord: PropTypes.object,
        globalStatus: PropTypes.object
    }

    stopRefresh () {
        this.wsListenerRef && this.wsListenerRef.stopPanelRefreshing();
    }

    resumeFresh () {
        this.wsListenerRef && this.wsListenerRef.resumePanelRefreshing();
    }

    onResizePanelClose () {
        this.setState({
            showResizePanel: false
        });
    }

    onRecordScroll () {

        if (!this.recordTableRef || !this.wsListenerRef) {
            return;
        }
        const scrollTop = this.recordTableRef.scrollTop;

        if (scrollTop < this.lastScrollTop) {
            if (!this.stopRefreshTimout) {
                this.stopRefreshTokenScrollTop = scrollTop;
            }

            this.stopRefreshTimout = setTimeout(() => {
                // if the scrollbar is scrolled up more than 30px, stop refreshing
                if ((this.stopRefreshTokenScrollTop - scrollTop) > 30) {
                    this.stopRefresh();
                    this.stopRefreshTokenScrollTop = null;
                }
            }, 100);

            // load more previous record when scrolled to top
            if (scrollTop < 2) {
                this.setState({
                    loadingPrev: true
                });
                this.wsListenerRef.loadPrevious();
            }
        } else if (scrollTop > this.lastScrollTop) {
            const recordPanelHeight = this.recordTableRef.firstChild.clientHeight;
            const tableHeight = this.recordTableRef.clientHeight;

            // when close to bottom in less than 30, load more next records
            if (scrollTop + tableHeight + 30 > recordPanelHeight) {
                this.setState({
                    loadingNext: true
                });
                this.wsListenerRef.loadNext();
            }
        }
        this.lastScrollTop = scrollTop;
    }

    getResumeFreshDiv () {
        if (!this.props.globalStatus.showNewRecordTip) {
            return null;
        }

        return (
            <div className={Style.resumeTip} onClick={this.resumeFresh} >
                <div className={CommonStyle.relativeWrapper}>
                    <span>New Records Detected.</span>
                    <span className={Style.arrowDown} />
                </div>
            </div>
        );
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

    componentWillReceiveProps (nextProps) {
        if (nextProps.requestRecord.recordList !== this.props.requestRecord.recordList) {
            this.setState({
                loadingNext: false,
                loadingPrev: false
            });
        }
    }

    render () {
        const { lastActiveRecordId, currentActiveRecordId, filterStr, canLoadMore } = this.props.globalStatus;
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
                    <div
                        className={Style.tableWrapper}
                        ref={(ref) => {this.recordTableRef = ref;}}
                        onScroll={this.onRecordScroll}
                    >
                        <RecordPanel
                            data={this.props.requestRecord.recordList}
                            lastActiveRecordId={lastActiveRecordId}
                            currentActiveRecordId={currentActiveRecordId}
                            dispatch={this.props.dispatch}
                            loadingNext={this.state.loadingNext}
                            loadingPrev={this.state.loadingPrev}
                            stopRefresh={this.stopRefresh}
                        />
                    </div>
                    {this.getResumeFreshDiv()}
                </div>
                <WsListener
                    ref={(ref) => { this.wsListenerRef = ref;}}
                    dispatch={this.props.dispatch}
                    globalStatus={this.props.globalStatus}
                />
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
