import { createInterface } from 'readline';
import { read_str } from './reader.js';
import { pr_str } from './printer.js';
import { NextInput } from './errors.js';
import {
    MalFalse,
    MalHash,
    MalList,
    MalNil,
    MalSymbol,
    MalType,
    MalTypesFactory,
    MalVector,
} from './types.js';
import { Env, EnvFactory } from './env.js';
import * as core from './core.js';

const repl_env = new EnvFactory().makeEnv();
for (const [k, v] of Object.entries(core.ns)) {
    repl_env.set(k, v);
}

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

/**
 * @param {MalType} ast
 * @param {Env} env
 * @returns
 */
function eval_ast(ast, env) {
    if (ast instanceof MalSymbol) {
        return env.get(ast.value);
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
            if (ast.value[0].value === 'def!') {
                const v = EVAL(ast.value[2], env);
                env.set(ast.value[1].value, v);
                return v;
            } else if (ast.value[0].value === 'let*') {
                const let_env = new EnvFactory().makeEnv(env);
                const letEnvList = ast.value[1];
                if (!(letEnvList instanceof MalList) && !(letEnvList instanceof MalVector)) {
                    throw new Error(
                        'Expected MalList|MalVector but found ' + letEnvList.constructor.name,
                    );
                }
                for (let i = 0; i < letEnvList.value.length; i += 2) {
                    const key = letEnvList.value[i].value;
                    const value = EVAL(letEnvList.value[i + 1], let_env);
                    let_env.set(key, value);
                }
                return EVAL(ast.value[2], let_env);
            } else if (ast.value[0].value === 'do') {
                const rest = new MalTypesFactory().makeList(ast.value.slice(1));
                const result = eval_ast(rest, env);
                return result.value[result.value.length - 1];
            } else if (ast.value[0].value === 'if') {
                const condition = EVAL(ast.value[1], env);
                if (condition instanceof MalNil || condition instanceof MalFalse) {
                    if (ast.value.length >= 4) {
                        return EVAL(ast.value[3], env);
                    } else {
                        return new MalTypesFactory().makeNil();
                    }
                }
                return EVAL(ast.value[2], env);
            } else if (ast.value[0].value === 'fn*') {
                return (...args) => {
                    const fn_env = new EnvFactory().makeEnv(env, ast.value[1], args);
                    return EVAL(ast.value[2], fn_env);
                };
            } else {
                /** @type {MalList} */
                const malList = eval_ast(ast, env);
                const func = malList.value[0];
                const args = malList.value.slice(1);
                return func(...args);
            }
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
        EVAL(read_str('(def! not (fn* (a) (if a false true)))'), repl_env);
        const result = EVAL(ast, repl_env);
        PRINT(result);
    } catch (e) {
        if (e instanceof NextInput) {
            return;
        } else if (e instanceof Error) {
            console.log(e.message);
            console.log(e);
        } else {
            console.log('Unknown error');
            console.log(e);
        }
    }
}

while (true) await rep();
