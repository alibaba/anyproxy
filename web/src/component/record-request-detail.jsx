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

class RecordRequestDetail extends React.Component {
  constructor() {
    super();
    this.state = {
    };

    this.copyCurlCmd = this.copyCurlCmd.bind(this);
  }

  static propTypes = {
    requestRecord: PropTypes.object
  }

  onSelectText(e) {
    selectText(e.target);
  }

  getLiDivs(targetObj) {
    const liDom = Object.keys(targetObj).map((key) => {
      return (
        <li key={key} className={Style.liItem} >
          <strong>{key} : </strong>
          <span>{targetObj[key]}</span>
        </li>
      );
    });

    return liDom;
  }

  getCookieDiv(cookies) {
    let cookieArray = [];
    if (cookies) {
      const cookieStringArray = cookies.split(';');
      cookieArray = cookieStringArray.map((cookieString) => {
        const cookie = cookieString.split('=');
        return {
          name: cookie[0],
          value: cookie.slice(1).join('=') // cookie的值本身可能含有"=", 此处进行修正
        };
      });
    } else {
      return <div className={Style.noCookes}>No Cookies</div>;
    }
    const columns = [
      {
        title: 'Name',
        dataIndex: 'name',
        width: 300
      },
      {
        title: 'Value',
        dataIndex: 'value'
      }
    ];

    const rowClassFunc = function (record, index) {
      // return index % 2 === 0 ? null : Style.odd;
      return null;
    };

    const locale = {
      emptyText: 'No Cookies'
    };

    return (
      <div className={Style.cookieWrapper} >
        <Table
          columns={columns}
          dataSource={cookieArray}
          pagination={false}
          size="middle"
          rowClassName={rowClassFunc}
          bordered
          locale={locale}
          rowKey="name"
        />
      </div>
    );
  }

  getReqBodyDiv() {
    const { recordDetail } = this.props;
    const requestBody = recordDetail.reqBody;

    const reqDownload = <a href={`/fetchReqBody?id=${recordDetail.id}&_t=${Date.now()}`} target="_blank">download</a>;
    const getReqBodyContent = () => {
      const bodyLength = requestBody.length;
      if (bodyLength > MAXIMUM_REQ_BODY_LENGTH) {
        return reqDownload;
      } else {
        return <div>{requestBody}</div>
      }
    }

    return (
      <div className={Style.reqBody} >
        {getReqBodyContent()}
      </div>
    );
  }

  notify(message, type = 'info', duration = 1.6, opts = {}) {
    notification[type]({ message, duration, ...opts })
  }

  copyCurlCmd() {
    const recordDetail = this.props.recordDetail
    clipboard
      .copy(curlify(recordDetail))
      .then(() => this.notify('COPY SUCCESS', 'success'))
      .catch(() => this.notify('COPY FAILED', 'error'))
  }

  getRequestDiv() {
    const recordDetail = this.props.recordDetail;
    const reqHeader = Object.assign({}, recordDetail.reqHeader);
    const cookieString = reqHeader.cookie || reqHeader.Cookie;
    delete reqHeader.cookie; // cookie will be displayed seperately

    const { protocol, host, path } = recordDetail;
    return (
      <div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>General</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            <li className={Style.liItem} >
              <strong>Method:</strong>
              <span>{recordDetail.method} </span>
            </li>
            <li className={Style.liItem} >
              <strong>URL:</strong>
              <span onClick={this.onSelectText} >{`${protocol}://${host}${path}`} </span>
            </li>
            <li className={Style.liItem} >
              <strong>Protocol:</strong>
              <span >HTTP/1.1</span>
            </li>
          </ul>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            <li className={Style.liItem} >
              <strong>CURL:</strong>
              <span>
                <a href="javascript:void(0)" onClick={this.copyCurlCmd} >copy as CURL</a>
              </span>
            </li>
          </ul>
        </div>
        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Header</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          <ul className={Style.ulItem} >
            {this.getLiDivs(reqHeader)}
          </ul>
        </div>

        <div className={Style.section + ' ' + Style.noBorder} >
          <div >
            <span className={CommonStyle.sectionTitle}>Cookies</span>
          </div>
          {this.getCookieDiv(cookieString)}
        </div>

        <div className={Style.section} >
          <div >
            <span className={CommonStyle.sectionTitle}>Body</span>
          </div>
          <div className={CommonStyle.whiteSpace10} />
          {this.getReqBodyDiv()}
        </div>
      </div>
    );
  }

  render() {
    return this.getRequestDiv();
  }
}

export default RecordRequestDetail;
