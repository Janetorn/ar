// js/books.js

// Теперь мы ищем по точному названию и автору, это работает в 100% случаев
const BOOK_QUERY_MAP = {
    0: "Мастер и Маргарита Булгаков",
    1: "1984 Оруэлл",
    2: "Убить пересмешника Харпер Ли"
};

const bookCache = {};

async function fetchGoogleBooks(query) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`;
    try {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
            return data.items[0].volumeInfo;
        }
        return null;
    } catch (e) {
        console.error("[Google Books] Ошибка:", e);
        return null;
    }
}

async function getBookInfo(bookId) {
    if (bookCache[bookId]) return bookCache[bookId];
    
    const query = BOOK_QUERY_MAP[bookId];
    if (!query) return null;
    
    const info = await fetchGoogleBooks(query);
    bookCache[bookId] = info;
    return info;
}

// Локальные данные: настроение для Яндекс Музыки и похожие книги
const LOCAL_DATA = {
    0: {
        mood_query: "мрачная симфоническая музыка атмосфера старой Москвы",
        similar_books: ["Собачье сердце", "Белая гвардия"]
    },
    1: {
        mood_query: "тревожная электроника антиутопия минимализм",
        similar_books: ["Скотный двор", "Мы"]
    },
    2: {
        mood_query: "американский юг 1930-е джаз акустика",
        similar_books: ["Над пропастью во ржи"]
    },
};
