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
const defaultLimit = 500;
self.currentStateData = []; // the data now used by state
self.filterStr = '';
self.limit = 0;
self.canLoadMore = false;
self.updateQueryTimer = null;
self.refreshing = true;
self.beginIndex = 0;
self.endIndex = self.beginIndex + defaultLimit -1;
self.IN_DIFF = false; // mark if currently in diff working
const getFilterReg = function (filterStr) {
    let filterReg = null;
    if (filterStr) {
        let regFilterStr = filterStr
            .replace(/\r\n/g, '\n')
            .replace(/\n\n/g, '\n');

        // remove the last /\n$/ in case an accidential br
        regFilterStr = regFilterStr.replace(/\n*$/, '');

        if(regFilterStr[0] === '/' && regFilterStr[regFilterStr.length -1] === '/') {
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
        } catch(e) {
            console.error(e);
        }
    }

    return filterReg;
};

self.getFilteredRecords = function () {
    const filterReg = getFilterReg(self.filterStr);
    const filterdRecords = [];
    const length = recordList.length;

    // filtered out the records
    for (let i = 0 ; i < length; i++) {
        const item = recordList[i];
        if (filterReg && filterReg.test(item.url)) {
            filterdRecords.push(item);
        }

        if (!filterReg) {
            filterdRecords.push(item);
        }
    }

    return filterdRecords;
};

// diff the record, so if refreshing is stoped the page will not be updated
self.diffRecords = function () {
    if (self.IN_DIFF) {
        return;
    }
    self.IN_DIFF = true;
    // mark if the component need to be refreshed
    let shouldUpdateRecord = false;

    const filterdRecords = self.getFilteredRecords();

    if (self.refreshing) {
        self.beginIndex = filterdRecords.length -1 - defaultLimit;
        self.endIndex = filterdRecords.length -1;
    } else {
        if (self.endIndex > filterdRecords.length) {
            self.endIndex = filterdRecords.length;
        }
    }

    const newStateRecords = filterdRecords.slice(self.beginIndex, self.endIndex +1);
    const currentDataLength = self.currentStateData.length;
    const newDataLength = newStateRecords.length;

    if (newDataLength !== currentDataLength) {
        shouldUpdateRecord = true;
    } else {
        // only the two with same index and the `_render` === true then we'll need to render
        for (let i = 0; i < currentDataLength; i++) {
            const item  = self.currentStateData[i];
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
        shouldUpdateRecord: shouldUpdateRecord,
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
        data: (newRecordLength - self.endIndex) > 20
    }));
};

const updateSingle = function (record) {
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
};

const updateMultiple = function (records) {
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
            if (data.limit !== self.limit || data.filterStr !== self.filterStr) {
                self.updateQueryTimer && clearTimeout(self.updateQueryTimer);
                self.updateQueryTimer = setTimeout(function () {
                    self.limit = data.limit;
                    self.filterStr = data.filterStr;
                    self.diffRecords();
                }, 150);
            }
            break;
        }
        case 'updateSingle': {
            updateSingle(data.data);
            if(self.refreshing) {
                self.diffRecords();
            } else {
                self.checkNewRecordsTip();
            }
            break;
        }

        case 'updateMultiple': {
            updateMultiple(data.data);
            if(self.refreshing) {
                self.diffRecords();
            } else {
                self.checkNewRecordsTip();
            }
            break;
        }
        case 'initRecord': {
            recordList = data.data;
            self.diffRecords();
            break;
        }

        case 'clear': {
            recordList = [];
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
        }

        case 'updateRefreshing': {
            if (typeof data.refreshing === 'boolean') {
                self.refreshing = data.refreshing;
                if (self.refreshing) {
                    self.diffRecords();
                }
            }
        }
    }
});