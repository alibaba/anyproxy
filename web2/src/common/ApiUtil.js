/**
* AJAX操作工具类
*/
import PromiseUtil from './PromiseUtil';

export function getJSON(url, data) {
    console.info('GET JSON calling');
    const d = PromiseUtil.defer();
    fetch(url + serializeQuery(data))
        .then((data) => {
            d.resolve(data.json());
        })
        .catch((error) => {
            console.error(error);
            d.reject(error);
        });
    return d.promise;
}

function postJSON(url, data) {
    const d = PromiseUtil.defer();
    fetch(url, {
        method: 'POST',
        body: JSON.stringify(data)
    })
        .then((data) => {

            d.resolve(data.json());
        })
        .catch((error) => {
            console.error(error);
            d.reject(error);
        });
    return d.promise;
}

function serializeQuery (data) {
    if (!data) {
        return '';
    }

    const queryArray = [];

    for (let key in data) {
        queryArray.push(`${key}=${data[key]}`);
    }

    const queryStr = queryArray.join('&');

    return queryStr ? '?' + queryStr : '';
}

const ApiUtil = {
    getJSON,
    postJSON
};

export default ApiUtil;
