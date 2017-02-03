/*
* A copoment to display content in the a modal
*/

import React, { PropTypes } from 'react';
import { Menu } from 'antd';
import ReactDOM from 'react-dom';
import JSONTree from 'react-json-tree';
import Style from './json-viewer.less';

const PageIndexMap = {
    'JSON_STRING': 'JSON_STRING',
    'JSON_TREE': 'JSON_TREE'
};

const theme = {
    scheme: 'google',
    author: 'seth wright (http://sethawright.com)',
    base00: '#1d1f21',
    base01: '#282a2e',
    base02: '#373b41',
    base03: '#969896',
    base04: '#b4b7b4',
    base05: '#c5c8c6',
    base06: '#e0e0e0',
    base07: '#ffffff',
    base08: '#CC342B',
    base09: '#F96A38',
    base0A: '#FBA922',
    base0B: '#198844',
    base0C: '#3971ED',
    base0D: '#3971ED',
    base0E: '#A36AC7',
    base0F: '#3971ED'
};

class JsonViewer extends React.Component {
    constructor () {
        super();

        this.state = {
            pageIndex: PageIndexMap.JSON_STRING
        };

        this.getMenuDiv = this.getMenuDiv.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);
    }

    static propTypes = {
        data: PropTypes.string
    }

    handleMenuClick(e) {
        this.setState({
            pageIndex: e.key,
        });
    }

    getMenuDiv () {
        return (
            <Menu onClick={this.handleMenuClick} mode="horizontal" selectedKeys={[this.state.pageIndex]} >
                <Menu.Item key={PageIndexMap.JSON_STRING}>Source</Menu.Item>
                <Menu.Item key={PageIndexMap.JSON_TREE}>Preview</Menu.Item>
            </Menu>
        );
    }

    render () {
        if (!this.props.data) {
            return null;
        }

        let jsonTreeDiv = <div>{this.props.data}</div>;

        try {
            // In an invalid JSON string returned, handle the exception
            const jsonObj = JSON.parse(this.props.data);
            jsonTreeDiv = <JSONTree data={jsonObj} theme={theme} />;
        } catch (e) {
            console.warn('Failed to get JSON Tree:', e);
        }

        const jsonStringDiv = <div>{this.props.data}</div>;
        return (
            <div className={Style.wrapper} >
                {this.getMenuDiv()}
                <div className={Style.contentDiv} >
                    {this.state.pageIndex === PageIndexMap.JSON_STRING ? jsonStringDiv : jsonTreeDiv}
                </div>
            </div>
        );
    }
}

export default JsonViewer;