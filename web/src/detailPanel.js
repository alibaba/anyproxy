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
	
	var DetailPanel = React.createClass({
		getInitialState : function(){
			return {
				show : false,
				data : {},
				body : {id : -1, content : null},
				left : "35%"
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
		loadBody:function(){
			var self = this,
			    id   = self.state.data.id;
			if(!id) return;

			ws.reqBody(id,function(content){
				if(content.id == self.state.data.id){
					self.setState({
						body : content
					});
				}
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
		render : function(){
			var reqHeaderSection = [],
				resHeaderSection = [],
				summarySection,
				detailSection,
				bodyContent;

			if(this.state.data.reqHeader){
				for(var key in this.state.data.reqHeader){
					reqHeaderSection.push(<li key={"reqHeader_" + key}><strong>{key}</strong> : {this.state.data.reqHeader[key]}</li>)
				}
			}

			summarySection = (
				<div>
					<section className="req">
						<h4 className="subTitle">request</h4>
						<div className="detail">
							<ul className="uk-list">
							    <li>{this.state.data.method} <span title="{this.state.data.path}">{this.state.data.path}</span> HTTP/1.1</li>
							    {reqHeaderSection}
							</ul>
						</div>
					</section>
					
					<section className="reqBody">
						<h4 className="subTitle">request body</h4>
						<div className="detail">
							<p>{this.state.data.reqBody}</p>
						</div>
					</section>
				</div>
			);

			if(this.state.data.statusCode){

				if(this.state.body.id == this.state.data.id){
					bodyContent = (<pre className="resBodyContent">{this.state.body.body}</pre>);
				}else{
					bodyContent = null;
					this.loadBody();
				}

				if(this.state.data.resHeader){
					for(var key in this.state.data.resHeader){
						resHeaderSection.push(<li key={"resHeader_" + key}><strong>{key}</strong> : {this.state.data.resHeader[key]}</li>)
					}
				}

				detailSection = (
					<div>
						<section className="resHeader">
							<h4 className="subTitle">response header</h4>
							<div className="detail">
								<ul className="uk-list">
								    <li>HTTP/1.1 <span className={"http_status http_status_" + this.state.data.statusCode}>{this.state.data.statusCode}</span></li>
								    {resHeaderSection}
								</ul>
							</div>
						</section>
						
						<section className="resBody">
							<h4 className="subTitle">response body</h4>
							<div className="detail">{bodyContent}</div>
						</section>
					</div>
				);
			}

			return (
				<div style={{display:this.state.show ? "block" :"none"}}>
					<div className="overlay_mask" onClick={this.setHide}></div>
					<div className="recordDetailOverlay" ref="mainOverlay" style={{left: this.state.left}}>
						<div className="dragbar" onMouseDown={this.dealDrag}></div>
						<span className="escBtn" onClick={this.setHide}>Close (ESC)</span>
						<div>
							{summarySection}
							{detailSection}
						</div>
					</div>
				</div>
			);
		}
	});

	return DetailPanel;	
}

module.exports.init = init;