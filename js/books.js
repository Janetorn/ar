// js/books.js

// Привязка bookId (0, 1, 2) к ISBN
// bookId 0 → marker-char1, 1 → marker-char2, 2 → marker-char3
const BOOK_ISBN_MAP = {
    0: "9785040904600",   // char1 — Пустая могила
    1: "9780451524935",   // char2 — 1984
    2: "9780060930318",   // char3 — Убить пересмешника
};

// Кэш в памяти
const bookCache = {};

async function fetchGoogleBooks(isbn) {
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
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
    const isbn = BOOK_ISBN_MAP[bookId];
    if (!isbn) return null;
    const info = await fetchGoogleBooks(isbn);
    bookCache[bookId] = info;
    return info;
}

// Локальные данные: настроение для Яндекс Музыки и похожие книги
const LOCAL_DATA = {
    0: {
        mood_query: "мрачная мистика саундтрек триллер симфонический оркестр",
        similar_books: ["Дом странных детей", "Девятнадцать минут"]
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
