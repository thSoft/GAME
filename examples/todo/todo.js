var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TodoListRule = (function (_super) {
    __extends(TodoListRule, _super);
    function TodoListRule() {
        _super.call(this, "http://example.com/TodoList", "TODO list", new AgendaItemRule(), "\n");
    }
    return TodoListRule;
})(List);

var AgendaItemRule = (function (_super) {
    __extends(AgendaItemRule, _super);
    function AgendaItemRule() {
        _super.call(this, "http://example.com/AgendaItem", "Agenda Item", function () {
            return [
                new TaskRule(),
                new EventRule()
            ];
        });
    }
    return AgendaItemRule;
})(Choice);

var TaskRule = (function (_super) {
    __extends(TaskRule, _super);
    function TaskRule() {
        _super.call(this, "http://example.com/Task", "Task", function () {
            return [
                new TextSegment("Task: "),
                new RuleSegment(new StringRule(), "description"),
                new TextSegment("; done? "),
                new RuleSegment(new BooleanRule(), "done")
            ];
        });
    }
    return TaskRule;
})(Record);

var EventRule = (function (_super) {
    __extends(EventRule, _super);
    function EventRule() {
        _super.call(this, "http://example.com/Event", "Event", function () {
            return [
                new TextSegment("Event: "),
                new RuleSegment(new StringRule(), "description")
            ];
        });
    }
    return EventRule;
})(Record);

var BooleanRule = (function (_super) {
    __extends(BooleanRule, _super);
    function BooleanRule() {
        _super.call(this, "http://example.com/Boolean", "Boolean", function () {
            return [
                new Keyword("http://example.com/Boolean/false", "false"),
                new Keyword("http://example.com/Boolean/true", "true")
            ];
        });
    }
    return BooleanRule;
})(Choice);

var key = "TodoList";

//var rootRef = new FirebaseReference(new Firebase("https://thsoft.firebaseio-demo.com/game/" + key));
var rootRef = new LocalStorageReference(key);

$(document).ready(function (_) {
    var editor = getEditor(rootRef, new TodoListRule);
    React.renderComponent(editor, document.body);
});

function resetData() {
    var initialData = [
        {
            rule: "Event",
            description: {
                value: "Productivity meeting"
            }
        },
        {
            rule: "Task",
            description: {
                value: "Procrastinate"
            },
            done: {
                rule: "false"
            }
        }
    ];
}
