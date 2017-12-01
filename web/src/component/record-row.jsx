/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import { formatDate } from 'common/CommonUtil';

import Style from './record-row.less';
import CommonStyle from '../style/common.less';
import ClassBind from 'classnames/bind';

const StyleBind = ClassBind.bind(Style);

class RecordRow extends React.Component {
  constructor() {
    super();
    this.state = {

    };
  }

  static propTypes = {
    data: PropTypes.object,
    detailHanlder: PropTypes.func,
    className: PropTypes.string
  }

  getMethodDiv(item) {
    const httpsIcon = <div className={Style.https} title="https" />;
    return <div className={CommonStyle.topAlign} ><div>{item.method}</div> {item.protocol === 'https' ? httpsIcon : null}</div>;
  }

  getCodeDiv(item) {
    const statusCode = parseInt(item.statusCode, 10);
    const className = StyleBind({ okStatus: statusCode === 200, errorStatus: statusCode >= 400 });
    return <span className={className} >{item.statusCode}</span>;
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.data._render) {
      nextProps.data._render = false;
      return true;
    } else {
      return false;
    }
  }

  render() {
    const data = this.props.data;

    if (!data) {
      return null;
    }

    return (
      <tr className={this.props.className} onClick={this.props.detailHandler.bind(this, data.id)} >
        <td className={Style.id} >{data.id}</td>
        <td className={Style.method} >{this.getMethodDiv(data)}</td>
        <td className={Style.code} >{this.getCodeDiv(data)}</td>
        <td className={Style.host} >{data.host}</td>
        <td className={Style.path} title={data.path} >{data.path}</td>
        <td className={Style.mime} title={data.mime} >{data.mime}</td>
        <td className={Style.time} >{formatDate(data.startTime, 'hh:mm:ss')}</td>
      </tr>
    );
  }
}

export default RecordRow;
