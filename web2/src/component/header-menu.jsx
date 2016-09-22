/*
* 页面顶部菜单的组件
*/

import React from 'react';
import ReactDOM from 'react-dom';
import Style from './header-menu.less';
import ClassBind from 'classnames/bind';
import CommonStyle from '../style/common.less';

const StyleBind = ClassBind.bind(Style);

class HeaderMenu extends React.Component {
    constructor () {
        super();
        this.state = {
            active: true
        };
    }
    render () {

        const menuStyle = StyleBind('menuItem', { 'disabled': this.state.active !== true });
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
                        <a className={menuStyle} ><i className="fa fa-stop" /><span>Stop</span></a>
                        <a className={menuStyle} ><i className="fa fa-play" /><span>Resume</span></a>
                        <a className={Style.menuItem} ><i className="fa fa-eraser" /><span>Clear(Ctrl+X)</span></a>
                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>
                        <a className={Style.menuItem} ><i className="fa fa-download" /><span>Download rootCA.crt</span></a>
                        <a className={Style.menuItem} ><i className="fa fa-qrcode" /><span>QRCode of rootCA.crt</span></a>
                        <span className={Style.menuItem + ' ' + Style.disabled}>|</span>
                        <a className={Style.menuItem} href="" target="_blank" rel="noreferrer noopener" ><i className="fa fa-github" /><span>github</span></a>
                    </div>
                    <div className={Style.menuList} >
                        <a className={menuStyle} ><i className="fa fa-filter" /><span>Filter</span></a>
                        <a className={menuStyle} ><i className="fa fa-exchange" /><span>Map Local</span></a>
                        <span className={Style.menuItem + ' ' + Style.disabled} >|</span>
                        <span className={Style.ruleTip} ><i className="fa paper-plane-o" />Rule:</span>
                    </div>
                </div>
          </div>
        );
    }
}

export default HeaderMenu;