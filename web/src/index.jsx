import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider, connect } from 'react-redux';
import { LocaleProvider } from 'antd';
import enUS from 'antd/lib/locale-provider/en_US';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'saga/rootSaga';
import { MenuKeyMap } from 'common/Constant';
import { getQueryParameter } from 'common/CommonUtil';

import reducer from 'reducer/rootReducer';
import HeaderMenu from 'component/header-menu';
import RecordPanel from 'component/record-panel';
import RecordFilter from 'component/record-filter';
import MapLocal from 'component/map-local';
import WsListener from 'component/ws-listener';
import RecordDetail from 'component/record-detail';
import LeftMenu from 'component/left-menu';
import DownloadRootCA from 'component/download-root-ca';

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

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      showResizePanel: false,
      panelIndex: '',
      inAppMode: getQueryParameter('in_app_mode'),
      refreshing: true
    };

    this.onResizePanelClose = this.onResizePanelClose.bind(this);
    this.onRecordScroll = this.onRecordScroll.bind(this);
    this.stopRefresh = this.stopRefresh.bind(this);
    this.resumeFresh = this.resumeFresh.bind(this);
    this.detectIfToStopRefreshing = this.detectIfToStopRefreshing.bind(this);
    this.scrollHandler = this.scrollHandler.bind(this);
    this.initRecrodPanelWrapperRef = this.initRecrodPanelWrapperRef.bind(this);

    this.recordTableRef = null;
    this.wsListenerRef = null;

    this.lastScrollTop = 0;

    this.scrollHandlerTimeout = null;
    this.stopRefreshTimout = null;
    this.stopRefreshTokenScrollTop = null; // the token used to decide the move distance
  }

  static propTypes = {
    dispatch: PropTypes.func,
    requestRecord: PropTypes.object,
    globalStatus: PropTypes.object
  }

  stopRefresh() {
    this.wsListenerRef && this.wsListenerRef.stopPanelRefreshing();
    this.state.refreshing = false;
    this.setState({
      refreshing: false
    });
  }

  resumeFresh() {
    this.wsListenerRef && this.wsListenerRef.resumePanelRefreshing();
    this.state.refreshing = true;
    this.setState({
      refreshing: true
    });
  }

  onResizePanelClose() {
    this.setState({
      showResizePanel: false
    });
  }

  // if is scrolling up during refresh, will stop the refresh
  detectIfToStopRefreshing(currentScrollTop) {
    if (!this.stopRefreshTokenScrollTop) {
      this.stopRefreshTokenScrollTop = currentScrollTop;
    }

    this.stopRefreshTimout = setTimeout(() => {
      // if the scrollbar is scrolled up more than 50px, stop refreshing
      if ((this.stopRefreshTokenScrollTop - currentScrollTop) > 50) {
        this.stopRefresh();
        this.stopRefreshTokenScrollTop = null;
      }
    }, 50);
  }

  initRecrodPanelWrapperRef(ref) {
    this.recordTableRef = ref;
    ref.addEventListener('wheel', this.onRecordScroll, { passive: true });
  }

  scrollHandler() {
    if (!this.recordTableRef || !this.wsListenerRef) {
      return;
    }
    const self = this;
    const scrollTop = this.recordTableRef.scrollTop;

    if (scrollTop < this.lastScrollTop || (this.lastScrollTop === 0)) {
      this.detectIfToStopRefreshing(scrollTop);

      // load more previous record when scrolled to top
      if (scrollTop < 10) {
        self.state.loadingPrev = true;
        self.setState({
          loadingPrev: true
        });

        //TODO: hide the loading stauts after 1000 ms, a lazy way to hide it when there is no previous records
        setTimeout(() => {
          self.state.loadingPrev = false;
          self.setState({
            loadingPrev: false
          });
        }, 1000);
        this.wsListenerRef.loadPrevious();
      }
    } else if (scrollTop >= this.lastScrollTop) {
      const recordPanelHeight = this.recordTableRef.firstChild.clientHeight;
      const tableHeight = this.recordTableRef.clientHeight;

      // when close to bottom in less than 30, load more next records
      if (scrollTop + tableHeight + 30 > recordPanelHeight) {
        this.state.loadNext = true;
        this.setState({
          loadingNext: true
        });
        this.wsListenerRef.loadNext();
      }
    }
    this.lastScrollTop = scrollTop;
  }

  onRecordScroll() {
    this.scrollHandlerTimeout && clearTimeout(this.scrollHandlerTimeout);
    this.scrollHandlerTimeout = setTimeout(() => {
      this.scrollHandler();
    }, 60);
  }

  getResumeFreshDiv() {
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

  getMiddlePanel() {
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

  componentWillReceiveProps(nextProps) {
    const { recordList: nextRecordList } = nextProps.requestRecord;
    const { recordList: currentRecordList } = this.props.requestRecord;

    // if there are new data, reset the status of loadingNext and loadingPrev
    if (nextRecordList !== currentRecordList) {
      // scroll the window to last remembered position, when in loading pre mode
      if (this.state.loadingPrev) {
        const nextBeginId = nextRecordList[0].id;
        const currentBeginId = currentRecordList[0].id;

        if (nextBeginId < currentBeginId) {
          // each line is limited to 29px
          const scrollPosition = 29 * (nextRecordList.length - currentRecordList.length);
          if (this.recordTableRef) {
            setTimeout(() => {
              this.recordTableRef.scrollTop = scrollPosition;
            }, 200);
          }
        }

        this.state.loadingPrev = false;
      }

      this.setState({
        loadingNext: false,
        loadingPrev: false
      });
    }
  }

  componentDidUpdate() {
    if (this.state.refreshing && this.recordTableRef && !this.state.loadingPrev) {
      this.recordTableRef.scrollTop = this.recordTableRef.scrollHeight;
    }
  }

  componentDidMount() {
    if (this.state.refreshing && this.recordTableRef) {
      this.recordTableRef.scrollTop = this.recordTableRef.scrollHeight;
    }
  }

  render() {
    const { lastActiveRecordId, currentActiveRecordId } = this.props.globalStatus;
    const leftMenuDiv = (
      <div className={Style.leftPanel} >
        <LeftMenu />
      </div>
    );

    return (
      <div className={Style.indexWrapper} >
        {this.state.inAppMode ? null : leftMenuDiv}
        <div className={Style.middlePanel} >
          {this.getMiddlePanel()}
        </div>
        <div className={Style.rightPanel} >
          <div className={Style.headerWrapper} >
            <HeaderMenu resumeRefreshFunc={this.resumeFresh} />
          </div>
          <div
            className={Style.tableWrapper}
            ref={this.initRecrodPanelWrapperRef}
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
          ref={(ref) => { this.wsListenerRef = ref; }}
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

function select(state) {
  return {
    requestRecord: state.requestRecord,
    globalStatus: state.globalStatus
  };
}

const ReduxApp = connect(select)(App);

ReactDOM.render(
  <LocaleProvider locale={enUS} >
    <Provider store={store} >
      <ReduxApp />
    </Provider>
  </LocaleProvider>, document.getElementById('root'));
