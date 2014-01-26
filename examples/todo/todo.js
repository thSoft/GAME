var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var TodoListRule = (function (_super) {
    __extends(TodoListRule, _super);
    function TodoListRule() {
        _super.call(this, "TODO list", new AgendaItemRule(), "\n");
    }
    return TodoListRule;
})(List);

var AgendaItemRule = (function (_super) {
    __extends(AgendaItemRule, _super);
    function AgendaItemRule() {
        _super.call(this, "Agenda Item", function () {
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
        _super.call(this, "Task", function () {
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
        _super.call(this, "Event", function () {
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
        _super.call(this, "Boolean", function () {
            return [
                new Keyword("false"),
                new Keyword("true")
            ];
        });
    }
    return BooleanRule;
})(Choice);

var rootRef = new FirebaseReference(new Firebase("https://thsoft.firebaseio-demo.com/game"));

//var rootRef = new LocalStorageReference(['https://thsoft.firebaseio-demo.com/game']);
$(document).ready(function (_) {
    bindEditor("editor", new TodoListRule(), rootRef, "thSoft");
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
    rootRef.child(dataId).set({});
}
