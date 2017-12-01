/* eslint no-var: off */
function injectBaiduStatic() {
  var _hmt = _hmt || [];
  var hm = document.createElement('script');
  var s = document.getElementsByTagName('script')[0];

  hm.src = '//hm.baidu.com/hm.js?4e51565b7d471fd6623c163a8fd79e07';
  s.parentNode.insertBefore(hm, s);
}


injectBaiduStatic();
