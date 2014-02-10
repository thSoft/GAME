var Chosen = React.createClass({
	displayName: 'Chosen',
	componentDidUpdate: function() {
		// chosen doesn't refresh the options by itself, babysit it
		$(this.getDOMNode()).trigger('chosen:updated');
	},
	componentDidMount: function() {
		$(this.getDOMNode()).chosen({
			disable_search_threshold: this.props.disableSearchThreshold,
			no_results_text: this.props.noResultsText,
			max_selected_options: this.props.maxSelectedOptions,
			allow_single_deselect: this.props.allowSingleDeselect,
			width: this.props.width,
			search_contains: this.props.searchContains
		}).on('chosen:maxselected', this.props.onMaxSelected).change(
				this.props.onChange);
	},
	componentWillUnmount: function() {
		var domNode = <Element>this.getDOMNode();
		$(domNode).off('chosen:maxselected change');
		domNode.parentNode.removeChild(domNode);
	},
	render: function() {
		return this
				.transferPropsTo(React.DOM.select(null, this.props.children));
	}
});
