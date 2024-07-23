export class MalType {}

export class MalNil extends MalType {}

export class MalTrue extends MalType {}

export class MalFalse extends MalType {}

export class MalList extends MalType {
    constructor() {
        super();
        /** @type {MalType[]} */
        this.value = [];
    }
}

export class MalVector extends MalType {
    constructor() {
        super();
        /** @type {MalType[]} */
        this.value = [];
    }
}

export class MalHash extends MalType {
    constructor() {
        super();
        /** @type {MalType[]} */
        this.value = [];
    }
}

export class MalNumber extends MalType {
    constructor() {
        super();
        this.value = 0;
    }
}

export class MalString extends MalType {
    constructor() {
        super();
        this.value = '';
        this.token = '""';
    }
}

export class MalSymbol extends MalType {
    constructor() {
        super();
        this.value = '';
    }
}

export class MalKeyword extends MalType {
    constructor() {
        super();
        this.value = '';
    }
}

export class MalFunction extends MalType {
    constructor() {
        super();
        /** @type {MalType} */
        this.ast = null;
        /** @type {MalType[]} */
        this.params = null;
        /** @type {import('./env.js').Env} */
        this.env = null;
        /** @type {function} */
        this.fn = null;
        this.is_macro = false;
    }
}

export class MalAtom extends MalType {
    constructor() {
        super();
        /** @type {MalType} */
        this.value = null;
    }
}

export class MalError extends Error {
    /**
     * @param {MalType} reason
     */
    constructor(reason) {
        super();
        this.reason = reason;
    }
}

export class MalTypesFactory {
    makeNumber(v) {
        const malNumber = new MalNumber();
        malNumber.value = v;
        return malNumber;
    }

    makeSymbol(s) {
        const malSymbol = new MalSymbol();
        malSymbol.value = s;
        return malSymbol;
    }

    makeKeyword(s) {
        const malSymbol = new MalKeyword();
        malSymbol.value = s;
        return malSymbol;
    }

    makeStringByValue(v) {
        const malString = new MalString();
        malString.value = v;
        let token = '';
        for (const ch of v) {
            if (ch === '"') {
                token += '\\"';
            } else if (ch === '\n') {
                token += '\\n';
            } else if (ch === '\\') {
                token += '\\\\';
            } else {
                token += ch;
            }
        }
        malString.token = `"${token}"`;
        return malString;
    }

    makeList(v = []) {
        const malList = new MalList();
        malList.value = v;
        return malList;
    }

    makeListSlice(malList, start, end) {
        const malListSlice = new MalList();
        malListSlice.value = malList.value.slice(start, end);
        return malListSlice;
    }

    makeVector(v = []) {
        const malVector = new MalVector();
        malVector.value = v;
        return malVector;
    }

    makeHash(v = []) {
        const malHash = new MalHash();
        malHash.value = v;
        return malHash;
    }

    makeTrue() {
        return new MalTrue();
    }

    makeFalse() {
        return new MalFalse();
    }

    makeBool(flag) {
        if (flag) {
            return this.makeTrue();
        } else {
            return this.makeFalse();
        }
    }

    makeNil() {
        return new MalNil();
    }

    makeAtom(v) {
        const malAtom = new MalAtom();
        malAtom.value = v;
        return malAtom;
    }

    makeError(reason) {
        const malError = new MalError();
        malError.reason = reason;
        return malError;
    }
}

/**
 * @param {MalType} x
 * @typedef {MalList | MalVector} MalAnyList
 * @returns {x is MalAnyList}
 */
export function isMalList(x) {
    return x instanceof MalList || x instanceof MalVector;
}

export function isFalsy(x) {
    return x instanceof MalFalse || x instanceof MalNil;
}

/**
 * @param {any} a
 * @param {any} b
 */
export function cmpMalValues(a, b) {
    if (!a instanceof MalType && !(b instanceof MalType)) {
        return a === b;
    }
    if (a instanceof MalType && !(b instanceof MalType)) {
        return true;
    }
    if (b instanceof MalType && !(a instanceof MalType)) {
        return true;
    }
    if (isMalList(a) && isMalList(b)) {
        if (a.value.length !== b.value.length) {
            return false;
        }
        for (let i = 0; i < a.value.length; i++) {
            if (!cmpMalValues(a.value[i], b.value[i])) {
                return false;
            }
        }
        return true;
    }
    if (a.constructor.name !== b.constructor.name) {
        return false;
    }
    if (a instanceof MalTrue || a instanceof MalFalse || a instanceof MalNil) {
        return true;
    }
    if (
        a instanceof MalNumber ||
        a instanceof MalString ||
        a instanceof MalSymbol ||
        a instanceof MalKeyword
    ) {
        return a.value === b.value;
    }
    if (a instanceof MalHash) {
        const aKV = {};
        const bKV = {};
        for (let i = 0; i < a.value.length; i += 2) {
            aKV[a.value[i].value] = a.value[i + 1];
        }
        for (let i = 0; i < b.value.length; i += 2) {
            bKV[b.value[i].value] = b.value[i + 1];
        }
        if (Object.keys(aKV).length !== Object.keys(bKV).length) {
            return false;
        }
        for (const k in aKV) {
            if (!cmpMalValues(aKV[k], bKV[k])) {
                return false;
            }
        }
        return true;
    }
    return false;
}
