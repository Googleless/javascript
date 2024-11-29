const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = new Map(); // Хранение подключённых клиентов

const colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown', 'pink'];

wss.on('connection', (ws) => {
    let userName = null;
    let userColor = null;

    ws.on('message', (message) => {
        try {
            const parsed = JSON.parse(message);

            if (parsed.type === 'introduce') {
                userName = parsed.name;
                userColor = colors[Math.floor(Math.random() * colors.length)];
                clients.set(ws, { name: userName, color: userColor });

                // Сообщение для остальных пользователей
                broadcast(
                    JSON.stringify({
                        type: 'info',
                        message: `${userName} присоединился к чату.`,
                    }),
                    ws
                );

                // Подтверждение подключения пользователю
                ws.send(
                    JSON.stringify({
                        type: 'info',
                        message: `Добро пожаловать, ${userName}!`,
                    })
                );
            } else if (parsed.type === 'message') {
                if (userName) {
                    const userMessage = {
                        type: 'message',
                        message: `${userName}: ${parsed.message}`,
                        color: userColor,
                    };

                    // Отправка сообщения всем пользователям
                    broadcast(JSON.stringify(userMessage));
                }
            } else {
                console.error('Неизвестный тип сообщения:', parsed.type);
            }
        } catch (err) {
            console.error('Ошибка обработки сообщения:', err);
        }
    });

    ws.on('close', () => {
        if (userName) {
            clients.delete(ws);
            broadcast(
                JSON.stringify({
                    type: 'info',
                    message: `${userName} вышел из чата.`,
                })
            );
        }
    });
});

// Функция широковещательной отправки
function broadcast(message, sender = null) {
    clients.forEach((_, client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

console.log('WebSocket сервер запущен на ws://localhost:8080');
