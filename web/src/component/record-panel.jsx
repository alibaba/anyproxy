/*
* A copoment for the request log table
*/

import React, { PropTypes } from 'react';
import { Icon } from 'antd';
import RecordRow from 'component/record-row';
import Style from './record-panel.less';
import ClassBind from 'classnames/bind';
import { fetchRecordDetail } from 'action/recordAction';

const StyleBind = ClassBind.bind(Style);

class RecordPanel extends React.Component {
  constructor() {
    super();

    this.state = {
    };

    this.wsClient = null;

    this.getRecordDetail = this.getRecordDetail.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.addKeyEvent = this.addKeyEvent.bind(this);
  }

  static propTypes = {
    dispatch: PropTypes.func,
    data: PropTypes.array,
    lastActiveRecordId: PropTypes.number,
    currentActiveRecordId: PropTypes.number,
    loadingNext: PropTypes.bool,
    loadingPrev: PropTypes.bool,
    stopRefresh: PropTypes.func
  }

  getRecordDetail(id) {
    this.props.dispatch(fetchRecordDetail(id));
    this.props.stopRefresh();
  }

  // get next detail with cursor, to go previous and next
  getNextDetail(cursor) {
    const currentId = this.props.currentActiveRecordId;
    this.props.dispatch(fetchRecordDetail(currentId + cursor));
  }

  onKeyUp(e) {
    if (typeof this.props.currentActiveRecordId === 'number') {
      // up arrow
      if (e.keyCode === 38) {
        this.getNextDetail(-1);
      }

      // down arrow
      if (e.keyCode === 40) {
        this.getNextDetail(1);
      }
    }
  }

  addKeyEvent() {
    document.addEventListener('keyup', this.onKeyUp);
  }

  getTrs() {
    const trs = [];

    const { lastActiveRecordId, currentActiveRecordId } = this.props;
    const { data: recordList } = this.props;

    const length = recordList.length;
    for (let i = 0; i < length; i++) {
      // only display records less than max limit
      if (i >= this.state.maxAllowedRecords) {
        break;
      }

      const item = recordList[i];

      const tableRowStyle = StyleBind('row', {
        lightBackgroundColor: item.id % 2 === 1,
        lightColor: item.statusCode === '',
        activeRow: currentActiveRecordId === item.id
      });

      if (currentActiveRecordId === item.id || lastActiveRecordId === item.id) {
        item._render = true;
      }

      trs.push(
        <RecordRow
          data={item}
          className={tableRowStyle}
          detailHandler={this.getRecordDetail}
          key={item.id}
        />);
    }

    return trs;
  }

  getLoadingPreviousDiv() {
    if (!this.props.loadingPrev) {
      return null;
    }

    return (
      <tr className={Style.loading}>
        <td colSpan="7">
          <span > <Icon type="loading" />正在加载...</span>
        </td>
      </tr>
    );

    // <div className={Style.loading}> <Icon type="loading" />正在加载...</div>;
  }

  getLoadingNextDiv() {
    if (!this.props.loadingNext) {
      return null;
    }

    return (
      <tr className={Style.loading}>
        <td colSpan="7">
          <span > <Icon type="loading" />正在加载...</span>
        </td>
      </tr>
    );
  }

  shouldComponentUpdate(nextProps) {
    const { currentActiveRecordId, loadingNext, loadingPrev } = this.props;
    const shouldUpdate = nextProps.data !== this.props.data
      || nextProps.loadingNext !== loadingNext
      || nextProps.loadingPrev !== loadingPrev
      || nextProps.currentActiveRecordId !== currentActiveRecordId;

    // console.info(nextProps.data.length, this.props.data.length, shouldUpdate, Date.now());

    return shouldUpdate;
  }

  componentDidMount() {
    this.addKeyEvent();
  }

  render() {
    if (!this.props.data) {
      return null;
    }

    return (
      <div className={Style.wrapper} >
        <div className="ant-table ant-table-small ant-table-scroll-position-left">
          <div className="ant-table-content">
            <table className="ant-table-body">
              <colgroup>
                <col style={{ width: '70px', minWidth: '70px' }} />
                <col style={{ width: '100px', minWidth: '100px' }} />
                <col style={{ width: '70px', minWidth: '70px' }} />
                <col style={{ width: '200px', minWidth: '200px' }} />
                <col style={{ width: 'auto', minWidth: '600px' }} />
                <col style={{ width: '160px', minWidth: '160px' }} />
                <col style={{ width: '100px', minWidth: '100px' }} />
              </colgroup>
              <thead className="ant-table-thead">
                <tr>
                  <th className={Style.firstRow} >#</th>
                  <th className={Style.leftRow} >Method</th>
                  <th className={Style.centerRow} >Code</th>
                  <th>Host</th>
                  <th className={Style.pathRow} >Path</th>
                  <th>Mime</th>
                  <th>Start</th>
                </tr>
              </thead>

              <tbody className="ant-table-tbody" >
                {this.getLoadingPreviousDiv()}
                {this.getTrs()}
              </tbody>

            </table>
          </div>

        </div>
      </div>
    );
  }
}

export default RecordPanel;
