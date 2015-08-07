function fetchConfig(cb){
	return $.getJSON("/getMapConfig",cb);
}

function init(React){
	var MapList = React.createClass({
		getInitialState:function(){
			return {
				ruleList : []
			}
		},
		appendRecord:function(data){
			var self = this,
			    newState = self.state.ruleList;

		    if(data && data.keyword && data.local){
				newState.push({
					keyword : data.keyword,
					local   : data.local
				});

				self.setState({
					ruleList: newState
				});
		    }
		},

		removeRecord:function(index){
			var self    = this,
				newList = self.state.ruleList;

			newList.splice(index,1);
			self.setState({
				ruleList : newList
			});
		},
		render:function(){
			var self       = this,
			    collection = [];

		    collection = self.state.ruleList.map(function(item,index){
		    	return (
					<li>
						<strong>{item.keyword}</strong><a className="removeBtn" href="#" onClick={self.removeRecord.bind(self,index)}>remove</a><br />
						<span>{item.local}</span>
					</li>
	    		);
		    });

			return (
				<ul className="mapRuleList">
					{collection}
				</ul>
			);
		},
		componentDidMount :function(){
			var self = this;
			fetchConfig(function(data){
				self.setState({
					ruleList : data
				});
			});
		},
		componentDidUpdate:function(){
			var self = this;

			//upload config to server
			var currentList = self.state.ruleList;
			$.ajax({
				method      : "POST",
				url         : "/setMapConfig",
				contentType :"application/json",
				data        : JSON.stringify(currentList),
				dataType    : "json",
				success     :function(res){}
			});

			self.props.onChange && self.props.onChange(self.state.ruleList);
		}
	});

	return MapList;
}

module.exports.init = init;
module.exports.fetchConfig = fetchConfig;