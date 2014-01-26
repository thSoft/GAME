function bindEditor(elementId: string, rule: Rule, rootRef: DataReference, userId: string): void {
	rootRef.changed(snapshot => {
		[selectFirstChildKey, deleteKey, insertAfterKey].concat(selectNextElementKeys).concat(selectPreviousElementKeys).forEach(keyCombo => {
			KeyboardJS.clear(keyCombo);
		});

		var dataSnapshot = snapshot.child(dataId);
		var editorStateSnapshot = snapshot.child(editorStateId).child(userId);
		var editor = getEditor(rule, dataSnapshot, editorStateSnapshot);
		editor.setAttribute("id", elementId);
		document.body.replaceChild(editor, document.getElementById(elementId));
		
		$("[contenteditable='true']." + selectedClass).focus();

		var dataRootRef = dataSnapshot.reference();
		bindKeyDown(selectParentKey, () => {
			selectParent(editorStateSnapshot, dataRootRef);
		});
		bindKeyDown(selectRootKey, () => {
			setSelectedRef(editorStateSnapshot, dataRootRef);
		});
	});
}

var dataId = "data";
var editorStateId = "editorState";

var enterKey = 13;

function getEditor(rule: Rule, dataSnapshot: DataSnapshot, editorStateSnapshot: DataSnapshot): HTMLElement {
	var data = dataSnapshot.value();
	var result;
	if (check(rule, data)) {
		result = rule.match({
			keyword: keyword => {
				var result = document.createElement("span");
				var value = keyword.name;
				result.appendChild(document.createTextNode(value));
				applyTooltip(result, keyword);
				return result;
			},
			literal: literal => {
				// Display
				var result = document.createElement("span");
				var value = data[valueProperty];
				result.appendChild(literal.view(value));
				$(result).addClass("literal");
				applyTooltip(result, literal);
				// Edit
				result.contentEditable = "true";
				$(result).keyup(event => {
					if (event.keyCode == enterKey) {
						dataSnapshot.reference().child(valueProperty).set(literal.fromString(result.textContent));
					}
				});
				$(result).focus(_ => {
					if (!isSelected(dataSnapshot, editorStateSnapshot)) {
						setSelectedRef(editorStateSnapshot, dataSnapshot.reference());
					}
				});
				return result;
			},
			record: record => {
				// Display
				var result = document.createElement("span");
				record.segments().forEach(segment => {
					segment.match({
						textSegment: textSegment => {
							result.appendChild(document.createTextNode(textSegment.text));
						},
						ruleSegment: ruleSegment => {
							var fieldSnapshot = dataSnapshot.child(ruleSegment.fieldName);
							result.appendChild(getEditor(ruleSegment.rule, fieldSnapshot, editorStateSnapshot));
						}
					});
				});
				applyTooltip(result, record);
				// Navigate
				var fieldNames = record.segments().filter(segment => segment instanceof RuleSegment).map(segment => (<RuleSegment>segment).fieldName);
				bindNavigation(dataSnapshot, editorStateSnapshot, fieldNames);
				return result;
			},
			choice: choice => {
				// Display
				var rule = findRuleNamed(choice, data[ruleProperty]);
				var result = getEditor(rule, dataSnapshot, editorStateSnapshot);
				result.title = result.title + " (" + choice.name + ")";
				$(result).addClass("choice");
				// Edit
				if (isSelected(dataSnapshot, editorStateSnapshot)) {
					var optionList = document.createElement("select");
					updateOptions(dataSnapshot, choice, optionList);
					result.appendChild(optionList);
					$(optionList).chosen({
						width: "100%",
						search_contains: true
					});
					$(optionList).change(event => {
						var selectedRule = findRuleNamed(choice, optionList.value);
						var newObject = generate(selectedRule);
						setRule(newObject, selectedRule);
						dataSnapshot.reference().set(newObject);
					});
					$(document).keydown(_ => {
						$(optionList).trigger("chosen:activate");
					});
					$(result).dblclick(_ => {
						$(optionList).trigger("chosen:open");
					});
				}
				return result;
			},
			list: list => {
				// Display
				var result = document.createElement("span");
				var dataArray = [];
				for (var key in data) {
					if (!isNaN(parseInt(key))) {
						dataArray.push(data[key]);
					}
				}
				if (dataArray.length > 0) {
					for (var i = 0; i < dataArray.length; i++) {
						var elementSnapshot = dataSnapshot.child(i.toString());
						result.appendChild(getEditor(list.elementRule, elementSnapshot, editorStateSnapshot));
						result.appendChild(document.createTextNode(list.separator));
						if (isSelected(elementSnapshot, editorStateSnapshot)) {
							bindKeyDown(insertAfterKey, _ => {
								var newElement = generate(list.elementRule);
								var index = i + 1;
								var newArray = insertElement(dataArray, newElement, index);
								dataSnapshot.reference().set(newArray);
								setSelectedRef(editorStateSnapshot, dataSnapshot.child(index.toString()).reference());
							});
						}
					}
				} else {
					result.appendChild(document.createTextNode("(no " + owl.pluralize(list.elementRule.name) + ")"));
				}
				applyTooltip(result, list);
				// Navigate
				bindNavigation(dataSnapshot, editorStateSnapshot, Object.keys(dataArray));
				// Edit
				var i = 0;
				while (i < dataArray.length) {
					var elementSnapshot = dataSnapshot.child(i.toString());
					if (isSelected(elementSnapshot, editorStateSnapshot)) {
						break;
					}
					i++;
				}
				if (i < dataArray.length) {
					bindKeyDown(deleteKey, () => {
						var newArray = removeElements(dataArray, i);
						dataSnapshot.reference().set(newArray);
					});
				}
				if ((dataArray.length == 0) && isSelected(dataSnapshot, editorStateSnapshot)) {
					bindKeyDown(selectFirstChildKey, _ => {
						var newElement = generate(list.elementRule);
						var newArray = dataArray.concat([newElement]);
						dataSnapshot.reference().set(newArray);
						setSelectedRef(editorStateSnapshot, dataSnapshot.child("0").reference());
					});
				}
				return result;
			}
		});
	} else {
		result = document.createElement("span");
		result.title = "Error: expected " + getDescription(rule);
		result.appendChild(document.createTextNode(data));
		$(result).addClass("error");
	}
	$(result).addClass("game-editor");
	if (isSelected(dataSnapshot, editorStateSnapshot)) {
		$(result).addClass(selectedClass);
	}
	$(result).click(event => {
		setSelectedRef(editorStateSnapshot, dataSnapshot.reference());
		event.stopPropagation();
	});
	result.tabIndex = 0;
	return result;
}

