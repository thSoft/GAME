class TodoListRule extends List {
	constructor() {
		super(
			"http://example.com/TodoList",
			"TODO list",
			new AgendaItemRule(),
			"\n");
	}
}

class AgendaItemRule extends Choice {
	constructor() {
		super(
			"http://example.com/AgendaItem", 
			"Agenda Item",
			() => [
				new TaskRule(),
				new EventRule()
			]
		);
	}
}

class TaskRule extends Record {
	constructor() {
		super(
			"http://example.com/Task", 
			"Task",
			() => [
				new TextSegment("Task: "),
				new RuleSegment(new StringRule(), "description"),
				new TextSegment("; done? "),
				new RuleSegment(new BooleanRule(), "done"),
			]
		);
	}
}

class EventRule extends Record {
	constructor() {
		super(
			"http://example.com/Event",
			"Event",
			() => [
				new TextSegment("Event: "),
				new RuleSegment(new StringRule(), "description")
			]
		);
	}
}

class BooleanRule extends Choice {
	constructor() {
		super(
			"http://example.com/Boolean",
			"Boolean",
			() => [
				new Keyword("http://example.com/Boolean/false", "false"),
				new Keyword("http://example.com/Boolean/true", "true")
			]
		);
	}
}

var key = "TodoList";
//var rootRef = new FirebaseReference(new Firebase("https://thsoft.firebaseio-demo.com/game/" + key));
var rootRef = new LocalStorageReference(key);

$(document).ready(_ => {
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
