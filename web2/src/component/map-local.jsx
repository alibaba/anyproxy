/**
 * The panel map request to local
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { Tree, Form, Input, Button } from 'antd';
import ResizablePanel from 'component/resizable-panel';
import PromiseUtil from 'common/PromiseUtil';
import { fetchDirectory, hideMapLocal, fetchMappedConfig, updateRemoteMappedConfig } from 'action/globalStatusAction';
import { MenuKeyMap } from 'common/Constant';

import Style from './map-local.less';
import CommonStyle from '../style/common.less';

const TreeNode = Tree.TreeNode;
const createForm = Form.create;
const FormItem = Form.Item;

class MapLocal extends React.Component {
    constructor () {
        super();

        this.state = {
            selectedLocalPath: ''
        };

        this.loadTreeNode = this.loadTreeNode.bind(this);
        this.onClose = this.onClose.bind(this);
        this.getFormDiv = this.getFormDiv.bind(this);
        this.onNodeSelect = this.onNodeSelect.bind(this);
        this.getMappedConfigDiv = this.getMappedConfigDiv.bind(this);
        this.loadMappedConfig = this.loadMappedConfig.bind(this);
        this.addMappedConfig = this.addMappedConfig.bind(this);
        this.removeMappedConfig = this.removeMappedConfig.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object,
        form: PropTypes.object
    }

    loadTreeNode(node) {
        const d = PromiseUtil.defer();
        const key = node ? node.props.eventKey : '';
        this.props.dispatch(fetchDirectory(key));

        setTimeout(function() {
            d.resolve();
        }, 500);

        return d.promise;
    }

    loadMappedConfig() {
        this.props.dispatch(fetchMappedConfig());
    }

    addMappedConfig () {
        const config = this.props.globalStatus.mappedConfig.slice();
        this.props.form.validateFieldsAndScroll((error, value) => {
            config.push({
                keyword: value.keyword,
                local: value.local
            });
            this.props.dispatch(updateRemoteMappedConfig(config));
        });
    }

    removeMappedConfig (index) {
        const config = this.props.globalStatus.mappedConfig.slice();
        config.splice(index, 1);
        this.props.dispatch(updateRemoteMappedConfig(config));
    }

    loopTreeNode(nodes) {
        const treeNodes = nodes.map((item) => {
            if (item.children) {
                return (
                    <TreeNode title={item.name} key={item.fullPath}>
                        {this.loopTreeNode(item.children)}
                    </TreeNode>
                );
            } else {
                return <TreeNode title={item.name} key={item.fullPath} isLeaf={item.isLeaf} />;
            }
        });

        return treeNodes;
    }

    onClose () {
        this.props.dispatch(hideMapLocal());
    }

    onNodeSelect (selectedKeys, { selected, selectedNodes }) {
        const node = selectedNodes[0];

        // Only a file will be mapped
        if (node && node.props.isLeaf) {
            this.setState({
                selectedLocalPath: selectedKeys[0]
            });
        }
    }

    getFormDiv () {
        const { getFieldDecorator, getFieldError } = this.props.form;

        const formItemLayout = {
            labelCol: { span: 6 },
            wrapperCol: { span: 18 },
        };

        const keywordProps = getFieldDecorator('keyword', {
            initialValue: '',
            validate: [
                {
                    trigger: 'onBlur',
                    rules: [
                        {
                            type: 'string',
                            whitespace: true,
                            required: true,
                            message: '请录入需要映射的url匹配'
                        }
                    ]
                }
            ]
        });

        const localProps = getFieldDecorator('local', {
            initialValue: this.state.selectedLocalPath,
            validate: [
                {
                    trigger: 'onBlur',
                    rules: [
                        {
                            type: 'string',
                            whitespace: true,
                            required: true,
                            message: '请输入本地文件路径'
                        }
                    ]
                }
            ]
        });

        return (
            <div className={Style.form} >
                <Form vertical >
                    <FormItem
                        label="Keyword"
                    >
                        {keywordProps(<Input  placeholder="The pattern to map" />)}
                    </FormItem>
                    <FormItem
                        label="Local file"
                    >
                        {localProps(<Input placeholder="Local file for the mapped url" />)}
                    </FormItem>
                </Form>
            </div>
        );
    }

    getMappedConfigDiv () {
        const { mappedConfig } = this.props.globalStatus;
        const mappedLiDiv = mappedConfig.map((item, index) => {
            return (
                <li key={index} >
                    <div>
                        <div className={Style.mappedKeyDiv} >
                            <strong>{item.keyword}</strong>
                            <a
                                href="javascript:void(0)"
                                onClick={this.removeMappedConfig.bind(this, index)}
                            >
                                Remove
                            </a>
                        </div>
                        <div className={Style.mappedLocal} >
                            {item.local}
                        </div>
                    </div>
                </li>
            );
        });

        return (
            <div className={Style.mappedConfigWrapper} >
                <div >
                    <span className={CommonStyle.sectionTitle}>Current Configuration</span>
                </div>
                <div className={CommonStyle.whiteSpace10} />
                <ul className={Style.mappedList} >
                    {mappedLiDiv}
                </ul>
            </div>
        );
    }

    componentDidMount () {
        this.loadTreeNode();
        this.loadMappedConfig();
    }

    render() {

        const treeNodes = this.loopTreeNode(this.props.globalStatus.directory);
        const panelVisible = this.props.globalStatus.activeMenuKey === MenuKeyMap.MAP_LOCAL;

        return (
            <ResizablePanel onClose={this.onClose} visible={panelVisible} >
                <div className={Style.mapLocalWrapper} >
                    <div className={Style.title} >
                        Map Local
                    </div>
                    {this.getMappedConfigDiv()}

                    <div >
                        <span className={CommonStyle.sectionTitle}>Add Local Map</span>
                    </div>
                    <div className={CommonStyle.whiteSpace10} />
                    {this.getFormDiv()}
                    <div className={Style.treeWrapper}  >
                        <Tree
                            loadData={this.loadTreeNode}
                            onSelect={this.onNodeSelect}
                        >
                            {treeNodes}
                        </Tree>
                    </div>
                    <div className={Style.operations} >
                        <Button type="primary" onClick={this.addMappedConfig} >Add</Button>
                    </div>
                </div>

            </ResizablePanel>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(createForm()(MapLocal));
