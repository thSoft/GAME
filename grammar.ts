interface Rule {
	match<T>(cases: RuleCases<T>): T;
	url: string;
	name: string;
}

interface RuleCases<T> {
	keyword(keyword: Keyword): T;
	literal<L>(literal: Literal<L>): T;
	list(list: List): T;
	choice(choice: Choice): T;
	record(record: Record): T;
}

class Keyword implements Rule {

	constructor(
		public url: string,
		public name: string) {
	}

	match<T>(cases: RuleCases<T>): T {
		return cases.keyword(this);
	}

}

// Input field
// + custom editing mechanism
class Literal<V> implements Rule {

	constructor(
		public url: string,
		public name: string,
		public fromString: (data: string) => V,
		public toString: (value: V) => string,
		public view: (value: V) => Node,
		public defaultValue: V) {
	}

	match<T>(cases: RuleCases<T>): T {
		return cases.literal(this);
	}

}

interface LiteralData<V> {
	value: V;
}

var valueProperty = "value";

// Enter: first child block
// Escape: parent block

// Tab/Shift+Tab: next/previous element
// Insert/Shift+Insert: insert after/before element
// Backspace/Delete: delete element
class List implements Rule {

	constructor(
		public url: string,
		public name: string,
		public elementRule: Rule,
		public separator: string) {
	}

	match<T>(cases: RuleCases<T>): T {
		return cases.list(this);
	}

}

// Incremental search in options
class Choice implements Rule {

	constructor(
		public url: string,
		public name: string,
		public options: () => Rule[]) {
	}

	match<T>(cases: RuleCases<T>): T {
		return cases.choice(this);
	}

}

interface ChoiceData {
	ruleUrl: string
}

var ruleProperty = "rule";

// Tab/Shift+Tab: next/previous RuleSegment segment
class Record implements Rule {

	constructor(
		public url: string,
		public name: string,
		public segments: () => RecordSegment[]) {
	}

	match<T>(cases: RuleCases<T>): T {
		return cases.record(this);
	}

}

interface RecordSegment {
	match<T>(cases: RecordSegmentCases<T>): T;
}

interface RecordSegmentCases<T> {
	textSegment(textSegment: TextSegment): T;
	ruleSegment(ruleSegment: RuleSegment): T;
}

class TextSegment implements RecordSegment {

	constructor(public text: string) {
	}

	match<T>(cases: RecordSegmentCases<T>): T {
		return cases.textSegment(this);
	}

}

class RuleSegment implements RecordSegment {

	constructor(
		public rule: Rule,
		public fieldName: string) {
	}

	match<T>(cases: RecordSegmentCases<T>): T {
		return cases.ruleSegment(this);
	}

}

function check(rule: Rule, data: Object): boolean {
	return rule.match({
		keyword: keyword => ruleIs(data, rule),
		literal: literal => ruleIs(data, rule),
		record: record => ruleIs(data, rule),
		list: list => ruleIs(data, rule),
		choice: choice => choice.options().some(option => (data[ruleProperty] == option.name) && check(option, data))
	});
}

function ruleIs(data: Object, rule: Rule): boolean {
	return (data == null) || (data[ruleProperty] == null) || (data[ruleProperty] == rule.name);
}

function setRule(data: Object, rule: Rule): void {
	data[ruleProperty] = rule.name;
}

function generate(rule: Rule): Object {
	return rule.match({
		keyword: keyword => ({}),
		literal: literal => {
			var result = {};
			result[valueProperty] = literal.defaultValue;
			return result;
		},
		list: list => [],
		choice: choice => {
			var defaultRule = choice.options()[0];
			var result = generate(defaultRule);
			setRule(result, defaultRule);
			return result;
		},
		record: record => {
			var result = {};
			record.segments().forEach(segment => segment.match({
				textSegment: textSegment => {},
				ruleSegment: ruleSegment => {
					result[ruleSegment.fieldName] = generate(ruleSegment.rule);
				}
			}));
			return result;
		}
	});
}