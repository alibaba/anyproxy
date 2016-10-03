/*
* listen on the websocket event
*
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { message } from 'antd';
import { initWs } from 'common/WsUtil';
import { updateRecord } from 'action/recordAction';

class WsListener extends React.Component {
    constructor () {
        super ();

        this.initWs = this.initWs.bind(this);
        this.onWsMessage = this.onWsMessage.bind(this);
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
                        this.props.dispatch(updateRecord(record));
                    }
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
    }

    render () {
        return <div></div>;
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(WsListener);