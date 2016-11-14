/**
 * The panel to edit the filter
 *
 */

import React, { PropTypes } from 'react';
import { Icon } from 'antd';
import { getQueryParameter } from 'common/CommonUtil';

import Style from './title-bar.less';

class TitleBar extends React.Component {
    constructor () {
        super();
        this.state = {
            inMaxWindow: false,
            inApp: getQueryParameter('in_app_mode') // will only show the bar when in app
        };

    }

    static propTypes = {
    }

    render() {

        if (this.state.inApp !== 'true') {
            return null;
        }

        // the buttons with normal window size
        const normalButton = (
            <div className={Style.iconButtons} >
                <span className={Style.close} >
                    <i className="fa fa-times" aria-hidden="true"></i>
                </span>
                <span className={Style.minimize} >
                    <i className="fa fa-minus" aria-hidden="true"></i>
                </span>
                <span className={Style.maxmize} >
                    <Icon type="arrows-alt" />
                </span>
            </div>
        );

        const maxmizeButton = (
            <div className={Style.iconButtons} >
                <span className={Style.close} >
                    <i className="fa fa-times" aria-hidden="true"></i>
                </span>
                <span className={Style.disabled} />
                <span className={Style.maxmize} >
                    <Icon type="shrink" />
                </span>
            </div>
        );

        return this.state.inMaxWindow ? maxmizeButton : normalButton;
    }
}

export default TitleBar;
