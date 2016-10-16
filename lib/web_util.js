var JSON_CONTENT_TYPES       = [
    "application/json"
    ],
    JAVASCRIPT_CONTENT_TYPES = [
        "application/javascript",
        "application/x-javascript"
    ],
    XML_CONTENT_TYPES       = [
        "text/xml",
        "application/xml",
        "application/xcap-diff+xml",
        "application/xenc+xml",
        "application/patch-ops-error+xml",
        "application/resource-lists+xml",
        "application/rls-services+xml",
        "application/resource-lists-diff+xml",
        "application/xslt+xml"
    ],
    HTML_CONTENT_TYPES      = [
        "text/html",
        "application/xhtml+xml"
    ],
    CSS_CONTENT_TYPES       = [
        "text/css"
    ];

module.exports.responseTypes = { 
        XML_TYPE  : "xml",
        HTML_TYPE : "html",
        JSON_TYPE : "json",
        JS_TYPE   : "javascript",
        CSS_TYPE  : "css",
        TEXT_TYPE : "text"
};

module.exports.getResponseType = function(contentType){
    if (XML_CONTENT_TYPES.some(function (i){ return contentType.indexOf(i.toLowerCase()) != -1; }))
        return this.responseTypes.XML_TYPE;
    else if (JSON_CONTENT_TYPES.some(function (i){ return contentType.indexOf(i.toLowerCase()) != -1; }))
        return this.responseTypes.JSON_TYPE;
    else if (JAVASCRIPT_CONTENT_TYPES.some(function (i){ return contentType.indexOf(i.toLowerCase()) != -1; }))
        return this.responseTypes.JS_TYPE;
    else if (HTML_CONTENT_TYPES.some(function (i){ return contentType.indexOf(i.toLowerCase()) != -1; }))
        return this.responseTypes.HTML_TYPE;
    else if (CSS_CONTENT_TYPES.some(function (i){ return contentType.indexOf(i.toLowerCase()) != -1; }))
        return this.responseTypes.CSS_TYPE;
    else 
        return this.responseTypes.TEXT_TYPE;
};