/*
* 页面顶部菜单的组件
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { resumeRecording, stopRecording } from 'action/globalStatusAction';

import Style from './header-menu.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class HeaderMenu extends React.Component {
    constructor () {
        super();
        this.state = {
            active: true
        };

        this.stopRecording = this.stopRecording.bind(this);
        this.resumeRecording = this.resumeRecording.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    stopRecording () {
        this.props.dispatch(stopRecording());
    }

    resumeRecording () {
        console.info('resuming');
        this.props.dispatch(resumeRecording());
    }

    render () {

        const stopMenuStyle = StyleBind('menuItem', { 'disabled': this.props.globalStatus.recording !== true });
        const resumeMenuStyle = StyleBind('menuItem', { 'disabled': this.props.globalStatus.recording === true });
        return (
          <div>
                <div className={Style.topWrapper} >
                    <div className={Style.topLogoDiv} >
                        <img
                            className={CommonStyle.rotation + ' ' + Style.logo}
                            src="https://t.alipayobjects.com/images/rmsweb/T1P_dfXa8oXXXXXXXX.png"
                            width="50"
                            height="50"
                        />
                        <div className={Style.brand} >
                            AnyProxy
                        </div>
                    </div>
                    <div className={Style.menuList} >
                        <a
                            className={stopMenuStyle}
                            href="javascript:void(0)"
                            onClick={this.stopRecording}
                        >
                            <i className="fa fa-stop" />
                            <span>Stop</span>
                        </a>

                        <a
                            className={resumeMenuStyle}
                            href="javascript:void(0)"
                            onClick={this.resumeRecording}
                        >
                            <i className="fa fa-play" />
                            <span>Resume</span>
                        </a>

                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                        >
                            <i className="fa fa-eraser" />
                            <span>Clear(Ctrl+X)</span>
                        </a>

                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>

                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                        >
                            <i className="fa fa-download" />
                            <span>Download rootCA.crt</span>
                        </a>

                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                        >
                            <i className="fa fa-qrcode" />
                            <span>QRCode of rootCA.crt</span>
                        </a>

                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>
                        <a
                            className={Style.menuItem}
                            href=""
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            <i className="fa fa-github" />
                            <span>github</span>
                        </a>
                    </div>
                    <div className={Style.menuList} >
                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                        >
                            <i className="fa fa-filter" />
                            <span>Filter</span>
                        </a>

                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                        >
                            <i className="fa fa-exchange" />
                            <span>Map Local</span>
                        </a>

                        <span className={Style.menuItem + ' ' + Style.disabled} >|</span>
                        <span className={Style.ruleTip} ><i className="fa paper-plane-o" />Rule:</span>
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

export default connect(select)(HeaderMenu);