/**
* AJAX操作工具类
*/
import PromiseUtil from './PromiseUtil';
export function getJSON(url, data) {
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

export function postJSON(url, data) {
    const d = PromiseUtil.defer();
    fetch(url, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
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

function serializeQuery (data = {}) {
    data['__t'] = Date.now();// disable the cache
    const queryArray = [];

    for (let key in data) {
        queryArray.push(`${key}=${data[key]}`);
    }

    const queryStr = queryArray.join('&');

    return queryStr ? '?' + queryStr : '';
}

export function isApiSuccess (response) {
    return response.status === 'success';
}

const ApiUtil = {
    getJSON,
    postJSON,
    isApiSuccess
};

export default ApiUtil;
