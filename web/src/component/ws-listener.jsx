/*
* listen on the websocket event
*
*/

import React, { PropTypes } from 'react';
import { message } from 'antd';
import { initWs } from 'common/WsUtil';
import { updateWholeRequest } from 'action/recordAction';
import {
  updateShouldClearRecord,
  updateShowNewRecordTip
} from 'action/globalStatusAction';
const RecordWorker = require('worker-loader?inline!./record-worker.jsx');
import { getJSON } from 'common/ApiUtil';

const myRecordWorker = new RecordWorker(window.URL.createObjectURL(new Blob([RecordWorker.toString()])));
const fetchLatestLog = function () {
  getJSON('/latestLog')
    .then((data) => {
      const msg = {
        type: 'initRecord',
        data
      };
      myRecordWorker.postMessage(JSON.stringify(msg));
    })
    .catch((error) => {
      console.error(error);
      message.error(error.errorMsg || 'Failed to load latest log');
    });
};

class WsListener extends React.Component {
  constructor() {
    super();

    this.state = {
      wsInited: false
    }

    this.initWs = this.initWs.bind(this);
    this.onWsMessage = this.onWsMessage.bind(this);
    this.loadNext = this.loadNext.bind(this);
    this.loadPrevious = this.loadPrevious.bind(this);
    this.stopPanelRefreshing = this.stopPanelRefreshing.bind(this);
    fetchLatestLog();

    this.refreshing = true;
    this.loadingNext = false;
  }

  static propTypes = {
    dispatch: PropTypes.func,
    globalStatus: PropTypes.object
  }

  loadPrevious() {
    this.stopPanelRefreshing();
    myRecordWorker.postMessage(JSON.stringify({
      type: 'loadMore',
      data: -500
    }));
  }

  loadNext() {
    this.loadingNext = true;
    myRecordWorker.postMessage(JSON.stringify({
      type: 'loadMore',
      data: 500
    }));
  }

  stopPanelRefreshing() {
    this.refreshing = false;
    myRecordWorker.postMessage(JSON.stringify({
      type: 'updateRefreshing',
      refreshing: false
    }));
  }

  resumePanelRefreshing() {
    this.refreshing = true;
    this.loadingNext = false;
    this.props.dispatch(updateShowNewRecordTip(false));
    myRecordWorker.postMessage(JSON.stringify({
      type: 'updateRefreshing',
      refreshing: true
    }));
  }

  onWsMessage(event) {
    try {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'update': {
          const record = data.content;

          // stop update the record when it's turned off
          if (this.props.globalStatus.recording) {
            // this.props.dispatch(updateRecord(record));
            const msg = {
              type: 'updateSingle',
              data: record
            };
            myRecordWorker.postMessage(JSON.stringify(msg));
          }
          break;
        }

        case 'updateMultiple': {
          const records = data.content;
          // stop update the record when it's turned off
          if (this.props.globalStatus.recording) {
            // // only in multiple mode we consider there are new records
            // if (!this.refreshing && !this.loadingNext) {
            //     console.info(`==> this.loadingNext`, this.loadingNext)
            //     const hasNew = records.some((item) => {
            //         return (typeof item.id !== 'undefined');
            //     });
            //     hasNew && this.props.dispatch(updateShowNewRecordTip(true));
            // }

            const msg = {
              type: 'updateMultiple',
              data: records
            };

            myRecordWorker.postMessage(JSON.stringify(msg));
          }
          break;
        }
        default : {
          break;
        }
      }
    } catch (error) {
      console.error(error);
      console.error('Failed to parse the websocket data with message: ', event.data);
    }
  }

  initWs() {
    const { wsPort } = this.props.globalStatus;
    if (!wsPort || this.state.wsInited) {
      return;
    }
    this.state.wsInited = true;
    const wsClient = initWs(wsPort);
    wsClient.onmessage = this.onWsMessage;
  }

  componentDidMount() {
    myRecordWorker.addEventListener('message', (e) => {
      const data = JSON.parse(e.data);
      this.loadingNext = false;

      switch (data.type) {
        case 'updateData': {
          if (data.shouldUpdateRecord) {
            this.props.dispatch(updateWholeRequest(data.recordList));
          }
          break;
        }

        case 'updateTip': {
          this.props.dispatch(updateShowNewRecordTip(data.data));
          break;
        }

        default: {
          break;
        }
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    const {
      shouldClearAllRecord: nextShouldClearAllRecord
    } = nextProps.globalStatus;


    // if it's going to clear the record,
    if (nextShouldClearAllRecord) {
      const msg = {
        type: 'clear'
      };
      myRecordWorker.postMessage(JSON.stringify(msg));
      this.props.dispatch(updateShouldClearRecord(false));
    }
  }

  render() {
    this.initWs();
    const { displayRecordLimit: limit, filterStr } = this.props.globalStatus;

    const msg = {
      type: 'updateQuery',
      limit,
      filterStr
    };

    myRecordWorker.postMessage(JSON.stringify(msg));

    return <div></div>;
  }
}

export default WsListener;
