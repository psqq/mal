export class MalType {}

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

export class MalTypesFactory {
    makeNumber(v) {
        const malNumber = new MalNumber();
        malNumber.value = v;
        return malNumber;
    }

    makeVector(v) {
        const malNumber = new MalVector();
        malNumber.value = v;
        return malNumber;
    }

    makeHash(v) {
        const malHash = new MalHash();
        malHash.value = v;
        return malHash;
    }
}
