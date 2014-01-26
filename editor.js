function bindEditor(elementId, rule, rootRef, userId) {
    rootRef.changed(function (snapshot) {
        [selectFirstChildKey, deleteKey, insertAfterKey].concat(selectNextElementKeys).concat(selectPreviousElementKeys).forEach(function (keyCombo) {
            KeyboardJS.clear(keyCombo);
        });

        var dataSnapshot = snapshot.child(dataId);
        var editorStateSnapshot = snapshot.child(editorStateId).child(userId);
        var editor = getEditor(rule, dataSnapshot, editorStateSnapshot);
        editor.setAttribute("id", elementId);
        document.body.replaceChild(editor, document.getElementById(elementId));

        $("[contenteditable='true']." + selectedClass).focus();

        var dataRootRef = dataSnapshot.reference();
        bindKeyDown(selectParentKey, function () {
            selectParent(editorStateSnapshot, dataRootRef);
        });
        bindKeyDown(selectRootKey, function () {
            setSelectedRef(editorStateSnapshot, dataRootRef);
        });
    });
}

var dataId = "data";
var editorStateId = "editorState";

var enterKey = 13;

function getEditor(rule, dataSnapshot, editorStateSnapshot) {
    var data = dataSnapshot.value();
    var result;
    if (check(rule, data)) {
        result = rule.match({
            keyword: function (keyword) {
                var result = document.createElement("span");
                var value = keyword.name;
                result.appendChild(document.createTextNode(value));
                applyTooltip(result, keyword);
                return result;
            },
            literal: function (literal) {
                // Display
                var result = document.createElement("span");
                var value = data[valueProperty];
                result.appendChild(literal.view(value));
                $(result).addClass("literal");
                applyTooltip(result, literal);

                // Edit
                result.contentEditable = "true";
                $(result).keyup(function (event) {
                    if (event.keyCode == enterKey) {
                        changeLiteral(dataSnapshot, literal, result);
                    }
                });
                $(result).focus(function (_) {
                    if (!isSelected(dataSnapshot, editorStateSnapshot)) {
                        setSelectedRef(editorStateSnapshot, dataSnapshot.reference());
                    }
                });
                $(result).blur(function (_) {
                    changeLiteral(dataSnapshot, literal, result);
                });
                return result;
            },
            record: function (record) {
                // Display
                var result = document.createElement("span");
                record.segments().forEach(function (segment) {
                    segment.match({
                        textSegment: function (textSegment) {
                            result.appendChild(document.createTextNode(textSegment.text));
                        },
                        ruleSegment: function (ruleSegment) {
                            var fieldSnapshot = dataSnapshot.child(ruleSegment.fieldName);
                            result.appendChild(getEditor(ruleSegment.rule, fieldSnapshot, editorStateSnapshot));
                        }
                    });
                });
                applyTooltip(result, record);

                // Navigate
                var fieldNames = record.segments().filter(function (segment) {
                    return segment instanceof RuleSegment;
                }).map(function (segment) {
                    return segment.fieldName;
                });
                bindNavigation(dataSnapshot, editorStateSnapshot, fieldNames);
                return result;
            },
            choice: function (choice) {
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
                    $(optionList).change(function (event) {
                        var selectedRule = findRuleNamed(choice, optionList.value);
                        var newObject = generate(selectedRule);
                        setRule(newObject, selectedRule);
                        dataSnapshot.reference().set(newObject);
                    });
                    $(document).keydown(function (_) {
                        $(optionList).trigger("chosen:activate");
                    });
                    $(result).dblclick(function (_) {
                        $(optionList).trigger("chosen:open");
                    });
                }
                return result;
            },
            list: function (list) {
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
                            bindKeyDown(insertAfterKey, function (_) {
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
                    bindKeyDown(deleteKey, function () {
                        var newArray = removeElements(dataArray, i);
                        dataSnapshot.reference().set(newArray);
                    });
                }
                if ((dataArray.length == 0) && isSelected(dataSnapshot, editorStateSnapshot)) {
                    bindKeyDown(selectFirstChildKey, function (_) {
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
    $(result).click(function (event) {
        setSelectedRef(editorStateSnapshot, dataSnapshot.reference());
        event.stopPropagation();
    });
    return result;
}

function changeLiteral(dataSnapshot, literal, editor) {
    dataSnapshot.reference().child(valueProperty).set(literal.fromString(editor.textContent));
}

var selectedClass = "selected";

function updateOptions(dataSnapshot, choice, optionList) {
    optionList.innerHTML = "";
    getOptions(choice).forEach(function (option) {
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

function applyTooltip(element, rule) {
    element.title = getDescription(rule);
}

function getDescription(rule) {
    return rule.match({
        keyword: function (keyword) {
            return keyword.name + " keyword";
        },
        literal: function (literal) {
            return literal.name + " literal";
        },
        record: function (record) {
            return record.name;
        },
        choice: function (choice) {
            return choice.name + ": " + choice.options().map(function (option) {
                return option.name;
            }).join(" or ");
        },
        list: function (list) {
            return list.name + ": list of " + owl.pluralize(list.elementRule.name);
        }
    });
}

function isSelected(dataSnapshot, editorStateSnapshot) {
    return isSame(dataSnapshot.reference(), getSelectedRef(editorStateSnapshot));
}

function isSame(ref1, ref2) {
    return ref1.url() == ref2.url();
}

function getSelectedRef(editorStateSnapshot) {
    return editorStateSnapshot.referenceAt(editorStateSnapshot.child(selectedUrlId).value());
}

var selectedUrlId = "selectedUrl";

function setSelectedRef(editorStateSnapshot, ref) {
    editorStateSnapshot.child(selectedUrlId).reference().set(ref.url());
}

function getOptions(rule) {
    return rule.match({
        keyword: function (keyword) {
            return [keyword];
        },
        literal: function (literal) {
            return [literal];
        },
        list: function (list) {
            return [list];
        },
        record: function (record) {
            return [record];
        },
        choice: function (choice) {
            var result = [];
            choice.options().forEach(function (option) {
                result = result.concat(getOptions(option));
            });
            return result;
        }
    });
}

function matches(rule, searchTerm) {
    return rule.match({
        keyword: function (keyword) {
            return (searchTerm == "") || contains(keyword.name, searchTerm);
        },
        literal: function (literal) {
            return literal.value(searchTerm) != null;
        },
        record: function (record) {
            return (searchTerm == "") || contains(record.name, searchTerm) || record.segments().some(function (segment) {
                return segment.match({
                    textSegment: function (textSegment) {
                        return contains(textSegment.text, searchTerm);
                    },
                    ruleSegment: function (ruleSegment) {
                        return false;
                    }
                });
            });
        },
        choice: function (choice) {
            return false;
        },
        list: function (list) {
            return (searchTerm == "") || contains(list.elementRule.name, searchTerm);
        }
    });
}

function findRuleNamed(choice, name) {
    return choice.options().filter(function (option) {
        return option.name == name;
    })[0];
}

function bindNavigation(dataSnapshot, editorStateSnapshot, keys) {
    // First child
    if (isSelected(dataSnapshot, editorStateSnapshot)) {
        bindKeyDown(selectFirstChildKey, function () {
            setSelectedRef(editorStateSnapshot, dataSnapshot.child(keys[0]).reference());
        });
    }

    // Next element
    bindSiblingNavigation(dataSnapshot, editorStateSnapshot, keys, 1, selectNextElementKeys);

    // Previous element
    bindSiblingNavigation(dataSnapshot, editorStateSnapshot, keys, -1, selectPreviousElementKeys);
}

function bindSiblingNavigation(dataSnapshot, editorStateSnapshot, keys, delta, keyCombos) {
    for (var i = 0; i < keys.length; i++) {
        var siblingRef = null;
        var selectedKey = keys[i];
        if (isSelected(dataSnapshot.child(selectedKey), editorStateSnapshot)) {
            siblingRef = dataSnapshot.child(keys[modulo(i + delta, keys.length)]).reference();
            break;
        }
    }
    if (siblingRef != null) {
        keyCombos.forEach(function (keyCombo) {
            return bindKeyDown(keyCombo, function (event) {
                setSelectedRef(editorStateSnapshot, siblingRef);
            });
        });
    }
}

function bindKeyDown(keyCombo, onDownCallback) {
    KeyboardJS.clear(keyCombo);
    KeyboardJS.on(keyCombo, onDownCallback);
}

function selectParent(editorStateSnapshot, dataRootRef) {
    var selectedRef = getSelectedRef(editorStateSnapshot);
    if (!isSame(selectedRef, dataRootRef)) {
        setSelectedRef(editorStateSnapshot, selectedRef.parent());
    }
}
