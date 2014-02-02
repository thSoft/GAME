function getEditor(dataRef: DataReference, rule: Rule): React.ReactComponent<any, any> {
	return rule.match({
		keyword: keyword => getKeywordEditor(dataRef, keyword),
		literal: literal => getLiteralEditor(dataRef, literal),
		choice: choice => getChoiceEditor(dataRef, choice),
		record: record => getRecordEditor(dataRef, record),
		list: list => getListEditor(dataRef, list)
	});
}

function getKeywordEditor(dataRef: DataReference, keyword: Keyword): React.ReactComponent<any, Object> {
	return React.createClass({

		render: function(): React.ReactComponent<any, any> {
			return createEditor(keyword, {
				children: keyword.name
			});
		}

	})();
}

function getLiteralEditor<V>(dataRef: DataReference, literal: Literal<V>): React.ReactComponent<any, LiteralData<V>> {
	return React.createClass({

		getInitialState: function(): LiteralData<V> {
			return {
				value: literal.defaultValue
			};
		},

		mixins: [getFirebaseMixin(dataRef)],

		render: function(): React.ReactComponent<any, any> {
			var data = <LiteralData<V>>this.state;
			return createEditor(literal, {
				contentEditable: "true",
				onKeyPress: event => {
					if (event.key == "Enter") {
						event.preventDefault();
						changeLiteral(dataRef, literal, <Element>event.target);
					}
				},
				onBlur: event => {
					changeLiteral(dataRef, literal, <Element>event.target);
				},
				children: literal.toString(data.value) // XXX
			});
		}

	})();
}

function getChoiceEditor(dataRef: DataReference, choice: Choice): React.ReactComponent<any, ChoiceData> {
	return React.createClass({
		
		mixins: [getFirebaseMixin(dataRef)],

		render: function(): React.ReactComponent<any, any> {
			var data = <ChoiceData>this.state;
			if (data == null) {
				return React.DOM.span("?");
			} else { 
				var chosenRule = findRule(choice, data.ruleUrl);
				return getEditor(dataRef, chosenRule);
			}
		}

	})();
}

function getRecordEditor(dataRef: DataReference, record: Record): React.ReactComponent<any, Object> {
	return React.createClass({
		
		mixins: [getFirebaseMixin(dataRef)],

		render: function(): React.ReactComponent<any, any> {
			var data = this.state;
			var children = record.segments().map(segment =>
				segment.match({
					textSegment: textSegment => textNode(textSegment.text),
					ruleSegment: ruleSegment => {
						var fieldRef = dataRef.find(data[ruleSegment.fieldName]);
						var fieldRule = ruleSegment.rule;
						return getEditor(fieldRef, fieldRule);
					}
				})
			);
			return createEditor(record, {
				children: children
			});
		}

	})();
}

function getListEditor(dataRef: DataReference, list: List): React.ReactComponent<any, Object> {
	return React.createClass({
		
		mixins: [getFirebaseMixin(dataRef)],
		
		render: function(): React.ReactComponent<any, any> {
			var data = this.state;
			var dataArray = [];
			for (var key in data) {
				if (!isNaN(parseInt(key))) {
					dataArray.push(data[key]);
				}
			}
			var children = [];
			var elementRule = list.elementRule;
			if (dataArray.length > 0) {
				for (var i = 0; i < dataArray.length; i++) {
					var elementRef = dataRef.find(data[i]);
					children.push(getEditor(elementRef, elementRule));
					children.push(textNode(list.separator));
				}
			} else {
				children = [
					textNode("(no " + owl.pluralize(list.elementRule.name) + ", "),
					React.DOM.a({
						href: "javascript:void(0)"
					}, "add one"),
					textNode(")")
				];
			}
			return createEditor(list, {
				children: children
			});
		}

	})();
}

function getFirebaseMixin(dataRef: DataReference): React.ReactMixin<any, any> {
	var subscription: Subscription;
	return {

		componentWillMount: function(): void {
			subscription = dataRef.changed(data => {
				this.setState(toObject(data)); // XXX React only accepts Object
			});
		},

		componentWillUnmount: function(): void {
			subscription.unsubscribe();
		}

	};
};

function createEditor(rule: Rule, attributes: React.HTMLGlobalAttributes): React.ReactComponent<any, any> {
	var hoverClass = "hover";
	var allAttributes: React.HTMLGlobalAttributes = {
		className: "game-editor",
		title: getDescription(rule),
		tabIndex: 0,
		onMouseOver: event => {
			$(event.target).addClass(hoverClass);
		},
		onMouseOut: event => {
			$(event.target).removeClass(hoverClass);
		}
	};
	copyProperties(attributes, allAttributes);
	return React.DOM.span(allAttributes);
}

function textNode(text: string) { // XXX React creates span for text nodes
	return React.DOM.span({
		style: {
			pointerEvents: "none"
		}
	}, text);
}

function changeLiteral(dataRef: DataReference, literal: Literal<any>, editor: Element) {
	dataRef.set({ value: literal.fromString(editor.textContent) });
}

function getDescription(rule: Rule): string {
	return rule.match({
		keyword: keyword => keyword.name + " keyword",
		literal: literal => literal.name + " literal",
		record: record => record.name,
		choice: choice => choice.name + ": " + choice.options().map(option => option.name).join(" or "),
		list: list => list.name + ": list of " + owl.pluralize(list.elementRule.name)
	});
}

function findRule(choice: Choice, url: string): Rule {
	return choice.options().filter(option => option.url == url)[0];
}