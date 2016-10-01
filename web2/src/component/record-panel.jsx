/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table } from 'antd';
import { formatDate } from 'common/CommonUtil';
import RecordRow from 'component/record-row';
import Style from './table-panel.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class RecordPanel extends React.Component {
    constructor () {
        super();
    }
    static propTypes = {
        data: PropTypes.array
    }

    getTrs () {
        const trs = this.props.data.map((item, index) => {
            const tableRow = StyleBind('row', { 'lightBackgroundColor': index % 2 === 1 });
            return <RecordRow data={item} className={tableRow} key={item.id} />;
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

export default RecordPanel;