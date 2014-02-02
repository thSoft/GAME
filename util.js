function modulo(a, n) {
    return ((a % n) + n) % n;
}

function removeElements(array, from, count) {
    if (typeof count === "undefined") { count = 1; }
    return array.slice(0, from).concat(array.slice(from + count));
}

function insertElement(array, element, before) {
    return array.slice(0, before).concat([element]).concat(array.slice(before));
}

function containsElement(array, element) {
    return array.indexOf(element) != -1;
}

function contains(s, substring) {
    return s.indexOf(substring) != -1;
}

function mergeProperties(o1, o2) {
    var result = {};
    copyProperties(o1, result);
    copyProperties(o2, result);
    return result;
}

function copyProperties(source, target) {
    if (source != null) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
    }
}

function toObject(array) {
    var result = {};
    copyProperties(array, result);
    return result;
}
