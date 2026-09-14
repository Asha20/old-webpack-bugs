/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

// UNUSED EXPORTS: First, Second

;// CONCATENATED MODULE: ./scope-hoisting/fixture/external.js
const wrap = (value) => value;

;// CONCATENATED MODULE: ./scope-hoisting/fixture/rolldown-top-level-var-false-bundle.js

function initialize(instance, storage2, value) {
	storage2.set(instance, value);
}
var storage = /* @__PURE__ */ new WeakMap(), Handle = class {
	constructor() {
		initialize(this, storage, void 0);
	}
};
const First = wrap(() => new Handle()), Second = wrap(() => null);


/******/ })()
;