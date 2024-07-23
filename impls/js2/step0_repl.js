import { readline } from './readline.js';

async function READ() {
    const userInput = await readline('js2-user> ');
    if (userInput === null) {
        process.exit(0);
    }
    return userInput;
}

function EVAL(s) {
    return s;
}

function PRINT(s) {
    console.log(s);
}

async function rep() {
    const inp = await READ();
    const result = EVAL(inp);
    PRINT(result);
}

while (true) await rep();
