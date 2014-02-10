function getEditor(dataRef: DataReference, rule: Rule, updateProps: (_: React.HTMLGlobalAttributes) => void = _ => {}): React.ReactComponent<any, any> { // XXX side effect
	return rule.match({
		keyword: keyword => getKeywordEditor(dataRef, keyword, updateProps),
		literal: literal => getLiteralEditor(dataRef, literal, updateProps),
		choice: choice => getChoiceEditor(dataRef, choice, updateProps),
		record: record => getRecordEditor(dataRef, record, updateProps),
		list: list => getListEditor(dataRef, list, updateProps)
	});
}

function getKeywordEditor(dataRef: DataReference, keyword: Keyword, updateProps?: (_: React.HTMLGlobalAttributes) => void): React.ReactComponent<any, Object> {
	return React.createClass({

		render: function(): React.ReactComponent<any, any> {
			return createEditor(keyword, props => {
				props.children = [keyword.name];
				updateProps(props);
			});
		}

	})();
}

function getLiteralEditor<V>(dataRef: DataReference, literal: Literal<V>, updateProps?: (_: React.HTMLGlobalAttributes) => void): React.ReactComponent<any, LiteralData<V>> {
	return React.createClass({

		getInitialState: function(): LiteralData<V> {
			return {
				value: literal.defaultValue
			};
		},

		mixins: [getFirebaseMixin(dataRef)],

		render: function(): React.ReactComponent<any, any> {
			var data = <LiteralData<V>>this.state;
			return createEditor(literal, function(props) {
				props.onKeyDown = event => {
					if (event.key == "Enter") {
						event.preventDefault();
						changeLiteral(dataRef, literal, <Element>event.target);
					}
				};
				props.onBlur = event => {
					changeLiteral(dataRef, literal, <Element>event.target);
				};
				props.children = [literal.toString(data.value)]; // TODO custom editor: depend on React?
				props.contentEditable = "true"; // XXX interferes with superfluous spans
				updateProps(props);
			});
		}

	})();
}

function changeLiteral(dataRef: DataReference, literal: Literal<any>, editor: Element) {
	var valueString = editor.textContent;
	dataRef.set({ value: literal.fromString(valueString) });
	editor.textContent = valueString;
}

function getChoiceEditor(dataRef: DataReference, choice: Choice, updateProps?: (_: React.HTMLGlobalAttributes) => void): React.ReactComponent<any, DataWithRule> {
	return React.createClass({
		
		mixins: [getFirebaseMixin(dataRef)],

		render: function(): React.ReactComponent<any, any> {
			var data = <DataWithRule>this.state;
			if (data == null) {
				return React.DOM.span("?");
			} else {
				var chosenRule = findRule(choice, data.ruleUrl);
				var select = getChoiceSelector(dataRef, data, choice, chosenRule);
				return getEditor(dataRef, chosenRule, props => {
					props.title = props.title + " (" + choice.name + ")";
					props.children.push(select);
					updateProps(props);
				});
			}
		}

	})();
}

interface ChoiceSelectorState {
	visible: boolean;
}

function getChoiceSelector(dataRef: DataReference, data: DataWithRule, choice: Choice, chosenRule: Rule): React.ReactComponent<any, ChoiceSelectorState> {
	var options = getOptions(choice).map(option => {
		var optionText = option.name; // TODO more detailed
		return React.DOM.option({
			key: option.url,
			value: option.url
		}, optionText);
	});
	return Chosen({
		width: "100%",
		searchContains: true,
		onChange: event => {
			var newlyChosenRule = findRule(choice, (<HTMLSelectElement>event.target).value);
			var newData = generate(newlyChosenRule);
			setRule(newData, newlyChosenRule);
			removeData(dataRef, data, chosenRule);
			store(dataRef, newData, newlyChosenRule);
		},
		children: options,
		defaultValue: chosenRule.url
	});
}

function findRule(choice: Choice, url: string): Rule {
	return choice.options().filter(option => option.url == url)[0];
}

function getOptions(rule: Rule): Rule[] {
	return rule.match({
		keyword: keyword => [keyword],
		literal: literal => [literal],
		list: list => [list],
		record: record => [record],
		choice: choice => {
			var result: Rule[] = [];
			choice.options().forEach(option => {
				result = result.concat(getOptions(option));
			});
			return result;
		}
	});
}

function getRecordEditor(dataRef: DataReference, record: Record, updateProps?: (_: React.HTMLGlobalAttributes) => void): React.ReactComponent<any, Object> {
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
			return createEditor(record, props => {
				props.children = children;
				updateProps(props);
			});
		}

	})();
}

function getListEditor(dataRef: DataReference, list: List, updateProps?: (_: React.HTMLGlobalAttributes) => void): React.ReactComponent<any, Object> {
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
			return createEditor(list, props => {
				props.children = children;
				updateProps(props);
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

function createEditor(rule: Rule, updateProps: (_: React.HTMLGlobalAttributes) => void = _ => {}): React.ReactComponent<any, any> {
	var hoverClass = "hover";
	var props: React.HTMLGlobalAttributes = {
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
	updateProps(props);
	return React.DOM.span(props);
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

function textNode(text: string) { // XXX React creates span for text nodes
	return React.DOM.span({
		style: {
			pointerEvents: "none"
		}
	}, text);
}

function store(dataRef: DataReference, data: DataWithRule, rule: Rule): void {
	rule.match({
		keyword: keyword => {
			dataRef.set(data);
		},
		literal: literal => {
			dataRef.set(data);
		},
		choice: choice => {
			dataRef.set(data);
		},
		record: record => {
			var result: DataWithRule = {
				ruleUrl: data.ruleUrl
			};
			record.segments().forEach(segment => segment.match({
				textSegment: textSegment => {},
				ruleSegment: ruleSegment => {
					result[ruleSegment.fieldName] = insertChild(dataRef, data[ruleSegment.fieldName], ruleSegment.rule);
				}
			}));
			dataRef.set(result);
		},
		list: list => {
			var array = <Object[]>data;
			var result: DataWithRule = {
				ruleUrl: data.ruleUrl
			};
			array.forEach(element => {
				result[array.indexOf(element)] = insertChild(dataRef, element, list.elementRule);
			});
			dataRef.set(result);
		}
	});
}

function insertChild(dataRef: DataReference, data: DataWithRule, rule: Rule): string {
	var newDataRef = dataRef.insert({});
	store(newDataRef, data, rule);
	return newDataRef.url();
}

function removeData(dataRef: DataReference, data: DataWithRule, rule: Rule): void {
	rule.match({
		keyword: keyword => {
			dataRef.remove();
		},
		literal: literal => {
			dataRef.remove();
		},
		choice: choice => {
			dataRef.remove();
		},
		record: record => {
			record.segments().forEach(segment => segment.match({
				textSegment: textSegment => {},
				ruleSegment: ruleSegment => {
					var fieldRef = dataRef.find(data[ruleSegment.fieldName])
					readOnce(fieldRef, fieldValue => {
						removeData(fieldRef, fieldValue, ruleSegment.rule);
					});
				}
			}));
			dataRef.remove();
		},
		list: list => {
			var array = <string[]>data;
			array.forEach(element => {
				var elementRef = dataRef.find(element);
				readOnce(elementRef, elementValue => {
					removeData(elementRef, elementValue, list.elementRule);
				});
			});
			dataRef.remove();
		}
	});
}