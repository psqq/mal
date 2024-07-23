import { pr_str } from './printer.js';
import { read_str } from './reader.js';
import { readline } from './readline.js';
import {
    MalAtom,
    MalError,
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
    MalTypesFactory,
    MalVector,
    clone,
    cmpMalValues,
    isMalList,
} from './types.js';
import fs from 'node:fs';
import { isFunction } from './utils.js';

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
    ['swap!']: async (malAtom, malFunction, ...args) => {
        if (malFunction instanceof MalFunction) {
            malAtom.value = await malFunction.fn(malAtom.value, ...args);
        } else {
            malAtom.value = await malFunction(malAtom.value, ...args);
        }
        return malAtom.value;
    },
    ['func-ast']: (func) => {
        if (func instanceof MalFunction) {
            return new MalTypesFactory().makeStringByValue(pr_str(func.ast));
        }
        return new MalTypesFactory().makeStringByValue(pr_str(func));
    },
    ['cons']: (malValue, malList) => {
        const newList = [malValue];
        return new MalTypesFactory().makeList(newList.concat(malList.value));
    },
    ['concat']: (...args) => {
        let newList = [];
        for (const arg of args) {
            newList = newList.concat(arg.value);
        }
        return new MalTypesFactory().makeList(newList);
    },
    ['vec']: (malValue) => {
        if (malValue instanceof MalVector) {
            return malValue;
        }
        return new MalTypesFactory().makeVector(malValue.value);
    },
    ['nth']: (malValue, malNumber) => {
        if (isMalList(malValue)) {
            if (malNumber.value < 0 || malNumber.value >= malValue.value.length) {
                throw new MalError(new MalTypesFactory().makeStringByValue('out of range'));
            }
            return malValue.value[malNumber.value];
        }
        return new MalTypesFactory().makeVector(malValue.value);
    },
    ['first']: (malValue) => {
        if (isMalList(malValue)) {
            if (malValue.value.length > 0) {
                return malValue.value[0];
            }
        }
        return new MalTypesFactory().makeNil();
    },
    ['rest']: (malValue) => {
        const result = new MalTypesFactory().makeList();
        if (isMalList(malValue)) {
            result.value = malValue.value.slice(1);
        }
        return result;
    },
    ['throw']: (malValue) => {
        throw new MalTypesFactory().makeError(malValue);
    },
    ['apply']: async (...applyArgs) => {
        const malFunction = applyArgs[0];
        let args = [];
        for (let i = 1; i < applyArgs.length; i++) {
            if (isMalList(applyArgs[i])) {
                args = args.concat(applyArgs[i].value);
            } else {
                args.push(applyArgs[i]);
            }
        }
        let result;
        if (malFunction instanceof MalFunction) {
            result = await malFunction.fn(...args);
        } else {
            result = await malFunction(...args);
        }
        return result;
    },
    ['map']: async (func, aList) => {
        const result = new MalTypesFactory().makeList();
        for (let i = 0; i < aList.value.length; i++) {
            if (func instanceof MalFunction) {
                result.value[i] = await func.fn(aList.value[i]);
            } else {
                result.value[i] = await func(aList.value[i]);
            }
        }
        return result;
    },
    ['nil?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalNil);
    },
    ['true?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalTrue);
    },
    ['false?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalFalse);
    },
    ['symbol?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalSymbol);
    },
    ['keyword?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalKeyword);
    },
    ['vector?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalVector);
    },
    ['map?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalHash);
    },
    ['sequential?']: (malValue) => {
        return new MalTypesFactory().makeBool(isMalList(malValue));
    },
    ['symbol']: (malString) => {
        return new MalTypesFactory().makeSymbol(malString.value);
    },
    ['keyword']: (malValue) => {
        if (malValue instanceof MalKeyword) {
            return malValue;
        }
        return new MalTypesFactory().makeKeyword(':' + malValue.value);
    },
    ['vector']: (...args) => {
        return new MalTypesFactory().makeVector(args);
    },
    ['hash-map']: (...args) => {
        return new MalTypesFactory().makeHash(args);
    },
    ['assoc']: (malHash, ...args) => {
        return new MalTypesFactory().makeHash(malHash.value.concat(args));
    },
    ['dissoc']: (malHash, ...args) => {
        const newMalHash = new MalTypesFactory().makeHash();
        const keysToRemove = args.map((arg) => arg.value);
        for (let i = 0; i < malHash.value.length; i += 2) {
            if (!keysToRemove.includes(malHash.value[i].value)) {
                newMalHash.value.push(malHash.value[i]);
                newMalHash.value.push(malHash.value[i + 1]);
            }
        }
        return newMalHash;
    },
    ['get']: (malHash, key) => {
        if (malHash instanceof MalNil) {
            return new MalTypesFactory().makeNil();
        }
        for (let i = malHash.value.length - 2; i >= 0; i -= 2) {
            if (malHash.value[i].value === key.value) {
                return malHash.value[i + 1];
            }
        }
        return new MalTypesFactory().makeNil();
    },
    ['contains?']: (malHash, key) => {
        for (let i = 0; i < malHash.value.length; i += 2) {
            if (malHash.value[i].value === key.value) {
                return new MalTypesFactory().makeTrue();
            }
        }
        return new MalTypesFactory().makeFalse();
    },
    ['keys']: (malHash) => {
        const keys = {};
        for (let i = 0; i < malHash.value.length; i += 2) {
            keys[malHash.value[i].value] = malHash.value[i];
        }
        return new MalTypesFactory().makeList(Object.values(keys));
    },
    ['vals']: (malHash) => {
        const vals = {};
        for (let i = 0; i < malHash.value.length; i += 2) {
            vals[malHash.value[i].value] = malHash.value[i + 1];
        }
        return new MalTypesFactory().makeList(Object.values(vals));
    },
    ['readline']: async (malString) => {
        const answer = await readline(malString.value);
        if (answer === null) {
            return new MalTypesFactory().makeNil();
        }
        return new MalTypesFactory().makeStringByValue(answer);
    },
    ['time-ms']: () => {
        return new MalTypesFactory().makeNumber(Date.now());
    },
    ['meta']: (malValue) => {
        if (malValue?.meta == null) {
            return new MalTypesFactory().makeNil();
        }
        return malValue.meta;
    },
    ['with-meta']: (malValue, meta) => {
        const newMalValue = clone(malValue);
        newMalValue.meta = meta;
        return newMalValue;
    },
    ['fn?']: (malValue) => {
        return new MalTypesFactory().makeBool(
            isFunction(malValue) || (malValue instanceof MalFunction && !malValue.is_macro),
        );
    },
    ['macro?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalFunction && malValue.is_macro);
    },
    ['string?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalString);
    },
    ['number?']: (malValue) => {
        return new MalTypesFactory().makeBool(malValue instanceof MalNumber);
    },
    ['seq']: (malValue) => {
        if (malValue instanceof MalVector) {
            if (malValue.value.length) {
                const malList = new MalTypesFactory().makeList(malValue.value);
                return malList;
            } else {
                return new MalTypesFactory().makeNil();
            }
        }
        if (malValue instanceof MalString) {
            if (malValue.value.length) {
                const malList = new MalTypesFactory().makeList(
                    malValue.value
                        .split('')
                        .map((ch) => new MalTypesFactory().makeStringByValue(ch)),
                );
                return malList;
            } else {
                return new MalTypesFactory().makeNil();
            }
        }
        if (malValue instanceof MalList && !malValue.value.length) {
            return new MalTypesFactory().makeNil();
        }
        return malValue;
    },
    ['conj']: (malValue, ...args) => {
        if (malValue instanceof MalList) {
            const malList = new MalTypesFactory().makeList();
            malList.value = args.reverse().concat(malValue.value);
            return malList;
        } else {
            const malVector = new MalTypesFactory().makeVector(malValue.value.concat(args));
            return malVector;
        }
    },
};
