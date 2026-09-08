import { wrap } from "./external.js";

function initialize(instance, storage, value) {
  storage.set(instance, value);
}

var storage = new WeakMap();
var Handle = class {
  constructor() {
    initialize(this, storage, undefined);
  }
};
const First = wrap(() => new Handle());
const Second = wrap(() => null);

export { First, Second };
