/*
 * 存放常用工具类
 */

/*
 * 格式化日期
 * @param date Date or timestamp
 * @param formatter yyyyMMddHHmmss
 */
export function formatDate(date, formatter) {
    if (typeof date !== 'object') {
        date = new Date(date);
    }
    const transform = function(value) {
        return value < 10 ? '0' + value : value;
    };
    return formatter.replace(/^YYYY|MM|DD|hh|mm|ss/g, function(match) {
        switch (match) {
            case 'YYYY':
                return transform(date.getFullYear());
            case 'MM':
                return transform(date.getMonth() + 1);
            case 'mm':
                return transform(date.getMinutes());
            case 'DD':
                return transform(date.getDate());
            case 'hh':
                return transform(date.getHours());
            case 'ss':
                return transform(date.getSeconds());
        }
    });
}

export function selectText(element) {
    let range, selection;

    if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
    } else if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(element);
        range.select();
    }
}
const CommonUtil = {
    formatDate,
    selectText
};

export default CommonUtil;

