class TodoListRule extends List {
	constructor() {
		super("TODO list", new AgendaItemRule(), "\n");
	}
}

class AgendaItemRule extends Choice {
	constructor() {
		super(
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
			"Boolean",
			() => [
				new Keyword("false"),
				new Keyword("true")
			]
		);
	}
}

var rootRef = new FirebaseReference(new Firebase('https://thsoft.firebaseio-demo.com/game'));
//var rootRef = new LocalStorageReference(['https://thsoft.firebaseio-demo.com/game']);

$(document).ready(_ => {
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
