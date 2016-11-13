/*
* A copoment to for left main menu
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Icon,  } from 'antd';
import { connect } from 'react-redux';

import Style from './left-menu.less';
import ClassBind from 'classnames/bind';

import {
    showFilter,
    showMapLocal,
    showRootCA
} from 'action/globalStatusAction';

import { MenuKeyMap } from 'common/Constant';

const StyleBind = ClassBind.bind(Style);
const {
    RECORD_FILTER: RECORD_FILTER_MENU_KEY,
    MAP_LOCAL: MAP_LOCAL_MENU_KEY,
    ROOT_CA: ROOT_CA_MENU_KEY
} = MenuKeyMap;

class LeftMenu extends React.Component {
    constructor () {
        super();

        this.state = {

        };

        this.showMapLocal = this.showMapLocal.bind(this);
        this.showFilter = this.showFilter.bind(this);
        this.showRootCA = this.showRootCA.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    showMapLocal () {
        this.props.dispatch(showMapLocal());
    }

    showFilter () {
        this.props.dispatch(showFilter());
    }

    showRootCA () {
        this.props.dispatch(showRootCA());
    }

    render () {
        const { mappedConfig, filterStr, activeMenuKey } = this.props.globalStatus;
        const currentMappedConfig = mappedConfig || [];

        const mapLocalMenuStyle = StyleBind('menuItem', {
            'working': currentMappedConfig.length > 0,
            'active': activeMenuKey === MAP_LOCAL_MENU_KEY
        });

        const filterMenuStyle = StyleBind('menuItem', {
            'working': filterStr.length > 0 ,
            'active': activeMenuKey === RECORD_FILTER_MENU_KEY
        });

        const rootCAMenuStyle = StyleBind('menuItem', {
            'active': activeMenuKey === ROOT_CA_MENU_KEY
        });

        return (
            <div className={Style.wrapper} >
                <div className={Style.menuList} >
                    <a
                        className={filterMenuStyle}
                        href="javascript:void(0)"
                        onClick={this.showFilter}
                        title="Only show the filtered result"
                    >
                        <i className="fa fa-filter" />
                        <span>Filter</span>
                    </a>

                    <a
                        className={mapLocalMenuStyle}
                        href="javascript:void(0)"
                        onClick={this.showMapLocal}
                        title="Remap the request to a locale file"
                    >
                        <i className="fa fa-retweet" />
                        <span>Map Local</span>
                    </a>

                    <a
                        className={rootCAMenuStyle}
                        href="javascript:void(0)"
                        onClick={this.showRootCA}
                        title="Download the root CA to the computer and your phone"
                    >
                        <i className="fa fa-download" />
                        <span>RootCA</span>
                    </a>
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

export default connect(select)(LeftMenu);