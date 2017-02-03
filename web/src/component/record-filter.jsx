/**
 * The panel to edit the filter
 *
 */

import React, { PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ClassBind from 'classnames/bind';
import { connect } from 'react-redux';
import { Input, Alert } from 'antd';
import ResizablePanel from 'component/resizable-panel';
import { hideFilter, updateFilter } from 'action/globalStatusAction';
import { MenuKeyMap } from 'common/Constant';

import Style from './record-filter.less';
import CommonStyle from '../style/common.less';


class RecordFilter extends React.Component {
    constructor () {
        super();
        this.onChange = this.onChange.bind(this);
        this.onClose = this.onClose.bind(this);
        this.filterTimeoutId = null;
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
                <li>Multiple filters supported, write them in a single line.</li>
                <li>Each line will be treaded as a Reg expression.</li>
                <li>The result will be an 'OR' of the filters.</li>
                <li>All the filters will be tested against the URL.</li>
            </ul>
        );

        const panelVisible = this.props.globalStatus.activeMenuKey === MenuKeyMap.RECORD_FILTER;

        return (
            <ResizablePanel onClose={this.onClose} visible={panelVisible} >
                <div className={Style.filterWrapper} >
                    <div className={Style.title} >
                        Filter
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

            </ResizablePanel>
        );
    }
}

function select (state) {
    return {
        globalStatus: state.globalStatus
    };
}

export default connect(select)(RecordFilter);
