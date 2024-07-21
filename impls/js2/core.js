import { pr_str } from './printer.js';
import { MalList, MalNumber, MalTypesFactory, MalVector, cmpMalValues } from './types.js';

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
    ['list?']: (...args) => {
        if (args[0] instanceof MalList) {
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
    ['count']: (...args) => {
        if (args[0] instanceof MalList || args[0] instanceof MalVector) {
            return new MalTypesFactory().makeNumber(args[0].value.length);
        }
        return new MalTypesFactory().makeNumber(0);
    },
    ['=']: (...args) => {
        if (cmpMalValues(args[0], args[1])) {
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
};
