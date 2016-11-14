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
                <span className={Style.close} id="win-close-btn" >
                    <Icon type="close" />
                </span>
                <span className={Style.minimize} id="win-min-btn" >
                    <Icon type="minus" />
                </span>
                <span className={Style.maxmize} >
                    <Icon type="arrows-alt" id="win-max-btn"/>
                </span>
            </div>
        );

        const maxmizeButton = (
            <div className={Style.iconButtons} >
                <span className={Style.close} id="win-close-btn" >
                    <Icon type="close" />
                </span>
                <span className={Style.disabled} />
                <span className={Style.maxmize} id="win-max-btn" >
                    <Icon type="shrink" />
                </span>
            </div>
        );

        return this.state.inMaxWindow ? maxmizeButton : normalButton;
    }
}

export default TitleBar;
