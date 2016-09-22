/*
* 页面顶部菜单的组件
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import Style from './header-menu.less';
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
    render () {
        console.info(this.props.data);
        return (
            <div>
                {this.props.data.length}
            </div>
        );
    }
}

export default TablePanel;