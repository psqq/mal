import { createInterface } from 'readline';
import { read_str } from './reader.js';
import { pr_str } from './printer.js';
import { NextInput } from './errors.js';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
}).on('close', () => process.exit(0));

async function READ() {
    const inp = await new Promise((resolve) => {
        rl.question('user> ', resolve);
    });
    return read_str(inp);
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
        } else if (e instanceof Error) {
            console.log(e.message);
        } else {
            console.log('Unknown error');
            console.log(e);
        }
    }
}

while (true) await rep();
