class FirebaseReference implements DataReference {

	constructor(private firebase: Firebase) {
	}

	url(): string {
		return this.firebase.toString();
	}
	
	find(url: string): DataReference {
		return new FirebaseReference(new Firebase(url));
	}
	
	changed(handler: (value: any) => void): Subscription {
		var callback = (snapshot: IFirebaseDataSnapshot) => {
			handler(snapshot.val());
		};
		var firebase = this.firebase;
		firebase.on("value", callback);
		return {
			unsubscribe(): void {
				firebase.off("value", callback);
			}
		};
	}

	set(value: any, completed?: (error: any) => void): void {
		this.firebase.set(value, completed);
	}
	
	insert(value: any, completed?: (error: any) => void): DataReference {
		return new FirebaseReference(this.firebase.parent().push(value, completed));
	}

	remove(completed?: (error: any) => void): void {
		this.firebase.remove(completed);
	}

}