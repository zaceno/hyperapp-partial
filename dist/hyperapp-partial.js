(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.partial = factory());
}(this, (function () { 'use strict';

var index = app => opts => {
    return app(opts)
};

return index;

})));
//# sourceMappingURL=hyperapp-partial.js.map
