declare module owl {
	function pluralize(word: string, count?: number, plural?: string): string;
	module pluralize {
		function define(word: string, plural: string): void;
	}
}