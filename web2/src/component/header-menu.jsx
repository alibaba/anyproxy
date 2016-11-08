/*
* 页面顶部菜单的组件
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { message, Modal } from 'antd';
import {
    resumeRecording,
    stopRecording,
    showFilter,
    showMapLocal,
    updateLocalInterceptHttpsFlag,
    toggleRemoteInterceptHttpsFlag
} from 'action/globalStatusAction';

import { clearAllRecord } from 'action/recordAction';
import { getJSON } from 'common/ApiUtil';

import Style from './header-menu.less';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class HeaderMenu extends React.Component {
    constructor () {
        super();
        this.state = {
            ruleSummary: '',
            runningDetailVisible: false
        };

        this.stopRecording = this.stopRecording.bind(this);
        this.resumeRecording = this.resumeRecording.bind(this);
        this.clearAllRecord = this.clearAllRecord.bind(this);
        this.showFilter = this.showFilter.bind(this);
        this.showMapLocal = this.showMapLocal.bind(this);
        this.initEvent = this.initEvent.bind(this);
        this.fetchData = this.fetchData.bind(this);
        this.togglerHttpsIntercept = this.togglerHttpsIntercept.bind(this);
        this.showRunningInfo = this.showRunningInfo.bind(this);
        this.hideRunningDetailInfo = this.hideRunningDetailInfo.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    stopRecording () {
        this.props.dispatch(stopRecording());
    }

    resumeRecording () {
        console.info('Resuming...');
        this.props.dispatch(resumeRecording());
    }

    clearAllRecord () {
        this.props.dispatch(clearAllRecord());
    }

    showFilter () {
        this.props.dispatch(showFilter());
    }

    hideRunningDetailInfo () {
        this.setState({
            runningDetailVisible: false
        });
    }
    showRunningInfo () {
        this.setState({
            runningDetailVisible: true
        });
    }

    togglerHttpsIntercept () {
        const self = this;
        // if no rootCA exists, inform the user about trust the root
        if (!this.state.rootCAExists) {
            Modal.info({
                title: 'AnyProxy is about to generate the root CA for you',
                content: (
                    <div>
                        <span>Trust the root CA before AnyProxy can do HTTPS proxy for you.</span>
                        <span>They will be located in
                            <a href="javascript:void(0)">{' ' + this.state.rootCADirPath}</a>
                        </span>
                    </div>
                ),
                width: 500,
                onOk () {
                    doToggleRemoteIntercept();
                }
            });
        } else {
            doToggleRemoteIntercept();
        }

        function doToggleRemoteIntercept () {
            const currentHttpsFlag = self.props.globalStatus.interceptHttpsFlag;
            self.props.dispatch(toggleRemoteInterceptHttpsFlag(!currentHttpsFlag));
        }

    }

    showMapLocal () {
        this.props.dispatch(showMapLocal());
    }

    initEvent () {
        document.addEventListener('keyup', (e) => {
            if (e.keyCode == 88 && e.ctrlKey) {
                this.clearAllRecord();
            }
        });
    }

    fetchData () {
        getJSON('/api/getInitData')
            .then((resposne) => {
                this.setState({
                    ruleSummary: resposne.ruleSummary,
                    rootCAExists: resposne.rootCAExists,
                    rootCADirPath: resposne.rootCADirPath,
                    ipAddress: resposne.ipAddress,
                    port: resposne.port
                });
                this.props.dispatch(updateLocalInterceptHttpsFlag(resposne.currentInterceptFlag));
            })
            .catch((error) => {
                console.error;
                message.error('Failed to get rule summary');
            });
    }

    componentDidMount () {
        this.fetchData();
        this.initEvent();
    }

    render () {
        const { globalStatus } = this.props;

        const stopMenuStyle = StyleBind('menuItem', { 'disabled': globalStatus.recording !== true });
        const resumeMenuStyle = StyleBind('menuItem', { 'disabled': globalStatus.recording === true });

        const mappedConfig = globalStatus.mappedConfig || [];
        const filterStr = globalStatus.filterStr;

        const mapLocalMenuStyle = StyleBind('menuItem', { 'active': mappedConfig.length > 0 });
        const filterMenuStyle = StyleBind('menuItem', { 'active': filterStr.length > 0 });
        const interceptHttpsStyle = StyleBind('menuItem', { 'active': globalStatus.interceptHttpsFlag });

        const runningInfoDiv = (
            <div >
                <ul>
                    <li>
                        <strong>Active Rule:</strong>
                        <span>{this.state.ruleSummary}</span>
                    </li>
                    <li>
                        <strong>Host Address:</strong>
                        <span>{this.state.ipAddress}</span>
                    </li>
                    <li>
                        <strong>Listening on:</strong>
                        <span>{this.state.port}</span>
                    </li>
                    <li>
                        <strong>Proxy Protocol:</strong>
                        <span>HTTP</span>
                    </li>
                </ul>
            </div>
        );

        return (
          <div className={Style.topWrapper} >
                <div className={Style.fixedWrapper} >
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
                            onClick={this.clearAllRecord}
                        >
                            <i className="fa fa-eraser" />
                            <span>Clear(Ctrl+X)</span>
                        </a>

                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>

                        <a
                            className={Style.menuItem}
                            href="/fetchCrtFile"
                            target="_blank"
                            rel="noreferrer noopener"
                            title="Download the RootCA of this computer"
                        >
                            <i className="fa fa-download" />
                            <span>RootCA.crt</span>
                        </a>

                        <a
                            className={Style.menuItem}
                            href="/qr_root"
                            target="_blank"
                            rel="noreferrer noopener"
                            title="Scan the QR code with your phone"
                        >
                            <i className="fa fa-qrcode" />
                            <span>Install CA To Phone</span>
                        </a>

                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>
                        <a
                            className={Style.menuItem}
                            href="javascript:void(0)"
                            title="Check the running info about AnyProxy"
                            onClick={this.showRunningInfo}
                        >
                            <i className="fa fa-tachometer" />
                            <span>AnyProxy Info</span>
                        </a>
                    </div>
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
                            className={interceptHttpsStyle}
                            href="javascript:void(0)"
                            onClick={this.togglerHttpsIntercept}
                            title="Enable or Disable the HTTPS intercept"
                        >
                            <i className="fa fa-eye-slash" />
                            <span>Inercept HTTPS</span>
                        </a>
                    </div>
                </div>

                <Modal
                    visible={this.state.runningDetailVisible}
                    onOk={this.hideRunningDetailInfo}
                    onCancel={this.hideRunningDetailInfo}
                    title="AnyProxy Running Info"
                    wrapClassName={Style.modalInfo}
                >
                    {runningInfoDiv}
                </Modal>
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