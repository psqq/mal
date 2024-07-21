export class MalType {}

export class MalList extends MalType {
    constructor() {
        super();
        /** @type {MalType[]} */
        this.value = [];
    }
}

export class MalVector extends MalList {}

export class MalHash extends MalList {}

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
