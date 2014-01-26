class LocalStorageReference implements DataReference {

	constructor(private path: string[]) {
	}

	url() {
		return this.path.join("/");
	}

	changed(handler) {
		window.addEventListener("storage", event => {
			handler(new LocalStorageSnapshot(this.path));
		});
		handler(new LocalStorageSnapshot(this.path));
	}

	set(value, onComplete?) {
		// Delete old children
		for (var i = 0; i < localStorage.length; i++) {
			var url = localStorage.key(i);
			if (url.indexOf(this.url()) == 0) {
				localStorage.removeItem(url);
			}
		}
		// Store new children
		if (value instanceof Object) {
			Object.keys(value).forEach(propertyName => {
				new LocalStorageReference(this.path.concat([propertyName])).set(value[propertyName]);
			});
		}
		// Store value
		localStorage[this.url()] = value;
	}

	parent() {
		return this.path.length > 1 ? new LocalStorageReference(this.path.slice(0, this.path.length - 1)) : null;
	}

	child(name) {
		return new LocalStorageReference(this.path.concat([name]));
	}

}

class LocalStorageSnapshot implements DataSnapshot {

	constructor(private path: string[]) {
	}

	value() {
		return localStorage[this.reference().url()];
	}

	reference() {
		return new LocalStorageReference(this.path);
	}

	child(name) {
		return new LocalStorageSnapshot(this.path.concat([name]));
	}
	
	referenceAt(url) {
		return new LocalStorageSnapshot(url.split("/"));
	}

}