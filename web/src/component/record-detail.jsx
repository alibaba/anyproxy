/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import ClassBind from 'classnames/bind';
import { Menu, Table, notification, Spin } from 'antd';
import clipboard from 'clipboard-js'
import JsonViewer from 'component/json-viewer';
import ModalPanel from 'component/modal-panel';
import RecordRequestDetail from 'component/record-request-detail';
import RecordResponseDetail from 'component/record-response-detail';
import { hideRecordDetail } from 'action/recordAction';
import { selectText } from 'common/CommonUtil';
import { curlify } from 'common/curlUtil';

import Style from './record-detail.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);
const PageIndexMap = {
  REQUEST_INDEX: 'REQUEST_INDEX',
  RESPONSE_INDEX: 'RESPONSE_INDEX'
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

  getRequestDiv(recordDetail) {
    return <RecordRequestDetail recordDetail={recordDetail} />;
  }

  getResponseDiv(recordDetail) {
    return <RecordResponseDetail recordDetail={recordDetail} />;
  }

  getRecordContentDiv(recordDetail, fetchingRecord) {
    const getMenuBody = () => {
      const menuBody = this.state.pageIndex === PageIndexMap.REQUEST_INDEX ?
        this.getRequestDiv(recordDetail) : this.getResponseDiv(recordDetail);
      return menuBody;
    }

    return (
      <div className={Style.wrapper} >
        <Menu onClick={this.onMenuChange} mode="horizontal" selectedKeys={[this.state.pageIndex]} >
          <Menu.Item key={PageIndexMap.REQUEST_INDEX}>Request</Menu.Item>
          <Menu.Item key={PageIndexMap.RESPONSE_INDEX}>Response</Menu.Item>
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
    const recordDetail = this.props.requestRecord.recordDetail;
    const fetchingRecord = this.props.globalStatus.fetchingRecord;

    if (!recordDetail && !fetchingRecord) {
      return null;
    }
    return this.getRecordContentDiv(recordDetail, fetchingRecord);
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
