/*
* A webworker to identify whether the component need to be re-rendered
*
* the core idea is that, we do the caclulation here, compare the new filtered record with current one.
* if they two are same, we'll send no update event out.
* otherwise, will send out a full filtered record list, to replace the current one.
*
* The App itself will just need to display all the filtered records, the filter and max-limit logic are handled here.
*/
let recordList = [];
// store all the filtered record, so there will be no need to re-calculate the filtere record fully through all records.
self.FILTERED_RECORD_LIST = [];
const defaultLimit = 500;
self.currentStateData = []; // the data now used by state
self.filterStr = '';

self.canLoadMore = false;
self.updateQueryTimer = null;
self.refreshing = true;
self.beginIndex = 0;
self.endIndex = self.beginIndex + defaultLimit - 1;
self.IN_DIFF = false; // mark if currently in diff working

const getFilterReg = function (filterStr) {
  let filterReg = null;
  if (filterStr) {
    let regFilterStr = filterStr
      .replace(/\r\n/g, '\n')
      .replace(/\n\n/g, '\n');

    // remove the last /\n$/ in case an accidential br
    regFilterStr = regFilterStr.replace(/\n*$/, '');

    if (regFilterStr[0] === '/' && regFilterStr[regFilterStr.length - 1] === '/') {
      regFilterStr = regFilterStr.substring(1, regFilterStr.length - 2);
    }

    regFilterStr = regFilterStr.replace(/((.+)\n|(.+)$)/g, (matchStr, $1, $2) => {
      // if there is '\n' in the string
      if ($2) {
        return `(${$2})|`;
      } else {
        return `(${$1})`;
      }
    });

    try {
      filterReg = new RegExp(regFilterStr);
    } catch (e) {
      console.error(e);
    }
  }

  return filterReg;
};

self.resetDisplayRecordIndex = function () {
  self.beginIndex = 0;
  self.endIndex = self.beginIndex + defaultLimit - 1;
};

self.getFilteredRecords = function () {
  // const filterReg = getFilterReg(self.filterStr);
  // const filterdRecords = [];
  // const length = recordList.length;

  // // filtered out the records
  // for (let i = 0 ; i < length; i++) {
  //     const item = recordList[i];
  //     if (filterReg && filterReg.test(item.url)) {
  //         filterdRecords.push(item);
  //     }

  //     if (!filterReg) {
  //         filterdRecords.push(item);
  //     }
  // }

  // return filterdRecords;

  return self.FILTERED_RECORD_LIST;
};

/*
* calculate the filtered records, at each time the origin list is updated
* @param isFullyCalculate bool,
     whether to calculate the filtered record fully, if ture, will do a fully calculation;
     Otherwise, will only calculate the "listForThisTime",
     this usually means there are some updates for the 'filtered' list, or some new records arrived
* @param listForThisTime object,
      the list which to be calculated for this time, usually the from the new event,
      contains some update to exist list, or some new records
*/
self.calculateFilteredRecords = function (isFullyCalculate, listForThisTime = []) {
  const filterReg = getFilterReg(self.filterStr);
  if (isFullyCalculate) {
    self.FILTERED_RECORD_LIST = [];
    const length = recordList.length;
    // filtered out the records
    for (let i = 0; i < length; i++) {
      const item = recordList[i];
      if (!filterReg || (filterReg && filterReg.test(item.url))) {
        self.FILTERED_RECORD_LIST.push(item);
      }
    }
  } else {
    listForThisTime.forEach((item) => {
      const index = self.FILTERED_RECORD_LIST.findIndex((record) => {
        return item.id === record.id;
      });

      if (index >= 0) {
        self.FILTERED_RECORD_LIST[index] = item;
      } else if (!filterReg || (filterReg && filterReg.test(item.url))) {
        self.FILTERED_RECORD_LIST.push(item);
      }
    });
  }
};

