function init(React){
	var RecordRow   = require("./recordRow").init(React);

	var RecordPanel = React.createClass({displayName: "RecordPanel",
		getInitialState : function(){
			return {
				list  : [],
				filter: ""
			};
		},
		render : function(){
			var self          = this,
				rowCollection = [],
				filterStr     = self.state.filter,
				filter        = filterStr;

			//regexp
			if(filterStr[0]=="/" && filterStr[filterStr.length-1]=="/"){
				try{
					filter = new RegExp(filterStr.substr(1,filterStr.length-2));
				}catch(e){}
			}

			for(var i = self.state.list.length-1 ; i >=0 ; i--){
				var item = self.state.list[i];
				if(item){
					if(filter && item){
						try{
							if(typeof filter == "object" && !filter.test(item.url)){
								continue;
							}else if(typeof filter == "string" && item.url.indexOf(filter) < 0){
								continue;
							}
						}catch(e){}
					}

					if(item._justUpdated){
						item._justUpdated = false;
						item._needRender  = true;
					}else{
						item._needRender  = false;
					}

					rowCollection.push(React.createElement(RecordRow, {key: item.id, data: item, onSelect: self.props.onSelect.bind(self,item)}));
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