class StringRule extends Literal<string> {
	constructor() {
		super(
			"String",
			data => data == null ? "" : data.toString(),
			value => value,
			value => document.createTextNode(value),
			""
		);
	}
}

class IntegerRule extends Literal<number> {
	constructor() {
		super(
			"Integer",
			data => {
				var result = parseInt(data);
				return isNaN(result) ? null : result; 
			},
			value => value.toString(),
			value => document.createTextNode(value.toString()), // TODO slider
			0
		);
	}
}

// TODO boolean, date, color...