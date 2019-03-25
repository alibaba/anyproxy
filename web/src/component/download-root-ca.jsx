/**
 * The panel to edit the filter
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { message, Button, Spin, Select } from 'antd';
import ResizablePanel from 'component/resizable-panel';
import { hideRootCA, updateIsRootCAExists } from 'action/globalStatusAction';
import { MenuKeyMap } from 'common/Constant';
import { getJSON, postJSON } from 'common/ApiUtil';

import Style from './download-root-ca.less';
import CommonStyle from '../style/common.less';

const certFileTypes = ['crt', 'cer', 'pem', 'der'];

class DownloadRootCA extends React.Component {
    constructor () {
        super();
        this.state = {
            loadingCAQr: false,
            generatingCA: false,
            fileType: certFileTypes[0]
        };

        this.onClose = this.onClose.bind(this);
        this.onFileTypeChange = this.onFileTypeChange.bind(this);
        this.getQrCodeContent = this.getQrCodeContent.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    fetchData () {
        this.setState({
            loadingCAQr: true
        });

        getJSON('/api/getQrCode', { type: this.state.fileType })
            .then((response) => {
                this.setState({
                    loadingCAQr: false,
                    CAQrCodeImageDom: response.qrImgDom,
                    isRootCAFileExists: response.isRootCAFileExists,
                    url: response.url
                });
            })
            .catch((error) => {
                console.error(error);
                message.error(error.errorMsg || 'Failed to get the QR code of RootCA path.');
            });
    }

    onClose () {
        this.props.dispatch(hideRootCA());
    }

    onFileTypeChange (value) {
        this.setState({
            fileType: value
        }, () => {
            this.fetchData();
        });
    }

    getQrCodeContent () {
        const imgDomContent = { __html: this.state.CAQrCodeImageDom };
        const content = (
            <div className={Style.qrCodeWrapper} >
                <div dangerouslySetInnerHTML={imgDomContent} />
                <div>Scan to download rootCA.{this.state.fileType} to your Phone</div>
                <div>You can change the CA's file extension:
                    <Select
                        defaultValue={this.state.fileType}
                        className={Style.fileSelect}
                        onChange={this.onFileTypeChange}
                    >
                        {
                            certFileTypes.map(key => (
                                <Option key={key} value={key}>{key}</Option>
                            ))
                        }
                    </Select>
                </div>
            </div>
        );

        const spin = <Spin />;
        return this.state.loadingCAQr ? spin : content;
    }

    getGenerateRootCADiv () {
        const doToggleRemoteIntercept = () => {
            postJSON('/api/generateRootCA')
                .then((result) => {
                    this.setState({
                        generateRootCA: false,
                        isRootCAFileExists: true
                    });
                    this.props.dispatch(updateIsRootCAExists(true));
                })
                .catch((error) => {
                    this.setState({
                        generatingCA: false
                    });
                    message.error('生成根证书失败,请重试');
                });
        };

        return (
            <div className={Style.wrapper}>
                <div className={Style.title} >
                    RootCA
                </div>

                <div className={Style.generateRootCaTip} >
                    <span >Your RootCA has not been generated yet, please click the button to generate before you download it.</span>
                    <span className={Style.strongColor} >Please install and trust the generated RootCA.</span>
                </div>

                <div className={Style.generateCAButton} >
                    <Button
                        type="primary"
                        size="large"
                        onClick={doToggleRemoteIntercept}
                        loading={this.state.generateRootCA}
                    >
                        OK, GENERATE
                    </Button>
                </div>
            </div>
        );
    }

    getDownloadDiv () {
        return (
            <div className={Style.wrapper} >
                <div className={Style.fullHeightWrapper} >
                    <div className={Style.title} >
                        RootCA
                    </div>
                    <div className={Style.arCodeDivWrapper} >
                        {this.getQrCodeContent()}
                    </div>
                </div>

                <div className={Style.buttons} >
                    <a href={`/fetchCrtFile?type=${this.state.fileType}`} target="_blank">
                        <Button type="primary" size="large" >Download</Button>
                    </a>
                    <span className={Style.tipSpan} >Or click the button to download.</span>
                </div>
            </div>
        );
    }

    componentDidMount () {
        this.fetchData();
    }

    render() {
        const panelVisible = this.props.globalStatus.activeMenuKey === MenuKeyMap.ROOT_CA;

        return (
            <ResizablePanel onClose={this.onClose} visible={panelVisible} >
                {this.props.globalStatus.isRootCAFileExists ? this.getDownloadDiv() : this.getGenerateRootCADiv()}
            </ResizablePanel>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(DownloadRootCA);
