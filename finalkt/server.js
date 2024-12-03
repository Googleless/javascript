const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Включаем поддержку EJS для рендеринга страниц
app.set('view engine', 'ejs');
app.use(express.static('public')); // Для статических файлов (CSS, JS и т.д.)
app.use(bodyParser.urlencoded({ extended: true })); // Для обработки данных из форм

// Массив для хранения заметок
let notes = [];
let nextId = 1;

// Главная страница с выводом всех заметок
app.get('/', (req, res) => {
  res.render('index', { notes });
});

// Создание новой заметки
app.post('/note', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(409).json({ message: 'Title and content are required' });
  }

  const newNote = {
    id: nextId++,
    title,
    content,
    created: new Date().toISOString(),
    changed: new Date().toISOString(),
  };

  notes.push(newNote);
  res.redirect('/'); // Перенаправление на главную страницу после добавления заметки
});

// Удаление заметки по id
app.post('/delete/:id', (req, res) => {
  const index = notes.findIndex(n => n.id === parseInt(req.params.id));
  if (index !== -1) {
    notes.splice(index, 1);
  }
  res.redirect('/'); // Перенаправление на главную страницу после удаления заметки
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