var selectedClass = "selected";

function updateOptions(dataSnapshot: DataSnapshot, choice: Choice, optionList: HTMLSelectElement) {
	optionList.innerHTML = "";
	getOptions(choice).forEach(option => {
		var optionElement = document.createElement("option");
		optionElement.appendChild(document.createTextNode(option.name));
		if (dataSnapshot.value()[ruleProperty] == option.name) {
			optionElement.selected = true;
		}
		optionList.appendChild(optionElement);
	});
	$(optionList).trigger("chosen:updated");
}

var selectFirstChildKey = "alt+enter";
var selectParentKey = "alt+esc";
var selectRootKey = "shift+alt+esc";
var selectNextElementKeys = ["alt+right", "alt+down"];
var selectPreviousElementKeys = ["alt+left", "alt+up"];
var deleteKey = "del";
var insertAfterKey = "shift+enter";
var editKey = "f2";

function applyTooltip(element: HTMLElement, rule: Rule): void {
	element.title = getDescription(rule);
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

function isSelected(dataSnapshot: DataSnapshot, editorStateSnapshot: DataSnapshot) {
	return isSame(dataSnapshot.reference(), getSelectedRef(editorStateSnapshot));
}

function isSame(ref1: DataReference, ref2: DataReference): boolean {
	return ref1.url() == ref2.url();
}

function getSelectedRef(editorStateSnapshot: DataSnapshot): DataReference {
	return editorStateSnapshot.referenceAt(editorStateSnapshot.child(selectedUrlId).value());
}

var selectedUrlId = "selectedUrl";

function setSelectedRef(editorStateSnapshot: DataSnapshot, ref: DataReference): void {
	editorStateSnapshot.child(selectedUrlId).reference().set(ref.url());
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

function matches(rule: Rule, searchTerm: string): boolean {
	return rule.match({
		keyword: keyword => (searchTerm == "") || contains(keyword.name, searchTerm),
		literal: literal => literal.value(searchTerm) != null,
		record: record =>
			(searchTerm == "") || contains(record.name, searchTerm) || record.segments().some(segment => segment.match({
				textSegment: textSegment => contains(textSegment.text, searchTerm),
				ruleSegment: ruleSegment => false
			})),
		choice: choice => false,
		list: list => (searchTerm == "") || contains(list.elementRule.name, searchTerm)
	});
}

function findRuleNamed(choice: Choice, name: string): Rule {
	return choice.options().filter(option => option.name == name)[0];
}

function bindNavigation(dataSnapshot: DataSnapshot, editorStateSnapshot: DataSnapshot, keys: string[]): void {
	// First child
	if (isSelected(dataSnapshot, editorStateSnapshot)) {
		bindKeyDown(selectFirstChildKey, () => {
			setSelectedRef(editorStateSnapshot, dataSnapshot.child(keys[0]).reference());
		});
	}
	// Next element
	bindSiblingNavigation(dataSnapshot, editorStateSnapshot, keys, 1, selectNextElementKeys);
	// Previous element
	bindSiblingNavigation(dataSnapshot, editorStateSnapshot, keys, -1, selectPreviousElementKeys);
}

function bindSiblingNavigation(dataSnapshot: DataSnapshot, editorStateSnapshot: DataSnapshot, keys: string[], delta: number, keyCombos: string[]): void {
	for (var i = 0; i < keys.length; i++) {
		var siblingRef: DataReference = null;
		var selectedKey = keys[i];
		if (isSelected(dataSnapshot.child(selectedKey), editorStateSnapshot)) {
			siblingRef = dataSnapshot.child(keys[modulo(i + delta, keys.length)]).reference();
			break;
		}
	}
	if (siblingRef != null) {
		keyCombos.forEach(keyCombo => bindKeyDown(keyCombo, event => {
			setSelectedRef(editorStateSnapshot, siblingRef);
		}));
	}
}

function bindKeyDown(keyCombo: string, onDownCallback: (event: Event) => void): void {
	KeyboardJS.clear(keyCombo);
	KeyboardJS.on(keyCombo, onDownCallback);
}

function selectParent(editorStateSnapshot: DataSnapshot, dataRootRef: DataReference): void {
	var selectedRef = getSelectedRef(editorStateSnapshot);
	if (!isSame(selectedRef, dataRootRef)) {
		setSelectedRef(editorStateSnapshot, selectedRef.parent());
	}
}