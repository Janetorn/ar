// js/books.js

// Привязка bookId (0, 1, 2) к ISBN
const BOOK_ISBN_MAP = {
    0: "9785040904600",   // char1 — Мастер и Маргарита
    1: "9780451524935",   // char2 — 1984
    2: "9780060930318",   // char3 — Убить пересмешника
};

// Резервные запросы на случай, если поиск по ISBN не дал результатов
const FALLBACK_QUERIES = {
    0: "Пустая могила Джонатан Страуд",
    1: "1984 Оруэлл",
    2: "Убить пересмешника Харпер Ли"
};

const bookCache = {};

async function fetchGoogleBooks(isbn, bookId) {
    // 1. Пытаемся найти по ISBN
    const isbnUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
    try {
        const resp = await fetch(isbnUrl);
        if (resp.ok) {
            const data = await resp.json();
            if (data.items && data.items.length > 0) {
                return data.items[0].volumeInfo;
            }
        }
    } catch (e) {
        console.warn(`[Google Books] Ошибка запроса по ISBN ${isbn}:`, e);
    }

    // 2. Если ISBN не сработал, ищем по названию (текстовый поиск)
    const fallbackQuery = FALLBACK_QUERIES[bookId];
    if (fallbackQuery) {
        console.log(`[Google Books] ISBN не найден, пробуем текстовый поиск: "${fallbackQuery}"`);
        const textUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(fallbackQuery)}&maxResults=1`;
        try {
            const resp = await fetch(textUrl);
            if (resp.ok) {
                const data = await resp.json();
                if (data.items && data.items.length > 0) {
                    return data.items[0].volumeInfo;
                }
            }
        } catch (e) {
            console.error("[Google Books] Ошибка текстового поиска:", e);
        }
    }

    return null;
}

async function getBookInfo(bookId) {
    if (bookCache[bookId]) return bookCache[bookId];
    const isbn = BOOK_ISBN_MAP[bookId];
    if (!isbn) return null;
    
    const info = await fetchGoogleBooks(isbn, bookId);
    bookCache[bookId] = info;
    return info;
}

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
