function init(React){

	var DetailPanel = React.createClass({
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
					reqHeaderSection.push(<li key={"reqHeader_" + key}><strong>{key}</strong> : {this.props.data.reqHeader[key]}</li>)
				}
			}

			summarySection = (
				<div>
					<section className="req">
						<h4 className="subTitle">request</h4>
						<div className="detail">
							<ul className="uk-list">
							    <li>{this.props.data.method} <span title="{this.props.data.path}">{this.props.data.path}</span> HTTP/1.1</li>
							    {reqHeaderSection}
							</ul>
						</div>
					</section>
					
					<section className="reqBody">
						<h4 className="subTitle">request body</h4>
						<div className="detail">
							<p>{this.props.data.reqBody}</p>
						</div>
					</section>
				</div>
			);

			if(this.props.data.statusCode){
				if(this.state.body.id == this.props.data.id){
					if(this.state.body.img){
						var imgEl = { __html : '<img src="'+ this.state.body.img +'" />'};
						bodyContent = (<div dangerouslySetInnerHTML={imgEl}></div>);
					}else{
						bodyContent = (<pre className="resBodyContent">{this.state.body.body}</pre>);
					}
				}else{
					bodyContent = null;
					this.loadBody();
				}

				if(this.props.data.resHeader){
					for(var key in this.props.data.resHeader){
						resHeaderSection.push(<li key={"resHeader_" + key}><strong>{key}</strong> : {this.props.data.resHeader[key]}</li>)
					}
				}

				detailSection = (
					<div>
						<section className="resHeader">
							<h4 className="subTitle">response header</h4>
							<div className="detail">
								<ul className="uk-list">
								    <li>HTTP/1.1 <span className={"http_status http_status_" + this.props.data.statusCode}>{this.props.data.statusCode}</span></li>
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
				<div>
					{summarySection}
					{detailSection}
				</div>
			);
		}
	});

	return DetailPanel;	
}

module.exports.init = init;