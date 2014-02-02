function getEditor(dataRef, rule) {
    return rule.match({
        keyword: function (keyword) {
            return getKeywordEditor(dataRef, keyword);
        },
        literal: function (literal) {
            return getLiteralEditor(dataRef, literal);
        },
        choice: function (choice) {
            return getChoiceEditor(dataRef, choice);
        },
        record: function (record) {
            return getRecordEditor(dataRef, record);
        },
        list: function (list) {
            return getListEditor(dataRef, list);
        }
    });
}

function getKeywordEditor(dataRef, keyword) {
    return React.createClass({
        render: function () {
            return createEditor(keyword, {
                children: keyword.name
            });
        }
    })();
}

function getLiteralEditor(dataRef, literal) {
    return React.createClass({
        getInitialState: function () {
            return {
                value: literal.defaultValue
            };
        },
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
            var data = this.state;
            return createEditor(literal, {
                contentEditable: "true",
                onKeyPress: function (event) {
                    if (event.key == "Enter") {
                        event.preventDefault();
                        changeLiteral(dataRef, literal, event.target);
                    }
                },
                onBlur: function (event) {
                    changeLiteral(dataRef, literal, event.target);
                },
                children: literal.toString(data.value)
            });
        }
    })();
}

function getChoiceEditor(dataRef, choice) {
    return React.createClass({
        mixins: [getFirebaseMixin(dataRef)],
        render: function () {
            var data = this.state;
            if (data == null) {
                return React.DOM.span("?");
            } else {
                var chosenRule = findRule(choice, data.ruleUrl);
                return getEditor(dataRef, chosenRule);
            }
        }
    })();
}

function getRecordEditor(dataRef, record) {
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
            return createEditor(record, {
                children: children
            });
        }
    })();
}

function getListEditor(dataRef, list) {
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
            return createEditor(list, {
                children: children
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

function createEditor(rule, attributes) {
    var hoverClass = "hover";
    var allAttributes = {
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
    copyProperties(attributes, allAttributes);
    return React.DOM.span(allAttributes);
}

function textNode(text) {
    return React.DOM.span({
        style: {
            pointerEvents: "none"
        }
    }, text);
}

function changeLiteral(dataRef, literal, editor) {
    dataRef.set({ value: literal.fromString(editor.textContent) });
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

function findRule(choice, url) {
    return choice.options().filter(function (option) {
        return option.url == url;
    })[0];
}
