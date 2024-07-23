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
import { readline } from './readline.js';

const repl_env = new EnvFactory().makeEnv();
for (const [k, v] of Object.entries(core.ns)) {
    repl_env.set(k, v);
}
repl_env.set('eval', (ast) => EVAL(ast, repl_env));

async function READ() {
    const userInput = await readline('js2-user> ');
    if (userInput === null) {
        process.exit(0);
    }
    return read_str(userInput);
}

/**
 * @param {MalType} ast
 * @param {Env} env
 * @returns
 */
async function eval_ast(ast, env) {
    if (ast instanceof MalSymbol) {
        return env.get(ast.value);
    } else if (ast instanceof MalVector) {
        return new MalTypesFactory().makeVector(
            await Promise.all(ast.value.map((item) => EVAL(item, env))),
        );
    } else if (ast instanceof MalHash) {
        return new MalTypesFactory().makeHash(
            await Promise.all(
                ast.value.map((item, index) => {
                    if (index % 2 === 0) {
                        return item;
                    } else {
                        return EVAL(item, env);
                    }
                }),
            ),
        );
    } else if (ast instanceof MalList) {
        const malList = new MalList();
        for (const v of ast.value) {
            malList.value.push(await EVAL(v, env));
        }
        return malList;
    } else {
        return ast;
    }
}

async function EVAL(astArg, envArg) {
    let ast = astArg;
    let env = envArg;
    while (true) {
        if (!(ast instanceof MalList)) {
            return await eval_ast(ast, env);
        }
        if (!ast.value.length) {
            return ast;
        }
        if (ast.value[0].value === 'def!') {
            const v = await EVAL(ast.value[2], env);
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
                const value = await EVAL(letEnvList.value[i + 1], env);
                env.set(key, value);
            }
            ast = ast.value[2];
        } else if (ast.value[0].value === 'do') {
            const rest = new MalTypesFactory().makeListSlice(ast, 1, -1);
            await eval_ast(rest, env);
            ast = ast.value[ast.value.length - 1];
        } else if (ast.value[0].value === 'if') {
            const condition = await EVAL(ast.value[1], env);
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
            malFunc.fn = async (...args) => {
                const fn_env = new EnvFactory().makeEnv(env, ast.value[1], args);
                return await EVAL(ast.value[2], fn_env);
            };
            return malFunc;
        } else {
            /** @type {MalList} */
            const malList = await eval_ast(ast, env);
            const func = malList.value[0];
            const args = malList.value.slice(1);
            if (func instanceof MalFunction) {
                ast = func.ast;
                env = new EnvFactory().makeEnv(func.env, func.params, args);
            } else {
                return await func(...args);
            }
        }
    }
}

function PRINT(s) {
    console.log(pr_str(s));
}

async function rep(readFunc = () => READ(), { withPrint = true } = {}) {
    try {
        const ast = await readFunc();
        await EVAL(read_str('(def! not (fn* (a) (if a false true)))'), repl_env);
        await EVAL(
            read_str(
                '(def! load-file (fn* (f) (eval (read-string (str "(do " (slurp f) "\nnil)")))))',
            ),
            repl_env,
        );
        const result = await EVAL(ast, repl_env);
        if (withPrint) {
            PRINT(result);
        }
    } catch (e) {
        if (e instanceof NextInput) {
            return;
        } else if (e instanceof MalError) {
            const reason = e.reason;
            console.log(`Error: ${pr_str(reason)}`);
            console.log(e.stack);
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
    await rep(() => read_str(`(load-file "${filename}")`), { withPrint: false });
    process.exit(0);
}

repl_env.set('*ARGV*', new MalTypesFactory().makeList([]));
while (true) await rep();
