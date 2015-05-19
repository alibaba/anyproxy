function init(React){
	var WsIndicator = React.createClass({
		getInitialState:function(){
			return {
				isValid: false
			}
		},
		render:function(){
			return (
				<img className="logo_bottom anim_rotation" src="https://t.alipayobjects.com/images/rmsweb/T1P_dfXa8oXXXXXXXX.png" width="50" height="50" style={{display: this.state.isValid ?"block" : "none" }} />
			);
		}
	});

	return WsIndicator;
}

module.exports.init = init;