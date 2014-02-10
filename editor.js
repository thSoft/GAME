function getEditor(dataRef, rule, updateProps) {
    if (typeof updateProps === "undefined") { updateProps = function (_) {
    }; }
    return rule.match({
        keyword: function (keyword) {
            return getKeywordEditor(dataRef, keyword, updateProps);
        },
        literal: function (literal) {
            return getLiteralEditor(dataRef, literal, updateProps);
        },
        choice: function (choice) {
            return getChoiceEditor(dataRef, choice, updateProps);
        },
        record: function (record) {
            return getRecordEditor(dataRef, record, updateProps);
        },
        list: function (list) {
            return getListEditor(dataRef, list, updateProps);
        }
    });
}

function getKeywordEditor(dataRef, keyword, updateProps) {
    return React.createClass({
        render: function () {
            return createEditor(keyword, function (props) {
                props.children = [keyword.name];
                updateProps(props);
            });
        }
    })();
}

function getLiteralEditor(dataRef, literal, updateProps) {
    return React.createClass({
        getInitialState: function () {
            return {
                value: literal.defaultValue
            };
        },
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
            var data = this.state;
            return createEditor(literal, function (props) {
                props.onKeyDown = function (event) {
                    if (event.key == "Enter") {
                        event.preventDefault();
                        changeLiteral(dataRef, literal, event.target);
                    }
                };
                props.onBlur = function (event) {
                    changeLiteral(dataRef, literal, event.target);
                };
                props.children = [literal.toString(data.value)]; // TODO custom editor: depend on React?
                props.contentEditable = "true"; // XXX interferes with superfluous spans
                updateProps(props);
            });
        }
    })();
}

function changeLiteral(dataRef, literal, editor) {
    var valueString = editor.textContent;
    dataRef.set({ value: literal.fromString(valueString) });
    editor.textContent = valueString;
}

function getChoiceEditor(dataRef, choice, updateProps) {
    return React.createClass({
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
            var data = this.state;
            if (data == null) {
                return React.DOM.span("?");
            } else {
                var chosenRule = findRule(choice, data.ruleUrl);
                var select = getChoiceSelector(dataRef, data, choice, chosenRule);
                return getEditor(dataRef, chosenRule, function (props) {
                    props.title = props.title + " (" + choice.name + ")";
                    props.children.push(select);
                    updateProps(props);
                });
            }
        }
    })();
}

function getChoiceSelector(dataRef, data, choice, chosenRule) {
    var options = getOptions(choice).map(function (option) {
        var optionText = option.name;
        return React.DOM.option({
            key: option.url,
            value: option.url
        }, optionText);
    });
    return Chosen({
        width: "100%",
        searchContains: true,
        onChange: function (event) {
            var newlyChosenRule = findRule(choice, event.target.value);
            var newData = generate(newlyChosenRule);
            setRule(newData, newlyChosenRule);
            removeData(dataRef, data, chosenRule);
            store(dataRef, newData, newlyChosenRule);
        },
        children: options,
        defaultValue: chosenRule.url
    });
}

function findRule(choice, url) {
    return choice.options().filter(function (option) {
        return option.url == url;
    })[0];
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

function getRecordEditor(dataRef, record, updateProps) {
    return React.createClass({
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
            var data = this.state;
            var children = record.segments().map(function (segment) {
                return segment.match({
                    textSegment: function (textSegment) {
                        return textNode(textSegment.text);
                    },
                    ruleSegment: function (ruleSegment) {
                        var fieldRef = dataRef.find(data[ruleSegment.fieldName]);
                        var fieldRule = ruleSegment.rule;
                        return getEditor(fieldRef, fieldRule);
                    }
                });
            });
            return createEditor(record, function (props) {
                props.children = children;
                updateProps(props);
            });
        }
    })();
}

function getListEditor(dataRef, list, updateProps) {
    return React.createClass({
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
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
            return createEditor(list, function (props) {
                props.children = children;
                updateProps(props);
            });
        }
    })();
}

function getFirebaseMixin(dataRef) {
    var subscription;
    return {
        componentWillMount: function () {
            var _this = this;
            subscription = dataRef.changed(function (data) {
                _this.setState(toObject(data)); // XXX React only accepts Object
            });
        },
        componentWillUnmount: function () {
            subscription.unsubscribe();
        }
    };
}
;

function createEditor(rule, updateProps) {
    if (typeof updateProps === "undefined") { updateProps = function (_) {
    }; }
    var hoverClass = "hover";
    var props = {
        className: "game-editor",
        title: getDescription(rule),
        tabIndex: 0,
        onMouseOver: function (event) {
            $(event.target).addClass(hoverClass);
        },
        onMouseOut: function (event) {
            $(event.target).removeClass(hoverClass);
        }
    };
    updateProps(props);
    return React.DOM.span(props);
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

function textNode(text) {
    return React.DOM.span({
        style: {
            pointerEvents: "none"
        }
    }, text);
}

function store(dataRef, data, rule) {
    rule.match({
        keyword: function (keyword) {
            dataRef.set(data);
        },
        literal: function (literal) {
            dataRef.set(data);
        },
        choice: function (choice) {
            dataRef.set(data);
        },
        record: function (record) {
            var result = {
                ruleUrl: data.ruleUrl
            };
            record.segments().forEach(function (segment) {
                return segment.match({
                    textSegment: function (textSegment) {
                    },
                    ruleSegment: function (ruleSegment) {
                        result[ruleSegment.fieldName] = insertChild(dataRef, data[ruleSegment.fieldName], ruleSegment.rule);
                    }
                });
            });
            dataRef.set(result);
        },
        list: function (list) {
            var array = data;
            var result = {
                ruleUrl: data.ruleUrl
            };
            array.forEach(function (element) {
                result[array.indexOf(element)] = insertChild(dataRef, element, list.elementRule);
            });
            dataRef.set(result);
        }
    });
}

function insertChild(dataRef, data, rule) {
    var newDataRef = dataRef.insert({});
    store(newDataRef, data, rule);
    return newDataRef.url();
}

function removeData(dataRef, data, rule) {
    rule.match({
        keyword: function (keyword) {
            dataRef.remove();
        },
        literal: function (literal) {
            dataRef.remove();
        },
        choice: function (choice) {
            dataRef.remove();
        },
        record: function (record) {
            record.segments().forEach(function (segment) {
                return segment.match({
                    textSegment: function (textSegment) {
                    },
                    ruleSegment: function (ruleSegment) {
                        var fieldRef = dataRef.find(data[ruleSegment.fieldName]);
                        readOnce(fieldRef, function (fieldValue) {
                            removeData(fieldRef, fieldValue, ruleSegment.rule);
                        });
                    }
                });
            });
            dataRef.remove();
        },
        list: function (list) {
            var array = data;
            array.forEach(function (element) {
                var elementRef = dataRef.find(element);
                readOnce(elementRef, function (elementValue) {
                    removeData(elementRef, elementValue, list.elementRule);
                });
            });
            dataRef.remove();
        }
    });
}
