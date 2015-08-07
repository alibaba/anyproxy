require("../lib/jstree");

function init(React){
	var MapForm = require("./mapForm").init(React),
		MapList = require("./mapList").init(React);

	var MapPanel = React.createClass({displayName: "MapPanel",
		appendRecord : function(data){
			var self          = this,
				listComponent = self.refs.list;
			
			listComponent.appendRecord(data);
		},
		
		render:function(){
			var self = this;
			return (
				React.createElement("div", {className: "mapWrapper"}, 
					React.createElement("h4", {className: "subTitle"}, "Current Config"), 
					React.createElement(MapList, {ref: "list", onChange: self.props.onChange}), 
					
					React.createElement("h4", {className: "subTitle"}, "Add Map Rule"), 
					React.createElement(MapForm, {onSubmit: self.appendRecord})
				)
			);
		}
	});

	return MapPanel;
}

module.exports.init = init;
module.exports.fetchConfig = require("./mapList").fetchConfig;