/*
* A copoment to display content in the a modal
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';

import Style from './modal-panel.less';
import ClassBind from 'classnames/bind';

const StyleBind = ClassBind.bind(Style);

class ModalPanel extends React.Component {
    constructor () {
        super();

        this.state = {
            dragBarLeft: '',
            contentLeft: ''
        };
        this.onDragbarMoveUp = this.onDragbarMoveUp.bind(this);
        this.onDragbarMove = this.onDragbarMove.bind(this);
        this.onDragbarMoveDown = this.onDragbarMoveDown.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    static propTypes = {
        children: PropTypes.element,
        onClose: PropTypes.func,
        visible: PropTypes.bool,
        left: PropTypes.string
    }

    onDragbarMove (event) {
        this.setState({
            dragBarLeft: event.pageX
        });
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

    onClose (event) {
        if (event.target === event.currentTarget) {
            this.props.onClose && this.props.onClose();
        }
    }

    render () {
        if (!this.props.visible) {
            // stop the body from scrolling
            document.body.style.overflow = 'auto';
            return null;
        } else {
            // stop the body from scrolling
            document.body.style.overflow = 'hidden';
        }

        const { dragBarLeft, contentLeft } = this.state;
        const propsLeft = this.props.left;
        const dragBarStyle = dragBarLeft || propsLeft ? { 'left': dragBarLeft || propsLeft } : null;
        const contentStyle = contentLeft || propsLeft ? { 'left': contentLeft || propsLeft } : null;

        return (
            <div className={Style.wrapper} onClick={this.onClose} >
                <div
                    className={Style.dragBar}
                    style={dragBarStyle}
                    onMouseDown={this.onDragbarMoveDown}
                />
                <div className={Style.contentWrapper} style={contentStyle} >
                    <div className={Style.content} >
                        {this.props.children}
                    </div>
                </div>
            </div>
        );
    }
}

export default ModalPanel;