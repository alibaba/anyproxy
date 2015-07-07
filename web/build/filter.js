function init(React){

	var Filter = React.createClass({displayName: "Filter",

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
				React.createElement("div", {className: "filterSection"}, 
					React.createElement("h4", {className: "subTitle"}, "Log Filter"), 

					React.createElement("form", {className: "uk-form"}, 
						React.createElement("input", {className: "uk-form-large", ref: "keywordInput", onChange: self.dealChange, type: "text", placeholder: "type keywords or /^regExp$/", width: "300"})
					)
				)
			);
		},
		componentDidMount:function(){
			this.setFocus();
		}
	});

	return Filter;
}

module.exports.init = init;