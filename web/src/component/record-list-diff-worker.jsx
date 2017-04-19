/*
* A webworker to identify whether the component need to be re-rendered
*/
const getFilterReg = function (filterStr) {
  let filterReg = null;
  if (filterStr) {
    let regFilterStr = filterStr
      .replace(/\r\n/g, '\n')
      .replace(/\n\n/g, '\n');

    // remove the last /\n$/ in case an accidential br
    regFilterStr = regFilterStr.replace(/\n$/, '');

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

self.addEventListener('message', (e) => {
  const data = JSON.parse(e.data);
  const { limit, currentData, nextData, filterStr } = data;
  const filterReg = getFilterReg(filterStr);
  const filterdRecords = [];
  const length = nextData.length;

  // mark if the component need to be refreshed
  let shouldUpdate = false;

  // filtered out the records
  for (let i = 0; i < length; i++) {
    const item = nextData[i];
    if (filterReg && filterReg.test(item.url)) {
      filterdRecords.push(item);
    }

    if (!filterReg) {
      filterdRecords.push(item);
    }

    if (filterdRecords.length >= limit) {
      break;
    }
  }

  const newDataLength = filterdRecords.length;
  const currentDataLength = currentData.length;

  if (newDataLength !== currentDataLength) {
    shouldUpdate = true;
  } else {
    // only the two with same index and the `_render` === true then we'll need to render
    for (let i = 0; i < currentData.length; i++) {
      const item = currentData[i];
      const targetItem = filterdRecords[i];
      if (item.id !== targetItem.id || targetItem._render === true) {
        shouldUpdate = true;
        break;
      }
    }
  }

  self.postMessage(JSON.stringify({
    shouldUpdate,
    data: filterdRecords
  }));
});
