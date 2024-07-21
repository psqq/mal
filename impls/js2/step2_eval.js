import { createInterface } from 'readline';
import { read_str } from './reader.js';
import { pr_str } from './printer.js';
import { NextInput } from './errors.js';
import { MalHash, MalList, MalSymbol, MalTypesFactory, MalVector } from './types.js';

const repl_env = {
    ['+']: (a, b) => new MalTypesFactory().makeNumber(a.value + b.value),
    ['-']: (a, b) => new MalTypesFactory().makeNumber(a.value - b.value),
    ['*']: (a, b) => new MalTypesFactory().makeNumber(a.value * b.value),
    ['/']: (a, b) => new MalTypesFactory().makeNumber(a.value / b.value),
};

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
}).on('close', () => process.exit(0));

async function READ() {
    const userInput = await new Promise((resolve) => {
        rl.question('user> ', resolve);
    });
    return read_str(userInput);
}

function eval_ast(ast, env) {
    if (ast instanceof MalSymbol) {
        if (ast.value in env) {
            return env[ast.value];
        } else {
            throw new Error(`${ast.value} not found`);
        }
    } else if (ast instanceof MalVector) {
        return new MalTypesFactory().makeVector(ast.value.map((item) => EVAL(item, env)));
    } else if (ast instanceof MalHash) {
        return new MalTypesFactory().makeHash(
            ast.value.map((item, index) => {
                if (index % 2 === 0) {
                    return item;
                } else {
                    return EVAL(item, env);
                }
            }),
        );
    } else if (ast instanceof MalList) {
        const malList = new MalList();
        ast.value.forEach((v) => malList.value.push(EVAL(v, env)));
        return malList;
    } else {
        return ast;
    }
}

function EVAL(ast, env) {
    if (ast instanceof MalList) {
        if (ast.value.length) {
            /** @type {MalList} */
            const malList = eval_ast(ast, env);
            const func = malList.value[0];
            const args = malList.value.slice(1);
            return func(...args);
        } else {
            return ast;
        }
    } else {
        return eval_ast(ast, env);
    }
}

function PRINT(s) {
    console.log(pr_str(s));
}

async function rep() {
    try {
        const ast = await READ();
        const result = EVAL(ast, repl_env);
        PRINT(result);
    } catch (e) {
        if (e instanceof NextInput) {
            return;
        } else if (e instanceof Error) {
            console.log(e.message);
        } else {
            console.log('Unknown error');
            console.log(e);
        }
    }
}

while (true) await rep();
