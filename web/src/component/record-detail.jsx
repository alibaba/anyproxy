/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import ClassBind from 'classnames/bind';
import { Menu, Spin } from 'antd';
import ModalPanel from 'component/modal-panel';
import RecordRequestDetail from 'component/record-request-detail';
import RecordResponseDetail from 'component/record-response-detail';
import RecordWsMessageDetail from 'component/record-ws-message-detail';
import { hideRecordDetail } from 'action/recordAction';

import Style from './record-detail.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);
const PageIndexMap = {
  REQUEST_INDEX: 'REQUEST_INDEX',
  RESPONSE_INDEX: 'RESPONSE_INDEX',
  WEBSOCKET_INDEX: 'WEBSOCKET_INDEX'
};

// the maximum length of the request body to decide whether to offer a download link for the request body
const MAXIMUM_REQ_BODY_LENGTH = 10000;

class RecordDetail extends React.Component {
  constructor() {
    super();
    this.onClose = this.onClose.bind(this);
    this.state = {
      pageIndex: PageIndexMap.REQUEST_INDEX
    };

    this.onMenuChange = this.onMenuChange.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func,
    globalStatus: PropTypes.object,
    requestRecord: PropTypes.object
  }

  onClose() {
    this.props.dispatch(hideRecordDetail());
  }

  onMenuChange(e) {
    this.setState({
      pageIndex: e.key,
    });
  }

  hasWebSocket (recordDetail = {}) {
    return recordDetail && recordDetail.method && recordDetail.method.toLowerCase() === 'websocket';
  }

  getRequestDiv(recordDetail) {
    return <RecordRequestDetail recordDetail={recordDetail} />;
  }

  getResponseDiv(recordDetail) {
    return <RecordResponseDetail recordDetail={recordDetail} />;
  }

  getWsMessageDiv(recordDetail) {
    const { globalStatus } = this.props;
    return <RecordWsMessageDetail recordDetail={recordDetail} />;
  }

  getRecordContentDiv(recordDetail = {}, fetchingRecord) {
    const getMenuBody = () => {
      let menuBody = null;
      switch (this.state.pageIndex) {
        case PageIndexMap.REQUEST_INDEX: {
          menuBody = this.getRequestDiv(recordDetail);
          break;
        }
        case PageIndexMap.RESPONSE_INDEX: {
          menuBody = this.getResponseDiv(recordDetail);
          break;
        }
        case PageIndexMap.WEBSOCKET_INDEX: {
          menuBody = this.getWsMessageDiv(recordDetail);
          break;
        }
        default: {
          menuBody = this.getRequestDiv(recordDetail);
          break;
        }
      }
      return menuBody;
    }

    const websocketMenu = (
      <Menu.Item key={PageIndexMap.WEBSOCKET_INDEX}>WebSocket</Menu.Item>
    );

    return (
      <div className={Style.wrapper} >
        <Menu onClick={this.onMenuChange} mode="horizontal" selectedKeys={[this.state.pageIndex]} >
          <Menu.Item key={PageIndexMap.REQUEST_INDEX}>Request</Menu.Item>
          <Menu.Item key={PageIndexMap.RESPONSE_INDEX}>Response</Menu.Item>
          {this.hasWebSocket(recordDetail) ? websocketMenu : null}
        </Menu>
        <div className={Style.detailWrapper} >
          {fetchingRecord ? this.getLoaingDiv() : getMenuBody()}
        </div>
      </div>
    );
  }

  getLoaingDiv() {
    return (
      <div className={Style.loading}>
        <Spin />
        <div className={Style.loadingText}>LOADING...</div>
      </div>
    );
  }

  getRecordDetailDiv() {
    const { requestRecord, globalStatus } = this.props;
    const recordDetail = requestRecord.recordDetail;
    const fetchingRecord = globalStatus.fetchingRecord;

    if (!recordDetail && !fetchingRecord) {
      return null;
    }
    return this.getRecordContentDiv(recordDetail, fetchingRecord);
  }

  componentWillReceiveProps(nextProps) {
    const { requestRecord } = nextProps;
    const { pageIndex } = this.state;
    // if this is not websocket, reset the index to RESPONSE_INDEX
    if (!this.hasWebSocket(requestRecord.recordDetail) && pageIndex === PageIndexMap.WEBSOCKET_INDEX) {
      this.setState({
        pageIndex: PageIndexMap.RESPONSE_INDEX
      });
    }
  }

  render() {
    return (
      <ModalPanel
        onClose={this.onClose}
        hideBackModal
        visible={this.props.requestRecord.recordDetail !== null}
        left="50%"
      >
        {this.getRecordDetailDiv()}
      </ModalPanel>
    );
  }
}

export default RecordDetail;
