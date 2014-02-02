var FirebaseReference = (function () {
    function FirebaseReference(firebase) {
        this.firebase = firebase;
    }
    FirebaseReference.prototype.url = function () {
        return this.firebase.toString();
    };

    FirebaseReference.prototype.find = function (url) {
        return new FirebaseReference(new Firebase(url));
    };

    FirebaseReference.prototype.changed = function (handler) {
        var callback = function (snapshot) {
            handler(snapshot.val());
        };
        this.firebase.on("value", callback);
        return {
            unsubscribe: function () {
                this.firebase.off("value", callback);
            }
        };
    };

    FirebaseReference.prototype.set = function (value, completed) {
        this.firebase.set(value, completed);
    };

    FirebaseReference.prototype.insert = function (value, completed) {
        return new FirebaseReference(this.firebase.parent().push(value, completed));
    };

    FirebaseReference.prototype.remove = function (completed) {
        this.firebase.remove(completed);
    };
    return FirebaseReference;
})();
