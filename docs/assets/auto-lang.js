/* eslint no-var: off */
/**
* detect if the browser is in UTF-8 zone
* @return boolean
*/
function isUTF8Zone() {
  return new Date().getTimezoneOffset() === -480;
}

/**
* detect if the browser is already in a locale view
*/
function isInLocaleView() {
  return /(cn|en)/i.test(location.href);
}

function initDefaultLocaleAndStatic() {
  if (!isInLocaleView()) {
    location.href = isUTF8Zone() ? '/cn' : 'en';
  }
}

initDefaultLocaleAndStatic();
