/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table, message } from 'antd';
import { connect } from 'react-redux';
import { formatDate } from 'common/CommonUtil';
import RecordRow from 'component/record-row';
import Style from './record-panel.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';
import { fetchRecordDetail } from 'action/recordAction';

const StyleBind = ClassBind.bind(Style);
const DEFAULT_MAX_SIZE = 3000; // the default max size of list to display

class RecordPanel extends React.Component {
    constructor () {
        super();

        this.state = {
        };

        this.wsClient = null;

        this.getRecordDetail = this.getRecordDetail.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.addKeyEvent = this.addKeyEvent.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        data: PropTypes.array,
        lastActiveRecordId: PropTypes.number,
        currentActiveRecordId: PropTypes.number,
        canLoadMore: PropTypes.bool
    }

    getRecordDetail (id) {
        this.props.dispatch(fetchRecordDetail(id));
    }

    // get next detail with cursor, to go previous and next
    getNextDetail (cursor) {
        const currentId = this.props.currentActiveRecordId;
        this.props.dispatch(fetchRecordDetail(currentId + cursor));
    }

    onKeyUp (e) {
        if (typeof this.props.currentActiveRecordId === 'number') {
            // up arrow
            if (e.keyCode === 38) {
                this.getNextDetail(-1);
            }

            // down arrow
            if (e.keyCode === 40) {
                this.getNextDetail(1);
            }
        }
    }

    addKeyEvent () {
        document.addEventListener('keyup', this.onKeyUp);
    }

    getTrs () {

        const trs = [];

        const { lastActiveRecordId, currentActiveRecordId } = this.props;
        const { data:recordList } = this.props;

        const length = recordList.length;
        for (let i = 0 ; i < length; i++) {
            // only display records less than max limit
            if (i >= this.state.maxAllowedRecords) {
                break;
            }

            const item = recordList[i];

            const tableRowStyle = StyleBind('row', {
                'lightBackgroundColor': item.id % 2 === 1,
                'lightColor': item.statusCode === '',
                'activeRow': currentActiveRecordId === item.id
            });

            if (currentActiveRecordId === item.id || lastActiveRecordId === item.id) {
                item._render = true;
            }

            trs.push(<RecordRow
                    data={item}
                    className={tableRowStyle}
                    detailHandler={this.getRecordDetail}
                    key={item.id}
                />);
        }

        return trs;
    }

    shouldComponentUpdate (nextProps) {
        const { lastActiveRecordId, currentActiveRecordId, canLoadMore } = this.props;
        const shouldUpdate = nextProps.data !== this.props.data
            || nextProps.currentActiveRecordId !== currentActiveRecordId;

        return shouldUpdate;
    }

    componentDidMount () {
        this.addKeyEvent();
    }

    render () {

        if (!this.props.data) {
            return null;
        }

        return (
            <div className={Style.wrapper} >
                <div className="ant-table ant-table-small ant-table-scroll-position-left">
                    <div className="ant-table-content">
                        <table className="ant-table-body">
                            <colgroup>
                                <col style={{ 'width': '70px', 'minWidth': '70px' }} />
                                <col style={{ 'width': '100px', 'minWidth': '100px' }} />
                                <col style={{ 'width': '70px', 'minWidth': '70px' }} />
                                <col style={{ 'width': '200px', 'minWidth': '200px' }} />
                                <col />
                                <col style={{ 'width': '150px', 'minWidth': '150px' }} />
                                <col style={{ 'width': '100px', 'minWidth': '100px' }} />
                            </colgroup>
                            <thead className="ant-table-thead">
                                <tr>
                                    <th className={Style.firstRow} >#</th>
                                    <th className={Style.centerRow} >Method</th>
                                    <th className={Style.centerRow} >Code</th>
                                    <th>Host</th>
                                    <th className={Style.pathRow} >Path</th>
                                    <th>Mime</th>
                                    <th>Start</th>
                                </tr>
                            </thead>
                            <tbody className="ant-table-tbody" >
                                {this.getTrs()}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        );
    }
}

export default RecordPanel;
