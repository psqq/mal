import { createInterface } from 'readline';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
}).on('close', () => process.exit(0));

async function READ() {
    return new Promise((resolve) => {
        rl.question('user> ', resolve);
    });
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
