function init(React){
	function dateFormat(date,fmt) {
	    var o = {
	        "M+": date.getMonth() + 1, //月份 
	        "d+": date.getDate(), //日 
	        "h+": date.getHours(), //小时 
	        "m+": date.getMinutes(), //分 
	        "s+": date.getSeconds(), //秒 
	        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
	        "S" : date.getMilliseconds() //毫秒 
	    };
	    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
	    for (var k in o) if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	    return fmt;
	}

	var RecordRow = React.createClass({displayName: "RecordRow",
		getInitialState : function(){
			return null;
		},
		render : function(){
			var trClassesArr = [],
				trClasses,
				data = this.props.data || {};
			if(data.statusCode){
				trClassesArr.push("record_status_done");
			}

			trClassesArr.push( ((Math.floor(data._id /2) - data._id /2) == 0)? "row_even" : "row_odd" );
			trClasses = trClassesArr.join(" ");

			var dateStr = dateFormat(new Date(data.startTime),"hh:mm:ss");

			var rowIcon = [];
			if(data.protocol == "https"){
				rowIcon.push(React.createElement("span", {className: "icon_record", title: "https"}, React.createElement("i", {className: "uk-icon-lock"})));
			}

			if(data.ext && data.ext.map){
				rowIcon.push(React.createElement("span", {className: "icon_record", title: "mapped to local file"}, React.createElement("i", {className: "uk-icon-shield"})));
			}

			return(
				React.createElement("tr", {className: trClasses, onClick: this.props.onSelect}, 
					React.createElement("td", {className: "data_id"}, data._id), 
					React.createElement("td", null, data.method, " ", rowIcon, " "), 
					React.createElement("td", {className: "http_status http_status_" + data.statusCode}, data.statusCode), 
					React.createElement("td", {title: data.host}, data.host), 
					React.createElement("td", {title: data.path}, data.path), 
					React.createElement("td", null, data.mime), 
					React.createElement("td", null, dateStr)
				)
			);
		},
		shouldComponentUpdate:function(nextPros){
			return nextPros.data._needRender;
		},
		componentDidUpdate:function(){},
		componentWillUnmount:function(){}
	});

	return RecordRow;
}

module.exports.init = init;