interface DataReference {
	url(): string;
	find(url: string): DataReference;
	changed(handler: (value: any) => void): Subscription;
	set(value: any, completed?: (error: any) => void): void;
	insert(value: any, completed?: (error: any) => void): DataReference;
	remove(completed?: (error: any) => void): void;
}

interface Subscription {
	unsubscribe(): void;
}

function readOnce(dataRef: DataReference, handler: (value: any) => void): void {
	var subscription: Subscription = null;
	var newHandler = (value: any) => {
		handler(value);
		if (subscription != null) {
			subscription.unsubscribe();
		}
	};
	subscription = dataRef.changed(newHandler);
}