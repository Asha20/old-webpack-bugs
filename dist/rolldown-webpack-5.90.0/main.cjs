/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
var __webpack_exports__ = {};

// UNUSED EXPORTS: First, Second

;// CONCATENATED MODULE: ./fixture/external.js
const wrap = (value) => value;

;// CONCATENATED MODULE: ./fixture/rolldown-bundle.js

function initialize(instance, storage2, value) {
	storage2.set(instance, value);
}
var storage = /* @__PURE__ */ new WeakMap(), Handle = class {
	constructor() {
		initialize(this, storage, void 0);
	}
}, First = wrap(() => new Handle()), Second = wrap(() => null);


/******/ })()
;