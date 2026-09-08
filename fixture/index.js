import { wrap } from "./external.js";

class Handle {
  #value;
}

export const First = wrap(() => new Handle()),
  Second = wrap(() => null);
