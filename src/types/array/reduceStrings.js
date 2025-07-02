"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reduceStrings = reduceStrings;
function reduceStrings({ strings, separator = " " }) {
    return strings.join(separator);
}
