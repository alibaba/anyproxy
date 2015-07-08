function init(React){

	function dragableBar(initX,cb){
		var self     = this,
			dragging = true;

		var ghostbar = $('<div class="ghostbar"></div>').css("left",initX).prependTo('body');

		$(document).mousemove(function(e){
			e.preventDefault();
			ghostbar.css("left",e.pageX + "px");
		});

		$(document).mouseup(function(e){
			if(!dragging) return;

			dragging = false;

			var deltaPageX = e.pageX - initX;
			cb && cb.call(null,{
				delta  : deltaPageX,
				finalX : e.pageX
			});
			
			ghostbar.remove();
			$(document).unbind('mousemove');
		});	
	}

	var Popup = React.createClass({
		getInitialState : function(){
			return {
				show    : false,
				left    : "35%",
				content : null
			};
		},
		componentDidMount:function(){
			var self = this;
			$(document).on("keyup",function(e){
				if(e.keyCode == 27){ //ESC
					self.setState({
						show : false
					});
				}
			});
		},
		setHide:function(){
			this.setState({
				show : false
			});
		},
		setShow:function(ifShow){
			this.setState({
				show : true
			});
		},
		dealDrag:function(){
			var self    = this,
				leftVal = $(React.findDOMNode(this.refs.mainOverlay)).css("left");
			dragableBar(leftVal, function(data){
				if(data && data.finalX){
					if(window.innerWidth - data.finalX < 200){
						data.finalX = window.innerWidth - 200;
					}
					self.setState({
						left : data.finalX + "px"
					});
				}
			});
		},
		componentDidUpdate:function(){

		},
		render : function(){
			return (
				<div style={{display:this.state.show ? "block" :"none"}}>
					<div className="overlay_mask" onClick={this.setHide}></div>
					<div className="recordDetailOverlay" ref="mainOverlay" style={{left: this.state.left}}>
						<div className="dragbar" onMouseDown={this.dealDrag}></div>
						<span className="escBtn" onClick={this.setHide}><i className="uk-icon-times"></i></span>
						<div>
							{this.state.content}
						</div>
					</div>
				</div>
			);
		}
	});

	return Popup;	
}

module.exports.init = init;