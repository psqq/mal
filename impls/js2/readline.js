import { createInterface } from 'readline';

export async function readline(question) {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        }).on('close', () => {
            resolve(null);
        });
        rl.question(question, (answer) => {
            resolve(answer);
            rl.close();
        });
    });
}
