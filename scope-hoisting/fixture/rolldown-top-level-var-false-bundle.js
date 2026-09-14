import { wrap } from "./external.js";
function initialize(instance, storage2, value) {
	storage2.set(instance, value);
}
var storage = /* @__PURE__ */ new WeakMap(), Handle = class {
	constructor() {
		initialize(this, storage, void 0);
	}
};
const First = wrap(() => new Handle()), Second = wrap(() => null);
export { First, Second };
