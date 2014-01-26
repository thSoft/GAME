class FirebaseReference implements DataReference {

	constructor(private firebase: Firebase) {
	}

	url() {
		return this.firebase.toString();
	}

	changed(handler) {
		this.firebase.on("value", snapshot => {
			handler(new FirebaseSnapshot(snapshot));
		});
	}

	set(value, onComplete?) {
		this.firebase.set(value, onComplete);
	}

	parent() {
		return new FirebaseReference(this.firebase.parent());
	}

	child(name) {
		return new FirebaseReference(this.firebase.child(name));
	}

}

class FirebaseSnapshot implements DataSnapshot {

	constructor(private snapshot: IFirebaseDataSnapshot) {
	}

	value() {
		return this.snapshot.val();
	}

	reference() {
		return new FirebaseReference(this.snapshot.ref());
	}

	child(name) {
		return new FirebaseSnapshot(this.snapshot.child(name));
	}

	referenceAt(url) {
		return new FirebaseReference(new Firebase(url));
	}

}