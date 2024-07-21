import { NextInput } from './errors.js';
import {
    MalVector,
    MalHash,
    MalList,
    MalNumber,
    MalString,
    MalSymbol,
    MalKeyword,
} from './types.js';

class Reader {
    END_VALUE = undefined;

    constructor() {
        /** @type {string[]} */
        this.tokens = [];
        this.position = 0;
    }

    next() {
        if (this.position >= this.tokens.length) {
            return;
        }
        return this.tokens[this.position++];
    }

    peek() {
        return this.tokens[this.position];
    }
}

/**
 * @param {string} s
 * @returns
 */
export function read_str(s) {
    const reader = new Reader();
    reader.tokens = tokenize(s);
    if (!reader.tokens.length) {
        throw new NextInput();
    }
    return read_form(reader);
}

/**
 * @param {string} s
 */
function tokenize(s) {
    const tokens = [];
    let q = '';
    let i = 0;
    let t = '';
    const nonSpecialCharactersRe = /[^\s\[\]{}('"`,;)]/;
    while (i < s.length) {
        let inc = 1;
        switch (q) {
            case '': {
                if (s[i].match(/\s/)) {
                    // pass
                } else if (s[i] === '~' && i < s.length && s[i + 1] === '@') {
                    tokens.push('~@');
                    inc = 2;
                } else if ("[]{}()'`~^@".includes(s[i])) {
                    tokens.push(s[i]);
                } else if (s[i] === '"') {
                    q = 'string';
                    t = '"';
                } else if (s[i] === ';') {
                    t = s[i];
                    let j = i + 1;
                    while (j < s.length && s[j] != '\n') {
                        inc++;
                        t += s[j];
                        j++;
                    }
                    tokens.push(t);
                } else if (s[i].match(nonSpecialCharactersRe)) {
                    t = s[i];
                    let j = i + 1;
                    while (j < s.length && s[j].match(nonSpecialCharactersRe) && s[j] != '\n') {
                        inc++;
                        t += s[j];
                        j++;
                    }
                    tokens.push(t);
                }
                break;
            }
            case 'string': {
                if (s[i] === '\\') {
                    if (i + 1 < s.length) {
                        t += '\\' + s[i + 1];
                        inc = 2;
                    } else {
                        throw new Error('Expected escaped char but found EOF');
                    }
                } else if (s[i] === '"') {
                    tokens.push(t + '"');
                    q = '';
                } else {
                    t += s[i];
                }
                break;
            }
        }
        i += inc;
    }
    if (q === 'string') {
        throw new Error('Expected string but found EOF');
    }
    return tokens;
}

/**
 * @param {Reader} reader
 */
function read_list(reader, endToken, listInstance) {
    reader.next();
    while (true) {
        const token = reader.peek();
        if (token === endToken) {
            reader.next();
            return listInstance;
        }
        if (token === Reader.END_VALUE) {
            break;
        }
        listInstance.value.push(read_form(reader));
    }
    throw new Error(`Expected end token "${endToken}" but found EOF`);
}

/**
 * @param {Reader} reader
 */
function read_atom(reader) {
    const token = reader.next();
    if (token.match(/^[+-]?\d+$/)) {
        const malNumber = new MalNumber();
        malNumber.value = parseInt(token);
        return malNumber;
    } else if (token[0] === '"') {
        const malString = new MalString();
        let s = '';
        let i = 1;
        while (i < token.length - 1) {
            if (token[i] === '\\' && token[i + 1] === '"') {
                s += '"';
                i += 2;
            } else if (token[i] === '\\' && token[i + 1] === 'n') {
                s += '\n';
                i += 2;
            } else if (token[i] === '\\' && token[i + 1] === '\\') {
                s += '\\';
                i += 2;
            } else {
                s += token[i++];
            }
        }
        malString.value = s;
        malString.token = token;
        return malString;
    } else if (token[0] === ';') {
        // pass
    } else if (token[0] === ':') {
        const malKeyword = new MalKeyword();
        malKeyword.value = token;
        return malKeyword;
    } else {
        const malSymbol = new MalSymbol();
        malSymbol.value = token;
        return malSymbol;
    }
}

/**
 * @param {Reader} reader
 */
function read_form(reader) {
    const token = reader.peek();
    if (token === '(') {
        return read_list(reader, ')', new MalList());
    } else if (token === '[') {
        return read_list(reader, ']', new MalVector());
    } else if (token === '{') {
        return read_list(reader, '}', new MalHash());
    } else if (token === "'") {
        reader.next();
        const malList = new MalList();
        malList.value.push('quote');
        malList.value.push(read_form(reader));
        return malList;
    } else if (token === '`') {
        reader.next();
        const malList = new MalList();
        malList.value.push('quasiquote');
        malList.value.push(read_form(reader));
        return malList;
    } else if (token === '~') {
        reader.next();
        const malList = new MalList();
        malList.value.push('unquote');
        malList.value.push(read_form(reader));
        return malList;
    } else if (token === '~@') {
        reader.next();
        const malList = new MalList();
        malList.value.push('splice-unquote');
        malList.value.push(read_form(reader));
        return malList;
    } else if (token === '@') {
        reader.next();
        const malList = new MalList();
        malList.value.push('deref');
        malList.value.push(read_form(reader));
        return malList;
    } else if (token === '^') {
        reader.next();
        const malList = new MalList();
        malList.value.push('with-meta');
        const a = read_form(reader);
        const b = read_form(reader);
        malList.value.push(b);
        malList.value.push(a);
        return malList;
    } else {
        return read_atom(reader);
    }
}
