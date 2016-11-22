/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table, message, Icon } from 'antd';
import { connect } from 'react-redux';
import { formatDate } from 'common/CommonUtil';
import RecordRow from 'component/record-row';
import Style from './record-panel.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';
import { fetchRecordDetail } from 'action/recordAction';
const RecordPanelWorkder = require('worker-loader?inline!./record-list-diff-worker.jsx');

const StyleBind = ClassBind.bind(Style);
const  DEFAULT_MAX_SIZE = 3000; // the default max size of list to display

const myRecordPanelWorder = new RecordPanelWorkder(window.URL.createObjectURL(new Blob(RecordPanelWorkder)));

class RecordPanel extends React.Component {
    constructor () {
        super();

        this.state = {
            maxAllowedRecords: DEFAULT_MAX_SIZE,
            innerDiffChange: false,
            recordList: []
        };

        this.wsClient = null;

        this.getRecordDetail = this.getRecordDetail.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.addKeyEvent = this.addKeyEvent.bind(this);
        this.loadMore = this.loadMore.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        data: PropTypes.array,
        globalStatus: PropTypes.object
    }

    getRecordDetail (id) {
        this.props.dispatch(fetchRecordDetail(id));
    }

    // get next detail with cursor, to go previous and next
    getNextDetail (cursor) {
        const currentId = this.props.globalStatus.currentActiveRecordId;
        this.props.dispatch(fetchRecordDetail(currentId + cursor));
    }

    onKeyUp (e) {
        if (typeof this.props.globalStatus.currentActiveRecordId === 'number') {
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

    loadMore () {
        this.setState({
            maxAllowedRecords: this.state.maxAllowedRecords + 500
        });
    }

    // with the help of web-worker, diff the data to ensure only when there are changes the component will be rendered
    innerDiff (currentData, nextData, filterStr, limit) {
        const message = {
            limit: limit,
            filterStr: filterStr,
            currentData: currentData,
            nextData: nextData
        };
        myRecordPanelWorder.postMessage(JSON.stringify(message));
    }

    getTrs () {

        const trs = [];

        const { lastActiveRecordId, currentActiveRecordId } = this.props.globalStatus;
        const { recordList } = this.state;

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

    getLoadMoreDiv () {
        if (!this.props.data || this.props.data.length <= this.state.maxAllowedRecords) {
            return null;
        }

        return (
            <div className={Style.laodMore} onClick={this.loadMore} title="Click to show more records" >
                <span><Icon type="plus-circle" />More...</span>
            </div>
        );
    }

    shouldComponentUpdate (nextProps, nextState) {
        const { lastActiveRecordId, currentActiveRecordId, filterStr } = this.props.globalStatus;
        const { filterStr: nextPropFilterStr } = nextProps.globalStatus;

        const secondLevelChange = nextProps.data !== this.props.data
            || nextPropFilterStr !== filterStr
            || nextState.maxAllowedRecords !== this.state.maxAllowedRecords;


        if (nextProps.globalStatus.currentActiveRecordId !== currentActiveRecordId) {
            return true;
        }

        if (!secondLevelChange && !nextState.innerDiffChange) {
            return false;
        }

        // will decide the diff status before update
        if (nextState.innerDiffChange) {
            // reset the mark
            nextState.innerDiffChange = false;
            return true;
        }  else {
            this.innerDiff(this.state.recordList, nextProps.data, nextProps.filterStr, nextState.maxAllowedRecords);
            return false;
        }
    }

    componentDidMount () {
        this.addKeyEvent();
        myRecordPanelWorder.addEventListener('message', (e) => {
            const data = JSON.parse(e.data);
            if (data.shouldUpdate) {
                this.setState({
                    innerDiffChange: true,
                    recordList: data.data
                });
            }
        });
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
                {this.getLoadMoreDiv()}
            </div>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}
export default RecordPanel;
