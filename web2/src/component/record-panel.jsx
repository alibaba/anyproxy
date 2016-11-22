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

const StyleBind = ClassBind.bind(Style);
const  DEFAULT_MAX_SIZE = 3000; // the default max size of list to display

class RecordPanel extends React.Component {
    constructor () {
        super();

        this.state = {
            maxAllowedRecords: DEFAULT_MAX_SIZE
        };

        this.wsClient = null;

        this.getFilterReg = this.getFilterReg.bind(this);
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

    getFilterReg () {
        let filterReg = null;
        const { filterStr } = this.props.globalStatus;
        if (filterStr) {
            let regFilterStr = filterStr
                .replace(/\r\n/g, '\n')
                .replace(/\n\n/g, '\n');

            // remove the last /\n$/ in case an accidential br
            regFilterStr = regFilterStr.replace(/\n$/, '');

            if(regFilterStr[0] === '/' && regFilterStr[regFilterStr.length -1] === '/') {
                regFilterStr = regFilterStr.substring(1, regFilterStr.length - 2);
            }

            regFilterStr = regFilterStr.replace(/((.+)\n|(.+)$)/g, (matchStr, $1, $2) => {
                // if there is '\n' in the string
                if ($2) {
                    return `(${$2})|`;
                } else {
                    return `(${$1})`;
                }
            });

            try {
                filterReg = new RegExp(regFilterStr);
            } catch(e) {
                console.error(e);
                message.error('failed to parse the filter string: ', this.globalStatus.filter);
            }
        }

        return filterReg;
    }

    getTrs () {

        const trs = [];

        const filterReg = this.getFilterReg();
        const { lastActiveRecordId, currentActiveRecordId } = this.props.globalStatus;
        const { data: recordList } = this.props;

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

            if (filterReg) {
                if (filterReg.test(item.url)) {
                    trs.push(<RecordRow
                        data={item}
                        detailHandler={this.getRecordDetail}
                        className={tableRowStyle}
                        key={item.id}
                    />);
                }

            } else {
                trs.push(<RecordRow
                    data={item}
                    className={tableRowStyle}
                    detailHandler={this.getRecordDetail}
                    key={item.id}
                />);
            }
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

    shouldComponentUpdate (nextProps) {
        const { lastActiveRecordId, currentActiveRecordId, filterStr } = this.props.globalStatus;
        return nextProps.data !== this.props.data
            || nextProps.globalStatus.lastActiveRecordId !== lastActiveRecordId
            || nextProps.globalStatus.currentActiveRecordId !== currentActiveRecordId
            || nextProps.globalStatus.filterStr !== filterStr;
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
