/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { Input, Alert } from 'antd';
import ModalPanel from 'component/modal-panel';
import { hideRecordDetail } from 'action/recordAction';


import Style from './record-detail.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class RecordDetail extends React.Component {
    constructor () {
        super();
        this.onClose = this.onClose.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object,
        requestRecord: PropTypes.object
    }

    onClose () {
        this.props.dispatch(hideRecordDetail());
    }

    getLiDivs (targetObj) {
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

    getReqBodyDiv () {
        const { recordDetail } = this.props.requestRecord;
        return (
            <div className={Style.reqBody} >
                <Alert type="info" message={recordDetail.reqBody} />
            </div>
        );
    }

    getResBodyDiv () {
        const { recordDetail } = this.props.requestRecord;

        return (
            <div className={Style.resBody} >
                <Alert type="info" message={recordDetail.resBody} />
            </div>
        );
    }

    render() {

        const recordDetail = this.props.requestRecord.recordDetail;
        if (!recordDetail) {
            return null;
        }

        const statusStyle = StyleBind({ 'okStatus': recordDetail.statusCode === 200 });
        const reqSummary = (
            <span>
                <span>{recordDetail.method}</span>
                <span title={recordDetail.path}> {recordDetail.path}</span>
                <span> HTTP/1.1</span>
            </span>
        );

        const resSummary =(
            <span>
                <span>HTTP/1.1 </span>
                <span className={statusStyle} > {recordDetail.statusCode} </span>
            </span>
        );

        return (
            <ModalPanel onClose={this.onClose} visible left="40%">
                <div className={Style.detailWrapper} >
                    <div className={Style.section} >
                        <div >
                            <span className={CommonStyle.sectionTitle}>Request Header</span>
                        </div>
                        <div className={CommonStyle.whiteSpace10} />
                        <ul>
                            <li>
                               <Alert type="success" message={reqSummary} />
                            </li>
                            {this.getLiDivs(recordDetail.reqHeader)}
                        </ul>
                    </div>

                    <div className={Style.section} >
                        <div >
                            <span className={CommonStyle.sectionTitle}>Request Body</span>
                        </div>
                        <div className={CommonStyle.whiteSpace10} />
                        {this.getReqBodyDiv()}
                    </div>

                    <div className={Style.section} >
                        <div >
                            <span className={CommonStyle.sectionTitle}>Response Header</span>
                        </div>
                        <div className={CommonStyle.whiteSpace10} />
                        <ul>
                            <li >
                               <Alert type="success" message={resSummary} />
                            </li>
                            {this.getLiDivs(recordDetail.resHeader)}
                        </ul>
                    </div>

                    <div className={Style.section} >
                        <div >
                            <span className={CommonStyle.sectionTitle}>Response Body</span>
                        </div>
                        <div className={CommonStyle.whiteSpace10} />
                        {this.getResBodyDiv()}
                    </div>

                </div>

            </ModalPanel>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus,
        requestRecord: state.requestRecord
    };
}

export default connect(select)(RecordDetail);
