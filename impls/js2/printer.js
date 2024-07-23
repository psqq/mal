import {
    MalAtom,
    MalFalse,
    MalFunction,
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
        const keysInA = new Set();
        let a = [];
        for (let i = v.value.length - 2; i >= 0; i -= 2) {
            if (!keysInA.has(v.value[i].value)) {
                a = [
                    pr_str(v.value[i], print_readably),
                    pr_str(v.value[i + 1], print_readably),
                ].concat(a);
                keysInA.add(v.value[i].value);
            }
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
    } else if (v instanceof MalAtom) {
        return '(atom ' + pr_str(v.value, print_readably) + ')';
    } else if (isFunction(v) || v instanceof MalFunction) {
        return '#<function>';
    } else {
        return '(JS_STRING ' + String(v) + ')';
    }
}
