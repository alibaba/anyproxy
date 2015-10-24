function init(React){

	var DetailPanel = React.createClass({displayName: "DetailPanel",
		getInitialState : function(){
			return {
				body : {id : -1, content : null},
				left : "35%"
			};
		},
		loadBody:function(){
			var self = this,
			    id   = self.props.data.id;
			if(!id) return;

			jQuery.get("/fetchBody?id=" + id ,function(resObj){
				if(resObj && resObj.id){
					if(resObj.type && resObj.type == "image" && resObj.ref){
						self.setState({
							body : {
								img : resObj.ref,
								id  : resObj.id
							}
						});
					}else if(resObj.content){
						self.setState({
							body : {
								body : resObj.content,
								id   : resObj.id
							}
						});
					}
				}
			});
		},
		render : function(){
			var reqHeaderSection = [],
				resHeaderSection = [],
				summarySection,
				detailSection,
				bodyContent;

			if(this.props.data.reqHeader){
				for(var key in this.props.data.reqHeader){
					reqHeaderSection.push(React.createElement("li", {key: "reqHeader_" + key}, React.createElement("strong", null, key), " : ", this.props.data.reqHeader[key]))
				}
			}

			summarySection = (
				React.createElement("div", null, 
					React.createElement("section", {className: "req"}, 
						React.createElement("h4", {className: "subTitle"}, "request"), 
						React.createElement("div", {className: "detail"}, 
							React.createElement("ul", {className: "uk-list"}, 
							    React.createElement("li", null, this.props.data.method, " ", React.createElement("span", {title: "{this.props.data.path}"}, this.props.data.path), " HTTP/1.1"), 
							    reqHeaderSection
							)
						)
					), 
					
					React.createElement("section", {className: "reqBody"}, 
						React.createElement("h4", {className: "subTitle"}, "request body"), 
						React.createElement("div", {className: "detail"}, 
							React.createElement("p", null, this.props.data.reqBody)
						)
					)
				)
			);

			if(this.props.data.statusCode){
				if(this.state.body.id == this.props.data.id){
					if(this.state.body.img){
						var imgEl = { __html : '<img src="'+ this.state.body.img +'" />'};
						bodyContent = (React.createElement("div", {dangerouslySetInnerHTML: imgEl}));
					}else{
						bodyContent = (React.createElement("pre", {className: "resBodyContent"}, this.state.body.body));
					}
				}else{
					bodyContent = null;
					this.loadBody();
				}

				if(this.props.data.resHeader){
					for(var key in this.props.data.resHeader){
						resHeaderSection.push(React.createElement("li", {key: "resHeader_" + key}, React.createElement("strong", null, key), " : ", this.props.data.resHeader[key]))
					}
				}

				detailSection = (
					React.createElement("div", null, 
						React.createElement("section", {className: "resHeader"}, 
							React.createElement("h4", {className: "subTitle"}, "response header"), 
							React.createElement("div", {className: "detail"}, 
								React.createElement("ul", {className: "uk-list"}, 
								    React.createElement("li", null, "HTTP/1.1 ", React.createElement("span", {className: "http_status http_status_" + this.props.data.statusCode}, this.props.data.statusCode)), 
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
				React.createElement("div", null, 
					summarySection, 
					detailSection
				)
			);
		}
	});

	return DetailPanel;	
}

module.exports.init = init;