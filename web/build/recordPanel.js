function init(React){
	var RecordRow   = require("./recordRow").init(React);

	var RecordPanel = React.createClass({displayName: "RecordPanel",
		getInitialState : function(){
			return {
				list : []
			};
		},
		render : function(){
			var rowCollection = [];
			for(var i = this.state.list.length-1 ; i >=0 ; i--){
				var item = this.state.list[i];
				if(item){

					if(item._justUpdated){
						item._justUpdated = false;
						item._needRender  = true;
					}else{
						item._needRender  = false;
					}

					rowCollection.push(React.createElement(RecordRow, {key: item.id, data: item}));
				}
			}

			return (
				React.createElement("table", {className: "uk-table uk-table-condensed uk-table-hover"}, 
					React.createElement("thead", null, 
						React.createElement("tr", null, 
							React.createElement("th", {className: "col_id"}, "#"), 
							React.createElement("th", {className: "col_method"}, "method"), 
							React.createElement("th", {className: "col_code"}, "code"), 
							React.createElement("th", {className: "col_host"}, "host"), 
							React.createElement("th", {className: "col_path"}, "path"), 
							React.createElement("th", {className: "col_mime"}, "mime type"), 
							React.createElement("th", {className: "col_time"}, "time")
						)
					), 
					React.createElement("tbody", null, 
						rowCollection
					)
				)
			);
		}
	});

	return RecordPanel;
}

module.exports.init = init;