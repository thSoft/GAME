class LocalStorageReference implements DataReference {

	constructor(private key: string) {
	}

	url(): string {
		return this.key;
	}
	
	find(url: string): DataReference {
		return new LocalStorageReference(url);
	}

	changed(handler: (value: any) => void): Subscription {
		var currentValue = this.parse(localStorage[this.key]);
		handler(currentValue);
		var listener = (event: StorageEvent) => {
			if (event.key == this.key) {
				handler(this.parse(event.newValue));
			}
		};
		window.addEventListener("storage", listener);
		return {
			unsubscribe(): void {
				window.removeEventListener("storage", listener);
			}
		};
	}

	private parse(text: string): any {
		return (text == undefined) || (text == null) || (text == "") ? null : JSON.parse(text);
	}

	set(value: any, completed?: (error: any) => void): void {
		localStorage[this.key] = JSON.stringify(value);
		this.callCompleted(completed, null);
	}
	
	private callCompleted(completed: (error: any) => void, error: any): void {
		if (completed != null) {
			completed(error);
		}
	}

	insert(value: any, completed?: (error: any) => void): DataReference {
		if (localStorage.remainingSpace <= 0) {
			this.callCompleted(completed, "No more storage");
			return null;
		}
		do {
			var keyNumber = Math.random() * Number.MAX_VALUE;
			var keyString = keyNumber.toString(26);
		} while (this.isOccupied(keyString));
		var result = new LocalStorageReference(keyString);
		result.set(value, completed);
		return result;
	}
	
	private isOccupied(key: string) {
		for (var i = 0; i < localStorage.length; i++) {
			if (localStorage.key(i) == key) {
				return true;
			}
		}
		return false;
	}

	remove(completed?: (error: any) => void): void {
		localStorage.removeItem(this.key);
		this.callCompleted(completed, null);
	}

}