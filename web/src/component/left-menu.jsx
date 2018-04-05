/*
* A copoment to for left main menu
*/

import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import InlineSVG from 'svg-inline-react';
import { getQueryParameter } from 'common/CommonUtil';

import Style from './left-menu.less';
import ClassBind from 'classnames/bind';

import {
  showFilter,
  showRootCA
} from 'action/globalStatusAction';

import { MenuKeyMap } from 'common/Constant';

const StyleBind = ClassBind.bind(Style);
const {
  RECORD_FILTER: RECORD_FILTER_MENU_KEY,
  ROOT_CA: ROOT_CA_MENU_KEY
} = MenuKeyMap;

class LeftMenu extends React.Component {
  constructor() {
    super();

    this.state = {
      inAppMode: getQueryParameter('in_app_mode')
    };

    // this.showMapLocal = this.showMapLocal.bind(this);
    this.showFilter = this.showFilter.bind(this);
    this.showRootCA = this.showRootCA.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func,
    globalStatus: PropTypes.object
  }

  // showMapLocal() {
  //     this.props.dispatch(showMapLocal());
  // }

  showFilter() {
    this.props.dispatch(showFilter());
  }

  showRootCA() {
    this.props.dispatch(showRootCA());
  }

  render() {
    const { filterStr, activeMenuKey, recording } = this.props.globalStatus;

    const filterMenuStyle = StyleBind('menuItem', {
      working: filterStr.length > 0,
      active: activeMenuKey === RECORD_FILTER_MENU_KEY
    });

    const rootCAMenuStyle = StyleBind('menuItem', {
      active: activeMenuKey === ROOT_CA_MENU_KEY
    });

    const wrapperStyle = StyleBind('wrapper', { inApp: this.state.inAppMode });
    const circleStyle = StyleBind('circles', { active: recording, stop: !recording });

    return (
      <div className={wrapperStyle} >
        <div className={Style.logo} >
          <div className={Style.brand} >
            <span className={Style.any}>Any</span>
            <span className={Style.proxy}>Proxy</span>
          </div>
          <div className={circleStyle} >
            <span className={Style.circle1} />
            <span className={Style.circle2} />
            <span className={Style.circle3} />
            <span className={Style.circle4} />
            <span className={Style.circle5} />
            <span className={Style.circle6} />
            <span className={Style.circle7} />
          </div>
        </div>
        <div className={Style.menuList} >
          <a
            className={filterMenuStyle}
            href="javascript:void(0)"
            onClick={this.showFilter}
            title="Only show the filtered result"
          >
            <span className={Style.filterIcon}>
              <InlineSVG src={require('svg-inline-loader!assets/filter.svg')} />
            </span>
            <span>Filter</span>
          </a>

          <a
            className={rootCAMenuStyle}
            href="javascript:void(0)"
            onClick={this.showRootCA}
            title="Download the root CA to the computer and your phone"
          >
            <span className={Style.downloadIcon}>
              <InlineSVG src={require('svg-inline-loader!assets/download.svg')} />
            </span>
            <span>RootCA</span>
          </a>
        </div>
        <div className={Style.bottom} >
          <a className={Style.bottomItem} href="http://anyproxy.io/" target="_blank">AnyProxy.io</a>
          <div className={Style.bottomBorder} >
            <span className={Style.bottomBorder1} />
            <span className={Style.bottomBorder2} />
            <span className={Style.bottomBorder3} />
          </div>
          <span className={Style.bottomItem}>
            Version {this.props.globalStatus.appVersion}
          </span>
        </div>
      </div>
    );
  }
}

function select(state) {
  return {
    globalStatus: state.globalStatus
  };
}

export default connect(select)(LeftMenu);
