/**
 * The panel to edit the filter
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { Input, Alert } from 'antd';
import ModalPanel from 'component/modal-panel';
import { hideFilter, updateFilter } from 'action/globalStatusAction';

import Style from './record-filter.less';
import CommonStyle from '../style/common.less';

class RecordFilter extends React.Component {
    constructor () {
        super();
        this.onChange = this.onChange.bind(this);
        this.onClose = this.onClose.bind(this);
    }

    static propTypes = {
        dispatch: PropTypes.func,
        globalStatus: PropTypes.object
    }

    onChange (event) {
        this.props.dispatch(updateFilter(event.target.value));
    }

    onClose () {
        this.props.dispatch(hideFilter());
    }

    render() {
        const description = (
            <ul className={Style.tipList} >
                <li>1. Multiple filters supported, write them in a single line.</li>
                <li>2. Each line will be treaded as a Reg expression.</li>
                <li>3. All the filters will be tested against the URL.</li>
            </ul>
        );

        return (
            <ModalPanel onClose={this.onClose} visible={this.props.globalStatus.showFilter} >
                <div className={Style.filterWrapper} >
                    <div >
                        <span className={CommonStyle.sectionTitle}>Filter</span>
                    </div>
                    <div className={CommonStyle.whiteSpace30} />
                    <div className={Style.filterInput} >
                        <Input
                            type="textarea"
                            placeholder="Type the filter here"
                            rows={ 6 }
                            onChange={this.onChange}
                            value={this.props.globalStatus.filterStr}
                        />
                    </div>
                    <div className={Style.filterTip} >
                        <Alert
                            type="info"
                            message="TIPS"
                            description={description}
                            showIcon
                        />
                    </div>
                </div>

            </ModalPanel>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(RecordFilter);
