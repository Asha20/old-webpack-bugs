import * as e from "./react.js";
//#region class-scoping/fixture/index.js
var t = class e {
	static from() {
		return e.empty;
	}
};
t.empty = [], console.log(e.createElement, t.from());
//#endregion
