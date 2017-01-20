/*
* A copoment to display content in the a resizable panel
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Icon } from 'antd';

import Style from './resizable-panel.less';
import ClassBind from 'classnames/bind';

const StyleBind = ClassBind.bind(Style);

class ResizablePanel extends React.Component {
    constructor () {
        super();

        this.state = {
            dragBarLeft: '',
            contentLeft: ''
        };
        this.onDragbarMoveUp = this.onDragbarMoveUp.bind(this);
        this.onDragbarMove = this.onDragbarMove.bind(this);
        this.onDragbarMoveDown = this.onDragbarMoveDown.bind(this);
        this.doClose = this.doClose.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
        this.addKeyEvent = this.addKeyEvent.bind(this);
        this.removeKeyEvent = this.removeKeyEvent.bind(this);
    }

    static propTypes = {
        children: PropTypes.element,
        onClose: PropTypes.func,
        visible: PropTypes.bool
    }

    onDragbarMove (event) {
        this.setState({
            dragBarLeft: event.pageX
        });
    }

    onKeyUp (e) {
        if (e.keyCode == 27) {
            this.doClose();
        }
    }

    addKeyEvent () {
        document.addEventListener('keyup', this.onKeyUp);
    }

    removeKeyEvent () {
        document.removeEventListener('keyup', this.onKeyUp);
    }

    onDragbarMoveUp (event) {
        this.setState({
            contentLeft: event.pageX
        });

        document.removeEventListener('mousemove', this.onDragbarMove);
        document.removeEventListener('mouseup', this.onDragbarMoveUp);
    }

    onDragbarMoveDown (event) {
        document.addEventListener('mousemove', this.onDragbarMove);

        document.addEventListener('mouseup', this.onDragbarMoveUp);
    }

    doClose () {
        this.props.onClose && this.props.onClose();
    }

    render () {
        if (!this.props.visible) {
            this.removeKeyEvent();
            return null;
        }
        this.addKeyEvent();

        const { dragBarLeft, contentLeft } = this.state;
        const propsLeft = this.props.left;
        const dragBarStyle = dragBarLeft || propsLeft ? { 'left': dragBarLeft || propsLeft } : null;
        const contentStyle = contentLeft || propsLeft ? { 'left': contentLeft || propsLeft } : null;

        const modalStyle = this.props.hideBackModal ? contentStyle : { 'left': 0 };
        return (
            <div className={Style.wrapper} onClick={this.onClose} style={modalStyle} >
                <div className={Style.contentWrapper} style={contentStyle} >
                    <div className={Style.content} >
                        {this.props.children}
                    </div>
                </div>
                <div
                    className={Style.dragBar}
                    style={dragBarStyle}
                    onMouseDown={this.onDragbarMoveDown}
                />
                <div className={Style.closeIcon} title="Close, Esc" onClick={this.doClose} >
                    <Icon type="close" />
                </div>
            </div>
        );
    }
}

export default ResizablePanel;