const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');
const app = express();
const port = 3000;

// Инициализация базы данных SQLite
const db = new sqlite3.Database('./urls.db', (err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err.message);
  } else {
    console.log('Подключение к базе данных успешно');
    db.run(`CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_url TEXT NOT NULL,
      short_url TEXT NOT NULL UNIQUE
    )`);
  }
});

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

  // Генерация короткого URL
  let shortUrl = generateShortUrl();

  // Проверка уникальности короткого URL
  db.get('SELECT short_url FROM urls WHERE short_url = ?', [shortUrl], (err, row) => {
    if (err) {
      return res.status(500).send('Ошибка базы данных');
    }
    if (row) {
      shortUrl = generateShortUrl();  // Генерируем новый URL, если текущий уже существует
    }

    // Сохранение в базу данных
    db.run('INSERT INTO urls (original_url, short_url) VALUES (?, ?)', [originalUrl, shortUrl], function (err) {
      if (err) {
        return res.status(500).send('Ошибка при сохранении в базу данных');
      }
      res.redirect('/urls'); // Перенаправление на страницу с сокращёнными ссылками
    });
  });
});

// Маршрут для переадресации по сокращённому URL
app.get('/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;

  db.get('SELECT original_url FROM urls WHERE short_url = ?', [shortUrl], (err, row) => {
    if (err) {
      return res.status(500).send('Ошибка базы данных');
    }
    if (row) {
      res.redirect(row.original_url); // Переадресация на оригинальный URL
    } else {
      res.status(404).send('Сокращённый URL не найден');
    }
  });
});

// Маршрут для отображения формы для создания ссылок
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Маршрут для отображения всех сокращённых ссылок
app.get('/urls', (req, res) => {
  db.all('SELECT * FROM urls', [], (err, rows) => {
    if (err) {
      console.error('Ошибка базы данных при получении данных:', err.message);
      return res.status(500).send('Ошибка базы данных');
    }
    let html = '<h1>Все сокращённые ссылки:</h1><ul>';
    rows.forEach((row) => {
      html += `<li><a href="/${row.short_url}" target="_blank">/${row.short_url}</a> -> ${row.original_url}</li>`;
    });
    html += '</ul>';
    html += '<br><a href="/">Создать сокращённую ссылку</a>';
    res.send(html);
  });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер работает на http://localhost:${port}`);
});
