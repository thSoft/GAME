var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var StringRule = (function (_super) {
    __extends(StringRule, _super);
    function StringRule() {
        _super.call(this, "String", function (data) {
            return data == null ? "" : data.toString();
        }, function (value) {
            return value;
        }, function (value) {
            return document.createTextNode(value);
        }, "");
    }
    return StringRule;
})(Literal);

var IntegerRule = (function (_super) {
    __extends(IntegerRule, _super);
    function IntegerRule() {
        _super.call(this, "Integer", function (data) {
            var result = parseInt(data);
            return isNaN(result) ? null : result;
        }, function (value) {
            return value.toString();
        }, function (value) {
            return document.createTextNode(value.toString());
        }, 0);
    }
    return IntegerRule;
})(Literal);
