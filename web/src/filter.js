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
				<div className="filterSection">
					<h4 className="subTitle">Log Filter</h4>

					<form className="uk-form">
						<input className="uk-form-large" ref="keywordInput" onChange={self.dealChange} type="text" placeholder="type keywords or /^regExp$/" width="300"/>
					</form>
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