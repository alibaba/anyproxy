function init(React){
	var RecordRow   = require("./recordRow").init(React);

	var RecordPanel = React.createClass({
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

					rowCollection.push(<RecordRow key={item.id} data={item}></RecordRow>);
				}
			}

			return (
				<table className="uk-table uk-table-condensed uk-table-hover">
					<thead>
						<tr>
							<th className="col_id">id</th>
							<th className="col_method">method</th>
							<th className="col_code">code</th>
							<th className="col_host">host</th>
							<th className="col_path">path</th>
							<th className="col_mime">mime type</th>
							<th className="col_time">time</th>
						</tr>
					</thead>
					<tbody>
						{rowCollection}
					</tbody>
				</table>
			);
		}
	});

	return RecordPanel;
}

module.exports.init = init;