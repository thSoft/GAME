function readOnce(dataRef, handler) {
    var subscription = null;
    var newHandler = function (value) {
        handler(value);
        if (subscription != null) {
            subscription.unsubscribe();
        }
    };
    subscription = dataRef.changed(newHandler);
}
