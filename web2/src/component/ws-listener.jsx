/*
* listen on the websocket event
*
*/

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { message } from 'antd';
import { updateRecord } from 'action/requestAction';

class WsListener extends React.Component {
    constructor () {
        super ();

        this.initWs = this.initWs.bind(this);
        this.onWsMessage = this.onWsMessage.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func
    }

    onWsMessage (event) {
        try {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'update': {
                    const record = data.content;
                    this.props.dispatch(updateRecord(record));
                }
            }
        } catch(error) {
            console.error(error);
            console.error('Failed to parse the websocket data with message: ', message);
        }
    }

    initWs () {
        if(!WebSocket){
            throw (new Error("WebSocket is not supportted on this browser"));
        }

        const wsClient = new WebSocket('ws://localhost:8003');

        wsClient.onmessage = this.onWsMessage;
        wsClient.onerror = (error) => {
            console.error(error);
            message.error('error happened when setup websocket');
        };

        wsClient.onopen = (e) => {
            console.info('websocket opened: ', e);
        };

        wsClient.onclose = (e) => {
            console.info('websocket closed: ', e);
        };
    }

    componentDidMount () {
        this.initWs();
    }

    render () {
        return <div></div>;
    }
}

export default connect()(WsListener);