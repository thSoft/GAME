var FirebaseReference = (function () {
    function FirebaseReference(firebase) {
        this.firebase = firebase;
    }
    FirebaseReference.prototype.url = function () {
        return this.firebase.toString();
    };

    FirebaseReference.prototype.changed = function (handler) {
        this.firebase.on("value", function (snapshot) {
            handler(new FirebaseSnapshot(snapshot));
        });
    };

    FirebaseReference.prototype.set = function (value, onComplete) {
        this.firebase.set(value, onComplete);
    };

    FirebaseReference.prototype.parent = function () {
        return new FirebaseReference(this.firebase.parent());
    };

    FirebaseReference.prototype.child = function (name) {
        return new FirebaseReference(this.firebase.child(name));
    };
    return FirebaseReference;
})();

var FirebaseSnapshot = (function () {
    function FirebaseSnapshot(snapshot) {
        this.snapshot = snapshot;
    }
    FirebaseSnapshot.prototype.value = function () {
        return this.snapshot.val();
    };

    FirebaseSnapshot.prototype.reference = function () {
        return new FirebaseReference(this.snapshot.ref());
    };

    FirebaseSnapshot.prototype.child = function (name) {
        return new FirebaseSnapshot(this.snapshot.child(name));
    };

    FirebaseSnapshot.prototype.referenceAt = function (url) {
        return new FirebaseReference(new Firebase(url));
    };
    return FirebaseSnapshot;
})();