// diff the record, so when the refreshing is stoped, the page will not be updated
// cause the filtered records will be unchanged
self.diffRecords = function () {
  if (self.IN_DIFF) {
    return;
  }
  self.IN_DIFF = true;
  // mark if the component need to be refreshed
  let shouldUpdateRecord = false;

  const filterdRecords = self.getFilteredRecords();

  if (self.refreshing) {
    self.beginIndex = filterdRecords.length - 1 - defaultLimit;
    self.endIndex = filterdRecords.length - 1;
  } else {
    if (self.endIndex > filterdRecords.length) {
      self.endIndex = filterdRecords.length;
    }
  }

  const newStateRecords = filterdRecords.slice(self.beginIndex, self.endIndex + 1);
  const currentDataLength = self.currentStateData.length;
  const newDataLength = newStateRecords.length;

  if (newDataLength !== currentDataLength) {
    shouldUpdateRecord = true;
  } else {
    // only the two with same index and the `_render` === true then we'll need to render
    for (let i = 0; i < currentDataLength; i++) {
      const item = self.currentStateData[i];
      const targetItem = newStateRecords[i];
      if (item.id !== targetItem.id || targetItem._render === true) {
        shouldUpdateRecord = true;
        break;
      }
    }
  }

  self.currentStateData = newStateRecords;

  self.postMessage(JSON.stringify({
    type: 'updateData',
    shouldUpdateRecord,
    recordList: newStateRecords
  }));
  self.IN_DIFF = false;
};

// check if there are many new records arrivied
self.checkNewRecordsTip = function () {
  if (self.IN_DIFF) {
    return;
  }

  const newRecordLength = self.getFilteredRecords().length;
  self.postMessage(JSON.stringify({
    type: 'updateTip',
    data: (newRecordLength - self.endIndex) > 0
  }));
};

self.updateSingle = function (record) {
  recordList.forEach((item) => {
    item._render = false;
  });

  const index = recordList.findIndex((item) => {
    return item.id === record.id;
  });

  if (index >= 0) {
    // set the mark to ensure the item get re-rendered
    record._render = true;
    recordList[index] = record;
  } else {
    recordList.push(record);
  }
  self.calculateFilteredRecords(false, [record]);
};

self.updateMultiple = function (records) {
  recordList.forEach((item) => {
    item._render = false;
  });

  records.forEach((record) => {
    const index = recordList.findIndex((item) => {
      return item.id === record.id;
    });

    if (index >= 0) {
      // set the mark to ensure the item get re-rendered
      record._render = true;
      recordList[index] = record;
    } else {
      recordList.push(record);
    }
  });

  self.calculateFilteredRecords(false, records);
};

self.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  switch (data.type) {
    case 'diff' : {
      self.diffRecords();
      break;
    }
    case 'updateQuery': {
      // if filterStr or limit changed
      if (data.filterStr !== self.filterStr) {
        self.updateQueryTimer && clearTimeout(self.updateQueryTimer);
        self.updateQueryTimer = setTimeout(() => {
          self.resetDisplayRecordIndex();
          self.filterStr = data.filterStr;
          self.calculateFilteredRecords(true);
          self.diffRecords();
        }, 150);
      }
      break;
    }
    case 'updateSingle': {
      self.updateSingle(data.data);
      if (self.refreshing) {
        self.diffRecords();
      } else {
        self.checkNewRecordsTip();
      }
      break;
    }

    case 'updateMultiple': {
      self.updateMultiple(data.data);
      if (self.refreshing) {
        self.diffRecords();
      } else {
        self.checkNewRecordsTip();
      }
      break;
    }
    case 'initRecord': {
      recordList = data.data;
      self.calculateFilteredRecords(true);
      self.diffRecords();
      break;
    }

    case 'clear': {
      recordList = [];
      self.calculateFilteredRecords(true);
      self.diffRecords();
      break;
    }

    case 'loadMore': {
      if (self.IN_DIFF) {
        return;
      }
      self.refreshing = false;
      if (data.data > 0) {
        self.endIndex += data.data;
      } else {
        self.beginIndex = Math.max(self.beginIndex + data.data, 0);
      }
      self.diffRecords();
      break;
    }

    case 'updateRefreshing': {
      if (typeof data.refreshing === 'boolean') {
        self.refreshing = data.refreshing;
        if (self.refreshing) {
          self.diffRecords();
        }
      }
      break;
    }

    default: {
      break;
    }
  }
});
