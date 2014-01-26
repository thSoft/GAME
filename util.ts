function modulo(a: number, n: number): number {
	return ((a % n) + n) % n;
}

function removeElements<T>(array: T[], from: number, count: number = 1): T[] {
	return array.slice(0, from).concat(array.slice(from + count));
}

function insertElement<T>(array: T[], element: T, before: number): T[] {
	return array.slice(0, before).concat([element]).concat(array.slice(before));
}

function containsElement<T>(array: T[], element: T): boolean {
	return array.indexOf(element) != -1;
}

function contains(s: string, substring: string): boolean {
	return s.indexOf(substring) != -1;
}
