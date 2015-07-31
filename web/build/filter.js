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
				React.createElement("div", null, 
					React.createElement("h4", {className: "subTitle"}, "Log Filter"), 
					React.createElement("div", {className: "filterSection"}, 
						React.createElement("div", {className: "uk-form"}, 
							React.createElement("input", {className: "uk-form-large", ref: "keywordInput", onChange: self.dealChange, type: "text", placeholder: "keywords or /^regExp$/", width: "300"})
						)
					), 
				    React.createElement("p", null, 
					    React.createElement("i", {className: "uk-icon-magic"}), "  type ", React.createElement("strong", null, "/id=\\d", 3, "/"), " will give you all the logs containing ", React.createElement("strong", null, "id=123")
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