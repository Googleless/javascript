const zmq = require('zeromq');
const { randomInt } = require('crypto');

const [minRange, maxRange] = process.argv.slice(2).map(Number);
const secretNumber = randomInt(minRange, maxRange + 1);
const socket = new zmq.Dealer();

async function run() {
    await socket.connect('tcp://localhost:3000');
    console.log("Загадано число в диапазоне " + minRange + " до " + maxRange);

    await socket.send(JSON.stringify({ range: `${minRange}-${maxRange}` }));

    while (true) {
        const [msg] = await socket.receive();
        const response = JSON.parse(msg.toString());

        if (response.answer !== undefined) {
            console.log("Сервер предлагает число: " + response.answer);
            if (response.answer < secretNumber) {
                await socket.send(JSON.stringify({ hint: 'Больше' }));
            } else if (response.answer > secretNumber) {
                await socket.send(JSON.stringify({ hint: 'Меньше' }));
            } else {
                console.log('Сервер угадал число!');
                break;
            }
        }
    }
}

run().catch(console.error);
