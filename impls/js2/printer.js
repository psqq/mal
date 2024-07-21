import {
    MalHash,
    MalKeyword,
    MalList,
    MalNumber,
    MalString,
    MalSymbol,
    MalType,
    MalVector,
} from './types.js';

/**
 * @param {MalType} v
 */
export function pr_str(v, print_readably = true) {
    if (v instanceof MalVector) {
        let a = [];
        for (const x of v.value) {
            a.push(pr_str(x));
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
            a.push(pr_str(x));
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
    } else {
        return v;
    }
}
