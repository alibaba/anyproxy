function init(React){

	var Filter = React.createClass({

		dealChange:function(){
			var self = this,
				userInput = React.findDOMNode(self.refs.keywordInput).value;

			self.props.onChangeKeyword && self.props.onChangeKeyword.call(null,userInput);
		},
		setFocus:function(){
			var self = this;
			React.findDOMNode(self.refs.keywordInput).focus();
		},
		componentDidUpdate:function(){
			this.setFocus();
		},
		render:function(){
			var self = this;

			return (
				<div>
					<h4 className="subTitle">Log Filter</h4>
					<div className="filterSection">
						<div className="uk-form">
							<input className="uk-form-large" ref="keywordInput" onChange={self.dealChange} type="text" placeholder="keywords or /^regExp$/" width="300"/>
						</div>
					</div>
				    <p>
					    <i className="uk-icon-magic"></i>&nbsp;&nbsp;type <strong>/id=\d{3}/</strong> will give you all the logs containing <strong>id=123</strong>
				    </p>
				</div>
			);
		},
		componentDidMount:function(){
			this.setFocus();
		}
	});

	return Filter;
}

module.exports.init = init;