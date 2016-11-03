/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { Input, Alert, Menu } from 'antd';
import JsonViewer from 'component/json-viewer';
import ModalPanel from 'component/modal-panel';
import { hideRecordDetail } from 'action/recordAction';


import Style from './record-detail.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);
const PageIndexMap = {
    REQUEST_INDEX: 'REQUEST_INDEX',
    RESPONSE_INDEX: 'RESPONSE_INDEX'
};

class RecordDetail extends React.Component {
    constructor () {
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

    onClose () {
        this.props.dispatch(hideRecordDetail());
    }

    onMenuChange (e) {
        this.setState({
            pageIndex: e.key,
        });
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

    getImageBody (recordDetail) {
        return <img src={recordDetail.ref} className={Style.imageBody} />;
    }

    getJsonBody (recordDetail) {
        return <JsonViewer data={recordDetail.resBody} />;
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

        const self = this;

        let reqBodyDiv = <Alert type="info" message={recordDetail.resBody} />;

        switch (recordDetail.type) {
            case 'image': {
                reqBodyDiv = <Alert type="info" message={self.getImageBody(recordDetail)} />;
                break;
            }
            case 'json': {
                reqBodyDiv = self.getJsonBody(recordDetail);
                break;
            }

            default: {
                break;
            }
        }

        return (
            <div className={Style.resBody} >
                {reqBodyDiv}
            </div>
        );
    }

    getRequestDiv (recordDetail) {
        const reqSummary = (
            <span>
                <span>{recordDetail.method}</span>
                <strong title={recordDetail.host + recordDetail.path}> {recordDetail.host + recordDetail.path}</strong>
                <span> HTTP/1.1</span>
            </span>
        );

        return (
            <div>
                <div className={Style.section} >
                    <div >
                        <span className={CommonStyle.sectionTitle}>Header</span>
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
                        <span className={CommonStyle.sectionTitle}>Body</span>
                    </div>
                    <div className={CommonStyle.whiteSpace10} />
                    {this.getReqBodyDiv()}
                </div>
            </div>
        );
    }

    getResponseDiv (recordDetail) {

        const statusStyle = StyleBind({ 'okStatus': recordDetail.statusCode === 200 });

        const resSummary =(
            <span>
                <span>HTTP/1.1 </span>
                <span className={statusStyle} > {recordDetail.statusCode} </span>
            </span>
        );

        return (
            <div>
                <div className={Style.section} >
                    <div >
                        <span className={CommonStyle.sectionTitle}>Header</span>
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
                        <span className={CommonStyle.sectionTitle}>Body</span>
                    </div>
                    <div className={CommonStyle.whiteSpace10} />
                    {this.getResBodyDiv()}
                </div>
            </div>
        );
    }

    getRecordDetailDiv () {
        const recordDetail = this.props.requestRecord.recordDetail;
        if (!recordDetail) {
            return null;
        }

        const menuBody = this.state.pageIndex === PageIndexMap.REQUEST_INDEX ?
            this.getRequestDiv(recordDetail) : this.getResponseDiv(recordDetail);
        return (
            <div className={Style.wrapper} >
                <Menu onClick={this.onMenuChange} mode="horizontal" selectedKeys={[this.state.pageIndex]} >
                    <Menu.Item key={PageIndexMap.REQUEST_INDEX}>Request</Menu.Item>
                    <Menu.Item key={PageIndexMap.RESPONSE_INDEX}>Preview</Menu.Item>
                </Menu>
                <div className={Style.detailWrapper} >
                    {menuBody}
                </div>
            </div>
        );
    }

    render() {
        return (
            <ModalPanel onClose={this.onClose} visible={this.props.requestRecord.recordDetail !== null } left="40%">
                {this.getRecordDetailDiv()}
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
