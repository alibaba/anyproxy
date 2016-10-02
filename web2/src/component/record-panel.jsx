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

const StyleBind = ClassBind.bind(Style);

class RecordPanel extends React.Component {
    constructor () {
        super();

        this.getFilterReg = this.getFilterReg.bind(this);
    }
    static propTypes = {
        data: PropTypes.array,
        globalStatus: PropTypes.object
    }

    getFilterReg () {
        let filterReg = null;
        const { filterStr } = this.props.globalStatus;
        if (filterStr) {
            let regFilterStr = filterStr
                .replace(/\r\n/g, '\n')
                .replace(/\n\n/g, '\n');

            if(regFilterStr[0] === '/' && regFilterStr[regFilterStr.length -1] === '/') {
                regFilterStr = regFilterStr.substring(1, regFilterStr.length - 2);
            }

            regFilterStr = regFilterStr.replace(/((.+)\n|(.+)$)/g, (matchStr, $1, $2) => {
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

        this.props.data.forEach((item, index) => {
            const tableRow = StyleBind('row', {
                'lightBackgroundColor': index % 2 === 1,
                'lightColor': item.statusCode === ''
            });

            if (filterReg) {
                if (filterReg.test(item.url)) {
                    trs.push(<RecordRow data={item} className={tableRow} key={item.id} />);
                }

            } else {
                trs.push(<RecordRow data={item} className={tableRow} key={item.id} />);
            }
        });

        return trs;
    }

    render () {

        if (!this.props.data) {
            return null;
        }

        return (
            <div className={Style.tableWrapper} >
                <div className="ant-table ant-table-large ant-table-scroll-position-left">
                    <div className="ant-table-content">
                        <table className="ant-table-body" >
                            <colgroup>
                                <col style={{ 'width': '50px', 'minWidth': '50px' }} />
                                <col style={{ 'width': '100px', 'minWidth': '100px' }} />
                                <col style={{ 'width': '70px', 'minWidth': '70px' }} />
                                <col style={{ 'width': '200px', 'minWidth': '200px' }} />
                                <col />
                                <col style={{ 'width': '150px', 'minWidth': '150px' }} />
                                <col style={{ 'width': '100px', 'minWidth': '100px' }} />
                            </colgroup>
                            <thead className="ant-table-thead">
                                <tr>
                                    <th>#</th>
                                    <th>Method</th>
                                    <th>Code</th>
                                    <th>Host</th>
                                    <th>Path</th>
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

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}
export default connect(select)(RecordPanel);
