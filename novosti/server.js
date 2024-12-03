const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

// Настройка шаблонизатора EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Список доступных категорий с переводами
const categories = [
  { id: 'business', name: 'Бизнес' },
  { id: 'politics', name: 'Политика' },
];

// Главная страница с выбором категории
app.get('/', (req, res) => {
  res.render('index', { categories });
});

// Обработчик для отображения новостей по категории
app.get('/:count/news/for/:category', async (req, res) => {
  const { count, category } = req.params;

  // Проверка категории
  const selectedCategory = categories.find(cat => cat.id === category);
  if (!selectedCategory) {
    return res.status(400).send('Invalid category. Please select a valid category.');
  }

  // Проверка количества
  if (isNaN(count) || parseInt(count) <= 0) {
    return res.status(400).send('Invalid count. Count should be a positive integer.');
  }

  try {
    // Формирование запроса к rss2json
    const rssUrl = `https://www.vedomosti.ru/rss/rubric/${category}`;
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
    const response = await axios.get(apiUrl);

    // Ограничение количества новостей
    const news = response.data.items.slice(0, parseInt(count));

    // Рендер HTML с использованием шаблона EJS
    res.render('news', { category: selectedCategory.name, count, news });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching news.');
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
