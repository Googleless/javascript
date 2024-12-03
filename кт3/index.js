const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const port = 3000;

// Имя файла для базы данных
const DB_FILE = path.join(__dirname, 'urls.json');

// Инициализация базы данных
function loadDatabase() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify([]));
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
}

function saveDatabase(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

// Функция для генерации короткого URL
function generateShortUrl() {
    return crypto.randomBytes(6).toString('hex'); // Генерация случайной строки из 12 символов
}

// Настройка парсинга данных из форм
app.use(express.urlencoded({ extended: true }));

// Маршрут для создания короткого URL
app.post('/create', (req, res) => {
    const originalUrl = req.body.url;

    if (!originalUrl) {
        return res.status(400).send('Не указан оригинальный URL');
    }

    const db = loadDatabase();
    const shortUrl = generateShortUrl();

    // Сохранение в "базу данных"
    db.push({ original_url: originalUrl, short_url: shortUrl });
    saveDatabase(db);

    console.log('Успешно сохранён URL:', { originalUrl, shortUrl });
    res.redirect('/urls'); // Перенаправление на страницу со списком ссылок
});

// Маршрут для переадресации по сокращённому URL
app.get('/:shortUrl', (req, res) => {
    const shortUrl = req.params.shortUrl;
    const db = loadDatabase();

    const entry = db.find((item) => item.short_url === shortUrl);
    if (entry) {
        res.redirect(entry.original_url); // Переадресация на оригинальный URL
    } else {
        res.status(404).send('Сокращённый URL не найден');
    }
});

// Маршрут для отображения формы для создания ссылок
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/urls', (req, res) => {
    const db = loadDatabase();
    if (db.length === 0) {
        return res.send('<h1>Сокращённые ссылки отсутствуют</h1><a href="/">Создать новую ссылку</a>');
    }

    let html = '<h1>Все сокращённые ссылки:</h1><ul>';
    db.forEach((item) => {
        html += `<li><a href="/${item.short_url}" target="_blank">/${item.short_url}</a> -> ${item.original_url}</li>`;
    });
    html += '</ul><br><a href="/">Создать сокращённую ссылку</a>';
    res.send(html);
});


app.listen(port, () => {
    console.log(`Сервер работает на http://localhost:${port}`);
});
