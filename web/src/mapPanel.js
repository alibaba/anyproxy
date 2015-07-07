require("../lib/jstree");

function init(React){
	var MapForm = require("./mapForm").init(React),
		MapList = require("./mapList").init(React);

	var MapPanel = React.createClass({
		appendRecord : function(data){
			var self          = this,
				listComponent = self.refs.list;
			
			listComponent.appendRecord(data);
		},
		
		render:function(){
			var self = this;
			return (
				<div className="mapWrapper">
					<h4 className="subTitle">Current Config</h4>
					<MapList ref="list"/>
					
					<h4 className="subTitle">Map Local</h4>
					<MapForm onSubmit={self.appendRecord}/>
				</div>
			);
		}
	});

	return MapPanel;
}

module.exports.init = init;