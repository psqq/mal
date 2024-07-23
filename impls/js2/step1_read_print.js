import { read_str } from './reader.js';
import { pr_str } from './printer.js';
import { NextInput } from './errors.js';
import { MalError } from './types.js';
import { readline } from './readline.js';

async function READ() {
    const userInput = await readline('js2-user> ');
    if (userInput === null) {
        process.exit(0);
    }
    return read_str(userInput);
}

function EVAL(s) {
    return s;
}

function PRINT(s) {
    console.log(pr_str(s));
}

async function rep() {
    try {
        const inp = await READ();
        const result = EVAL(inp);
        PRINT(result);
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

while (true) await rep();
