function init(React){
	var DetailPanel = require("./detailPanel").init(React);

	$("body").append('<div id="J_detailPanel"></div>');
	var detail = React.render(
		<DetailPanel />,
		document.getElementById("J_detailPanel")
	);

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

	var RecordRow = React.createClass({
		getInitialState : function(){
			return null;
		},
		handleClick:function(e){
			detail.setState({
				data : this.props.data,
				show : true
			});
		},
		render : function(){
			var trClassesArr = [],
				trClasses;
			if(this.props.data.statusCode){
				trClassesArr.push("record_status_done");
			}

			trClassesArr.push( ((Math.floor(this.props.data._id /2) - this.props.data._id /2) == 0)? "row_even" : "row_odd" );
			trClasses = trClassesArr.join(" ");

			var dateStr = dateFormat(new Date(this.props.data.startTime),"hh:mm:ss");

			return(
				<tr className={trClasses} onClick={this.handleClick}>
					<td className="data_id">{this.props.data._id}</td>
					<td>{this.props.data.method} <span className={"protocol protocol_" + this.props.data.protocol} title="https"><i className="uk-icon-lock"></i></span> </td>
					<td className={"http_status http_status_" + this.props.data.statusCode}>{this.props.data.statusCode}</td>
					<td title={this.props.data.host}>{this.props.data.host}</td>
					<td title={this.props.data.path}>{this.props.data.path}</td>
					<td>{this.props.data.mime}</td>
					<td>{dateStr}</td>
				</tr>
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