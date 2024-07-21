import {
    MalFalse,
    MalHash,
    MalKeyword,
    MalList,
    MalNil,
    MalNumber,
    MalString,
    MalSymbol,
    MalTrue,
    MalType,
    MalVector,
} from './types.js';
import { isFunction } from './utils.js';

/**
 * @param {MalType | Function} v
 */
export function pr_str(v, print_readably = true) {
    if (v instanceof MalTrue) {
        return 'true';
    } else if (v instanceof MalFalse) {
        return 'false';
    } else if (v instanceof MalNil) {
        return 'nil';
    } else if (v instanceof MalVector) {
        let a = [];
        for (const x of v.value) {
            a.push(pr_str(x, print_readably));
        }
        return '[' + a.join(' ') + ']';
    } else if (v instanceof MalHash) {
        let a = [];
        for (const x of v.value) {
            a.push(pr_str(x));
        }
        return '{' + a.join(' ') + '}';
    } else if (v instanceof MalList) {
        let a = [];
        for (const x of v.value) {
            a.push(pr_str(x, print_readably));
        }
        return '(' + a.join(' ') + ')';
    } else if (v instanceof MalNumber) {
        return '' + v.value;
    } else if (v instanceof MalString) {
        if (print_readably) {
            return v.token;
        } else {
            return v.value;
        }
    } else if (v instanceof MalKeyword) {
        return v.value;
    } else if (v instanceof MalSymbol) {
        return v.value;
    } else if (isFunction(v)) {
        return '#<function>';
    } else {
        return String(v);
    }
}
