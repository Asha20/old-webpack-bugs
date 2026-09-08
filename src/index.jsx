import { forwardRef } from "react";
import * as ReactDOM from "react-dom";

class Handle {
  #value;
  constructor() {
    this.#value = 1;
  }
}

export const First = forwardRef(function First() {
    return new Handle();
  }),
  Second = forwardRef(function Second() {
    return ReactDOM.flushSync;
  });
