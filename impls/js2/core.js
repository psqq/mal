import { pr_str } from './printer.js';
import { read_str } from './reader.js';
import {
    MalAtom,
    MalFunction,
    MalList,
    MalNumber,
    MalTypesFactory,
    MalVector,
    cmpMalValues,
    isMalList,
} from './types.js';
import fs from 'node:fs';

function cmpNumbers(op) {
    const cmpFunc = {
        ['<']: (a, b) => a < b,
        ['<=']: (a, b) => a <= b,
        ['>']: (a, b) => a > b,
        ['>=']: (a, b) => a >= b,
    }[op];
    return (...args) => {
        if (!(args[0] instanceof MalNumber) || !(args[1] instanceof MalNumber)) {
            return new MalTypesFactory().makeFalse();
        }
        if (cmpFunc(args[0].value, args[1].value)) {
            return new MalTypesFactory().makeTrue();
        } else {
            return new MalTypesFactory().makeFalse();
        }
    };
}

export const ns = {
    ['+']: (a, b) => new MalTypesFactory().makeNumber(a.value + b.value),
    ['-']: (a, b) => new MalTypesFactory().makeNumber(a.value - b.value),
    ['*']: (a, b) => new MalTypesFactory().makeNumber(a.value * b.value),
    ['/']: (a, b) => new MalTypesFactory().makeNumber(a.value / b.value),
    list: (...args) => {
        return new MalTypesFactory().makeList(args);
    },
    ['list?']: (malValue) => {
        if (malValue instanceof MalList) {
            return new MalTypesFactory().makeTrue();
        } else {
            return new MalTypesFactory().makeFalse();
        }
    },
    ['empty?']: (...args) => {
        if (
            (args[0] instanceof MalList || args[0] instanceof MalVector) &&
            args[0].value.length <= 0
        ) {
            return new MalTypesFactory().makeTrue();
        } else {
            return new MalTypesFactory().makeFalse();
        }
    },
    ['count']: (malValue) => {
        if (isMalList(malValue)) {
            return new MalTypesFactory().makeNumber(malValue.value.length);
        }
        return new MalTypesFactory().makeNumber(0);
    },
    ['=']: (a, b) => {
        if (cmpMalValues(a, b)) {
            return new MalTypesFactory().makeTrue();
        }
        return new MalTypesFactory().makeFalse();
    },
    ['<']: cmpNumbers('<'),
    ['<=']: cmpNumbers('<='),
    ['>']: cmpNumbers('>'),
    ['>=']: cmpNumbers('>='),
    ['pr-str']: (...args) => {
        const s = args.map((arg) => pr_str(arg, true)).join(' ');
        return new MalTypesFactory().makeStringByValue(s);
    },
    ['str']: (...args) => {
        const s = args.map((arg) => pr_str(arg, false)).join('');
        return new MalTypesFactory().makeStringByValue(s);
    },
    ['prn']: (...args) => {
        const s = args.map((arg) => pr_str(arg, true)).join(' ');
        console.log(s);
        return new MalTypesFactory().makeNil();
    },
    ['println']: (...args) => {
        const s = args.map((arg) => pr_str(arg, false)).join(' ');
        console.log(s);
        return new MalTypesFactory().makeNil();
    },
    ['read-string']: (malString) => {
        const result = read_str(malString.value);
        return result;
    },
    ['slurp']: (malString) => {
        const filename = malString.value;
        const content = fs.readFileSync(filename, { encoding: 'utf-8' });
        return new MalTypesFactory().makeStringByValue(content);
    },
    ['atom']: (malValue) => {
        return new MalTypesFactory().makeAtom(malValue);
    },
    ['atom?']: (malValue) => {
        if (malValue instanceof MalAtom) {
            return new MalTypesFactory().makeTrue();
        } else {
            return new MalTypesFactory().makeFalse();
        }
    },
    ['deref']: (malAtom) => {
        return malAtom.value;
    },
    ['reset!']: (malAtom, malValue) => {
        malAtom.value = malValue;
        return malAtom.value;
    },
    ['swap!']: (malAtom, malFunction, ...args) => {
        if (malFunction instanceof MalFunction) {
            malAtom.value = malFunction.fn(malAtom.value, ...args);
        } else {
            malAtom.value = malFunction(malAtom.value, ...args);
        }
        return malAtom.value;
    },
    ['func-ast']: (func) => {
        if (func instanceof MalFunction) {
            return new MalTypesFactory().makeStringByValue(pr_str(func.ast));
        }
        return new MalTypesFactory().makeStringByValue(pr_str(func));
    },
};
