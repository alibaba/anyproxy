/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Table } from 'antd';
import { formatDate } from 'common/CommonUtil';

import Style from './table-panel.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class TablePanel extends React.Component {
    constructor () {
        super();
        this.state = {
            active: true
        };
    }
    static propTypes = {
        data: PropTypes.array
    }

    getTr () {

    }
    render () {
        const httpsIcon = <i className="fa fa-lock" />;
        const columns = [
            {
                title: '#',
                width: 50,
                dataIndex: 'id'
            },
            {
                title: 'Method',
                width:100,
                dataIndex: 'method',
                render (text, item) {
                    return <span>{text} {item.protocol === 'https' ? httpsIcon : null}</span>;
                }
            },
            {
                title: 'Code',
                width: 70,
                dataIndex: 'statusCode',
                render(text) {
                    const className = StyleBind({ 'okStatus': text === '200' });
                    return <span className={className} >{text}</span>;
                }
            },
            {
                title: 'Host',
                width: 200,
                dataIndex: 'host'
            },
            {
                title: 'Path',
                dataIndex: 'path'
            },
            {
                title: 'MIME',
                width: 150,
                dataIndex: 'mime'
            },
            {
                title: 'Start',
                width: 100,
                dataIndex: 'startTime',
                render (text) {
                    const timeStr = formatDate(text, 'hh:mm:ss');
                    return <span>{timeStr}</span>;
                }
            }
        ];

        function rowClassFunc (record, index) {
            return StyleBind('row', { 'lightBackgroundColor': index % 2 === 1 });
        }

        return (
            <div className={Style.tableWrapper} >
                <Table
                    columns={columns}
                    dataSource={this.props.data || []}
                    pagination={false}
                    rowKey="id"
                    rowClassName={rowClassFunc}
                />
            </div>
        );
    }
}

export default TablePanel;