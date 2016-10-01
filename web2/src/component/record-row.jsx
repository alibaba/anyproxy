/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table, Row, Col } from 'antd';
import { formatDate } from 'common/CommonUtil';

import Style from './record-row.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class RecordRow extends React.Component {
    constructor () {
        super();
    }

    static propTypes = {
        data: PropTypes.object,
        className: PropTypes.string
    }

    getMethodDiv (item) {
        const httpsIcon = <i className="fa fa-lock" />;
        return <span>{item.method} {item.protocol === 'https' ? httpsIcon : null}</span>;
    }

    getCodeDiv (item) {
        const className = StyleBind({ 'okStatus': item.code === '200' });
        return <span className={className} >{item.code}</span>;
    }

    shouldComponentUpdate (nextProps) {
        if (nextProps._shouldRender) {
            nextProps._shouldRender = false;
            return true;
        } else {
            return false;
        }
    }

    render () {
        const data = this.props.data;

        if (!data) {
            return null;
        }

        return (
            <tr className={this.props.className} >
                <td className={Style.id} >{data.id}</td>
                <td className={Style.method} >{this.getMethodDiv(data)}</td>
                <td className={Style.code} >{this.getCodeDiv(data)}</td>
                <td className={Style.host} >{data.host}</td>
                <td className={Style.path} >{data.path}</td>
                <td className={Style.mime} >{data.mime}</td>
                <td className={Style.time} >{formatDate(data.startTime, 'hh:mm:ss')}</td>
            </tr>
        );
    }
}

export default RecordRow;