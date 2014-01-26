var LocalStorageReference = (function () {
    function LocalStorageReference(path) {
        this.path = path;
    }
    LocalStorageReference.prototype.url = function () {
        return this.path.join("/");
    };

    LocalStorageReference.prototype.changed = function (handler) {
        var _this = this;
        window.addEventListener("storage", function (event) {
            handler(new LocalStorageSnapshot(_this.path));
        });
        handler(new LocalStorageSnapshot(this.path));
    };

    LocalStorageReference.prototype.set = function (value, onComplete) {
        var _this = this;
        for (var i = 0; i < localStorage.length; i++) {
            var url = localStorage.key(i);
            if (url.indexOf(this.url()) == 0) {
                localStorage.removeItem(url);
            }
        }

        // Store new children
        if (value instanceof Object) {
            Object.keys(value).forEach(function (propertyName) {
                new LocalStorageReference(_this.path.concat([propertyName])).set(value[propertyName]);
            });
        }

        // Store value
        localStorage[this.url()] = value;
    };

    LocalStorageReference.prototype.parent = function () {
        return this.path.length > 1 ? new LocalStorageReference(this.path.slice(0, this.path.length - 1)) : null;
    };

    LocalStorageReference.prototype.child = function (name) {
        return new LocalStorageReference(this.path.concat([name]));
    };
    return LocalStorageReference;
})();

var LocalStorageSnapshot = (function () {
    function LocalStorageSnapshot(path) {
        this.path = path;
    }
    LocalStorageSnapshot.prototype.value = function () {
        return localStorage[this.reference().url()];
    };

    LocalStorageSnapshot.prototype.reference = function () {
        return new LocalStorageReference(this.path);
    };

    LocalStorageSnapshot.prototype.child = function (name) {
        return new LocalStorageSnapshot(this.path.concat([name]));
    };

    LocalStorageSnapshot.prototype.referenceAt = function (url) {
        return new LocalStorageSnapshot(url.split("/"));
    };
    return LocalStorageSnapshot;
})();
