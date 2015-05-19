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
	
	var DetailPanel = React.createClass({displayName: "DetailPanel",
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
					reqHeaderSection.push(React.createElement("li", {key: "reqHeader_" + key}, React.createElement("strong", null, key), " : ", this.state.data.reqHeader[key]))
				}
			}

			summarySection = (
				React.createElement("div", null, 
					React.createElement("section", {className: "req"}, 
						React.createElement("h4", {className: "subTitle"}, "request"), 
						React.createElement("div", {className: "detail"}, 
							React.createElement("ul", {className: "uk-list"}, 
							    React.createElement("li", null, this.state.data.method, " ", React.createElement("span", {title: "{this.state.data.path}"}, this.state.data.path), " HTTP/1.1"), 
							    reqHeaderSection
							)
						)
					), 
					
					React.createElement("section", {className: "reqBody"}, 
						React.createElement("h4", {className: "subTitle"}, "request body"), 
						React.createElement("div", {className: "detail"}, 
							React.createElement("p", null, this.state.data.reqBody)
						)
					)
				)
			);

			if(this.state.data.statusCode){

				if(this.state.body.id == this.state.data.id){
					bodyContent = (React.createElement("pre", {className: "resBodyContent"}, this.state.body.body));
				}else{
					bodyContent = null;
					this.loadBody();
				}

				if(this.state.data.resHeader){
					for(var key in this.state.data.resHeader){
						resHeaderSection.push(React.createElement("li", {key: "resHeader_" + key}, React.createElement("strong", null, key), " : ", this.state.data.resHeader[key]))
					}
				}

				detailSection = (
					React.createElement("div", null, 
						React.createElement("section", {className: "resHeader"}, 
							React.createElement("h4", {className: "subTitle"}, "response header"), 
							React.createElement("div", {className: "detail"}, 
								React.createElement("ul", {className: "uk-list"}, 
								    React.createElement("li", null, "HTTP/1.1 ", React.createElement("span", {className: "http_status http_status_" + this.state.data.statusCode}, this.state.data.statusCode)), 
								    resHeaderSection
								)
							)
						), 
						
						React.createElement("section", {className: "resBody"}, 
							React.createElement("h4", {className: "subTitle"}, "response body"), 
							React.createElement("div", {className: "detail"}, bodyContent)
						)
					)
				);
			}

			return (
				React.createElement("div", {style: {display:this.state.show ? "block" :"none"}}, 
					React.createElement("div", {className: "overlay_mask", onClick: this.setHide}), 
					React.createElement("div", {className: "recordDetailOverlay", ref: "mainOverlay", style: {left: this.state.left}}, 
						React.createElement("div", {className: "dragbar", onMouseDown: this.dealDrag}), 
						React.createElement("span", {className: "escBtn", onClick: this.setHide}, "Close (ESC)"), 
						React.createElement("div", null, 
							summarySection, 
							detailSection
						)
					)
				)
			);
		}
	});

	return DetailPanel;	
}

module.exports.init = init;