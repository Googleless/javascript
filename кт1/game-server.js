const zmq = require('zeromq');
const socket = new zmq.Router();

let min, max;

async function run() {
    await socket.bind('tcp://localhost:3000');
    console.log('Готов к игре...');

    while (true) {
        try {
            const [clientId, msg] = await socket.receive();
            const request = JSON.parse(msg.toString());

            if (request.range) {
                const range = request.range.split('-').map(Number);
                if (range.length === 2 && !isNaN(range[0]) && !isNaN(range[1])) {
                    min = range[0];
                    max = range[1];
                    console.log("Диапазон получен: от " + min + " до " + max);

                    let guess = Math.floor((min + max) / 2);
                    await socket.send([clientId, JSON.stringify({ answer: guess })]);
                } else {
                    console.error("Некорректный диапазон");
                }
            }
 
            else if (request.hint) {
                console.log(`Подсказка от клиента: ${request.hint}`);

                if (min === undefined || max === undefined) {
                    console.error("Диапазон не был инициализирован.");
                    continue;
                }

                if (request.hint === 'Больше') {
                    min = Math.floor((min + max) / 2) + 1;
                } else if (request.hint === 'Меньше') {
                    max = Math.floor((min + max) / 2) - 1;
                } else {
                    console.error("Некорректная подсказка.");
                    continue;
                }

                if (min > max) {
                    console.log("Диапазон больше не действителен.");
                    await socket.send([clientId, JSON.stringify({ error: "Диапазон исчерпан" })]);
                    continue;
                }

                let guess = Math.floor((min + max) / 2);
                console.log("Новая попытка: " + guess);
                await socket.send([clientId, JSON.stringify({ answer: guess })]);
            } else {
                console.error("Некорректное сообщение от клиента");
            }
        } catch (error) {
            console.error("Ошибка при обработке сообщения:", error);
        }
    }
}

run().catch(console.error);