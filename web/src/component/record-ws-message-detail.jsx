/**
 * The panel to display the detial of the record
 *
 */

import React, { PropTypes } from 'react';
import { message, Button, Icon } from 'antd';
import { formatDate } from 'common/CommonUtil';
import { initWs } from 'common/WsUtil';
import ClassBind from 'classnames/bind';

import Style from './record-ws-message-detail.less';
import CommonStyle from '../style/common.less';

const ToMessage = (props) => {
  const { message: wsMessage } = props;
  return (
    <div className={Style.toMessage}>
      <div className={`${Style.time} ${CommonStyle.right}`}>{formatDate(wsMessage.time, 'hh:mm:ss:ms')}</div>
      <div className={Style.content}>{wsMessage.message}</div>
    </div>
  );
}

const FromMessage = (props) => {
  const { message: wsMessage } = props;
  return (
    <div className={Style.fromMessage}>
      <div className={Style.time}>{formatDate(wsMessage.time, 'hh:mm:ss:ms')}</div>
      <div className={Style.content}>{wsMessage.message}</div>
    </div>
  );
}

class RecordWsMessageDetail extends React.Component {
  constructor() {
    super();
    this.state = {
      stateCheck: false, // a prop only to trigger state check
      autoRefresh: true,
      socketMessages: [] // the messages from websocket listening
    };

    this.updateStateRef = null; // a timeout ref to reduce the calling of update state
    this.wsClient = null; // ref to the ws client
    this.onMessageHandler = this.onMessageHandler.bind(this);
    this.receiveNewMessage = this.receiveNewMessage.bind(this);
    this.toggleRefresh = this.toggleRefresh.bind(this);
  }

  static propTypes = {
    recordDetail: PropTypes.object
  }

  toggleRefresh () {
    const { autoRefresh } = this.state;
    this.state.autoRefresh = !autoRefresh;
    this.setState({
      stateCheck: true
    });
  }

  receiveNewMessage (message) {
    this.state.socketMessages.push(message);

    this.updateStateRef && clearTimeout(this.updateStateRef);
    this.updateStateRef = setTimeout(() => {
      this.setState({
        stateCheck: true
      });
    }, 100);
  }

  getMessageList () {
    const { recordDetail } = this.props;
    const { socketMessages } = this.state;
    const { wsMessages = [] } = recordDetail;

    const targetMessage = wsMessages.concat(socketMessages);

    return targetMessage.map((messageItem, index) => {
      return messageItem.isToServer ?
        <ToMessage key={index} message={messageItem} /> : <FromMessage key={index} message={messageItem} />;
    });
  }

  refreshPage () {
    const { autoRefresh } = this.state;
    if (autoRefresh && this.messageRef && this.messageContentRef) {
      this.messageRef.scrollTop = this.messageContentRef.scrollHeight;
    }
  }

  onMessageHandler (event) {
    const { recordDetail } = this.props;
    const data = JSON.parse(event.data);
    const content = data.content;
    if (data.type === 'updateLatestWsMsg' ) {
      if (recordDetail.id === content.id) {
        this.receiveNewMessage(content.message);
      }
    }
  }

  componentDidUpdate () {
    this.refreshPage();
  }

  componentWillUnmount () {
    this.wsClient && this.wsClient.removeEventListener('message', this.onMessageHandler);
  }

  componentDidMount () {
    const { recordDetail } = this.props;

    this.refreshPage();

    this.wsClient = initWs();
    this.wsClient.addEventListener('message', this.onMessageHandler);
  }

  render() {
    const { recordDetail } = this.props;
    const { autoRefresh } = this.state;
    if (!recordDetail) {
      return null;
    }

    const playIcon = <Icon type="play-circle" />;
    const pauseIcon = <Icon type="pause-circle" />;
    return (
      <div className={Style.wrapper} ref={(_ref) => this.messageRef = _ref}>
        <div className={Style.contentWrapper} ref={(_ref) => this.messageContentRef = _ref}>
          {this.getMessageList()}
        </div>
        <div className={Style.refreshBtn} onClick={this.toggleRefresh} >
          {autoRefresh ? pauseIcon : playIcon}
        </div>
      </div>
    );
  }
}

export default RecordWsMessageDetail;
