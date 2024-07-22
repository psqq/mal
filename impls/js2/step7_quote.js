import { createInterface } from 'readline';
import * as core from './core.js';
import { Env, EnvFactory } from './env.js';
import { NextInput } from './errors.js';
import { pr_str } from './printer.js';
import { read_str } from './reader.js';
import {
    MalFunction,
    MalHash,
    MalList,
    MalSymbol,
    MalType,
    MalTypesFactory,
    MalVector,
    isFalsy,
    isMalList,
} from './types.js';

const repl_env = new EnvFactory().makeEnv();
for (const [k, v] of Object.entries(core.ns)) {
    repl_env.set(k, v);
}
repl_env.set('eval', (ast) => EVAL(ast, repl_env));

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
}).on('close', () => process.exit(0));

async function READ() {
    // return read_str(String.raw`(read-string "\"\n\"")`);
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

function EVAL(astArg, envArg) {
    let ast = astArg;
    let env = envArg;
    while (true) {
        if (!(ast instanceof MalList)) {
            return eval_ast(ast, env);
        }
        if (!ast.value.length) {
            return ast;
        }
        if (ast.value[0].value === 'def!') {
            const v = EVAL(ast.value[2], env);
            env.set(ast.value[1].value, v);
            return v;
        } else if (ast.value[0].value === 'let*') {
            env = new EnvFactory().makeEnv(env);
            const letEnvList = ast.value[1];
            if (!isMalList(letEnvList)) {
                throw new Error('Expected list or vector but found ' + letEnvList.constructor.name);
            }
            for (let i = 0; i < letEnvList.value.length; i += 2) {
                const key = letEnvList.value[i].value;
                const value = EVAL(letEnvList.value[i + 1], env);
                env.set(key, value);
            }
            ast = ast.value[2];
        } else if (ast.value[0].value === 'do') {
            const rest = new MalTypesFactory().makeListSlice(ast, 1, -1);
            const result = eval_ast(rest, env);
            ast = ast.value[ast.value.length - 1];
        } else if (ast.value[0].value === 'if') {
            const condition = EVAL(ast.value[1], env);
            if (isFalsy(condition)) {
                if (ast.value.length >= 4) {
                    ast = ast.value[3];
                } else {
                    return new MalTypesFactory().makeNil();
                }
            } else {
                ast = ast.value[2];
            }
        } else if (ast.value[0].value === 'fn*') {
            const malFunc = new MalFunction();
            malFunc.ast = ast.value[2];
            malFunc.params = ast.value[1];
            malFunc.env = env;
            malFunc.fn = (...args) => {
                const fn_env = new EnvFactory().makeEnv(env, ast.value[1], args);
                return EVAL(ast.value[2], fn_env);
            };
            return malFunc;
        } else {
            /** @type {MalList} */
            const malList = eval_ast(ast, env);
            const func = malList.value[0];
            const args = malList.value.slice(1);
            if (func instanceof MalFunction) {
                ast = func.ast;
                env = new EnvFactory().makeEnv(func.env, func.params, args);
            } else {
                return func(...args);
            }
        }
    }
}

function PRINT(s) {
    console.log(pr_str(s));
}

async function rep(readFunc = () => READ()) {
    try {
        const ast = await readFunc();
        EVAL(read_str('(def! not (fn* (a) (if a false true)))'), repl_env);
        EVAL(
            read_str(
                '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))',
            ),
            repl_env,
        );
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

if (process.argv.length > 2) {
    const filename = process.argv[2];
    repl_env.set(
        '*ARGV*',
        new MalTypesFactory().makeList(
            process.argv.slice(3).map((s) => new MalTypesFactory().makeStringByValue(s)),
        ),
    );
    await rep(() => read_str(`(load-file "${filename}")`));
    process.exit(0);
}

repl_env.set('*ARGV*', new MalTypesFactory().makeList([]));
while (true) await rep();
