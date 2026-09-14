import * as React from "./react.js";

class Fragment {
  static from() {
    return Fragment.empty;
  }
}

Fragment.empty = [];

console.log(React.createElement, Fragment.from());
