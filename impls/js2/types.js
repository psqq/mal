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
        this.ast = null;
        this.params = null;
        this.env = null;
        this.fn = null;
    }
}

export class MalTypesFactory {
    makeNumber(v) {
        const malNumber = new MalNumber();
        malNumber.value = v;
        return malNumber;
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

    makeList(v) {
        const malList = new MalList();
        malList.value = v;
        return malList;
    }

    makeVector(v) {
        const malVector = new MalVector();
        malVector.value = v;
        return malVector;
    }

    makeHash(v) {
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

    makeNil() {
        return new MalNil();
    }
}

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
    return false;
}
