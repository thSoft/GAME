var Keyword = (function () {
    function Keyword(url, name) {
        this.url = url;
        this.name = name;
    }
    Keyword.prototype.match = function (cases) {
        return cases.keyword(this);
    };
    return Keyword;
})();

// In-place string editing
// + custom editing mechanism
var Literal = (function () {
    function Literal(url, name, fromString, toString, view, defaultValue) {
        this.url = url;
        this.name = name;
        this.fromString = fromString;
        this.toString = toString;
        this.view = view;
        this.defaultValue = defaultValue;
    }
    Literal.prototype.match = function (cases) {
        return cases.literal(this);
    };
    return Literal;
})();

// Enter: first child block
// Escape: parent block
// Tab/Shift+Tab: next/previous element
// Insert/Shift+Insert: insert after/before element
// Backspace/Delete: delete element
var List = (function () {
    function List(url, name, elementRule, separator) {
        this.url = url;
        this.name = name;
        this.elementRule = elementRule;
        this.separator = separator;
    }
    List.prototype.match = function (cases) {
        return cases.list(this);
    };
    return List;
})();

// Incremental search in options
var Choice = (function () {
    function Choice(url, name, options) {
        this.url = url;
        this.name = name;
        this.options = options;
    }
    Choice.prototype.match = function (cases) {
        return cases.choice(this);
    };
    return Choice;
})();

// Tab/Shift+Tab: next/previous RuleSegment segment
var Record = (function () {
    function Record(url, name, segments) {
        this.url = url;
        this.name = name;
        this.segments = segments;
    }
    Record.prototype.match = function (cases) {
        return cases.record(this);
    };
    return Record;
})();

var TextSegment = (function () {
    function TextSegment(text) {
        this.text = text;
    }
    TextSegment.prototype.match = function (cases) {
        return cases.textSegment(this);
    };
    return TextSegment;
})();

var RuleSegment = (function () {
    function RuleSegment(rule, fieldName) {
        this.rule = rule;
        this.fieldName = fieldName;
    }
    RuleSegment.prototype.match = function (cases) {
        return cases.ruleSegment(this);
    };
    return RuleSegment;
})();

function check(rule, data) {
    return rule.match({
        keyword: function (keyword) {
            return ruleIs(data, rule);
        },
        literal: function (literal) {
            return ruleIs(data, rule);
        },
        record: function (record) {
            return ruleIs(data, rule);
        },
        list: function (list) {
            return ruleIs(data, rule);
        },
        choice: function (choice) {
            return choice.options().some(function (option) {
                return (data.ruleUrl == option.name) && check(option, data);
            });
        }
    });
}

function ruleIs(data, rule) {
    return (data == null) || (data.ruleUrl == null) || (data.ruleUrl == rule.url);
}

function setRule(data, rule) {
    data.ruleUrl = rule.url;
}

function generate(rule) {
    return rule.match({
        keyword: function (keyword) {
            return ({});
        },
        literal: function (literal) {
            var result = {
                value: literal.defaultValue
            };
            return result;
        },
        list: function (list) {
            return [];
        },
        choice: function (choice) {
            var defaultRule = choice.options()[0];
            var result = generate(defaultRule);
            setRule(result, defaultRule);
            return result;
        },
        record: function (record) {
            var result = {};
            record.segments().forEach(function (segment) {
                return segment.match({
                    textSegment: function (textSegment) {
                    },
                    ruleSegment: function (ruleSegment) {
                        result[ruleSegment.fieldName] = generate(ruleSegment.rule);
                    }
                });
            });
            return result;
        }
    });
}
