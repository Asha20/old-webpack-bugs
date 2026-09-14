import * as e from "./react.js";
//#region class-scoping/fixture/index.js
var t = class Fragment {
	static from() {
		return Fragment.empty;
	}
};
t.empty = [], console.log(e.createElement, t.from());
//#endregion
