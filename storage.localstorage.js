var LocalStorageReference = (function () {
    function LocalStorageReference(key) {
        this.key = key;
    }
    LocalStorageReference.prototype.url = function () {
        return this.key;
    };

    LocalStorageReference.prototype.find = function (url) {
        return new LocalStorageReference(url);
    };

    LocalStorageReference.prototype.changed = function (handler) {
        var _this = this;
        var currentValue = this.parse(localStorage[this.key]);
        handler(currentValue);
        var listener = function (event) {
            if (event.key == _this.key) {
                handler(_this.parse(event.newValue));
            }
        };
        window.addEventListener("storage", listener);
        return {
            unsubscribe: function () {
                window.removeEventListener("storage", listener);
            }
        };
    };

    LocalStorageReference.prototype.parse = function (text) {
        return (text == undefined) || (text == null) || (text == "") ? null : JSON.parse(text);
    };

    LocalStorageReference.prototype.set = function (value, completed) {
        localStorage[this.key] = JSON.stringify(value);
        this.callCompleted(completed, null);
    };

    LocalStorageReference.prototype.callCompleted = function (completed, error) {
        if (completed != null) {
            completed(error);
        }
    };

    LocalStorageReference.prototype.insert = function (value, completed) {
        if (localStorage.remainingSpace <= 0) {
            this.callCompleted(completed, "No more storage");
            return null;
        }
        do {
            var keyNumber = Math.random() * Number.MAX_VALUE;
            var keyString = keyNumber.toString(26);
        } while(this.isOccupied(keyString));
        var result = new LocalStorageReference(keyString);
        result.set(value, completed);
        return result;
    };

    LocalStorageReference.prototype.isOccupied = function (key) {
        for (var i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i) == key) {
                return true;
            }
        }
        return false;
    };

    LocalStorageReference.prototype.remove = function (completed) {
        localStorage.removeItem(this.key);
        this.callCompleted(completed, null);
    };
    return LocalStorageReference;
})();
