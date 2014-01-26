interface DataReference {
	url(): string;
	changed(handler: (snapshot: DataSnapshot) => void): void;
	set(value: any, onComplete?: (error: any) => void): void;
	parent(): DataReference;
	root(): DataReference;
	child(name: string): DataReference;
}

interface DataSnapshot {
	value(): any;
	reference(): DataReference;
	child(name: string): DataSnapshot;
	referenceAt(url: string);
}