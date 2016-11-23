/*
* listen on the websocket event
*
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { message } from 'antd';
import { initWs } from 'common/WsUtil';
import { updateRecord, updateMultipleRecords, updateWholeRequest } from 'action/recordAction';
import { updateCanLoadMore, updateShouldClearRecord } from 'action/globalStatusAction';
const RecordWorkder = require('worker-loader?inline!./record-worker.jsx');
import ApiUtil, { getJSON, isApiSuccess } from 'common/ApiUtil';

const myRecordWorder = new RecordWorkder(window.URL.createObjectURL(new Blob(RecordWorkder)));
const fetchLatestLog = function () {
    getJSON('/latestLog')
        .then((data) => {
            const message = {
                type: 'initRecord',
                data: data
            };
            myRecordWorder.postMessage(JSON.stringify(message));
        })
        .catch((error) => {
            console.error(error);
            message.error(error.errorMsg || 'Failed to load latest log');
        });
};

class WsListener extends React.Component {
    constructor () {
        super ();

        this.initWs = this.initWs.bind(this);
        this.onWsMessage = this.onWsMessage.bind(this);
        fetchLatestLog();
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    onWsMessage (event) {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'update': {
                    const record = data.content;

                    // stop update the record when it's turned off
                    if (this.props.globalStatus.recording) {
                        // this.props.dispatch(updateRecord(record));
                        const message = {
                            type: 'updateSingle',
                            data: record
                        };
                        myRecordWorder.postMessage(JSON.stringify(message));
                    }
                    break;
                }

                case 'updateMultiple': {
                    const records = data.content;
                    // stop update the record when it's turned off
                    if (this.props.globalStatus.recording) {
                        // this.props.dispatch(updateMultipleRecords(records));
                        const message = {
                            type: 'updateMultiple',
                            data: records
                        };

                        myRecordWorder.postMessage(JSON.stringify(message));
                    }
                    break;
                }
            }
        } catch(error) {
            console.error(error);
            console.error('Failed to parse the websocket data with message: ', message);
        }
    }

    initWs () {
        const wsClient = initWs();
        wsClient.onmessage = this.onWsMessage;
    }

    componentDidMount () {
        this.initWs();
        myRecordWorder.addEventListener('message', (e) => {
            const data = JSON.parse(e.data);
            if (data.shouldUpdateRecord) {
                this.props.dispatch(updateWholeRequest(data.recordList));
            }

            if (data.shouldUpdateLoadMore) {
                this.props.dispatch(updateCanLoadMore(data.canLoadMore));
            }
        });
    }

    componentWillReceiveProps (nextProps) {
        const { shouldClearAllRecord } = this.props.globalStatus;

        // if it's going to clear the record,
        if (shouldClearAllRecord) {
            const message ={
                type: 'clear'
            };
            myRecordWorder.postMessage(JSON.stringify(message));
            this.props.dispatch(updateShouldClearRecord(false));
        }
    }

    render () {
        const { displayRecordLimit: limit, filterStr } = this.props.globalStatus;

        const message = {
            type: 'updateQuery',
            limit: limit,
            filterStr: filterStr
        };

        myRecordWorder.postMessage(JSON.stringify(message));

        return <div></div>;
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(WsListener);