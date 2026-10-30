// js/books.js

// Привязка bookId (0, 1, 2) к ISBN
const BOOK_ISBN_MAP = {
    0: "9785040904600",   // char1
    1: "9780451524935",   // char2 — 1984
    2: "9780060930318",   // char3 — Убить пересмешника
};

// Резервные запросы на случай, если поиск по ISBN не дал результатов
const FALLBACK_QUERIES = {
    0: "Мастер и Маргарита Булгаков",
    1: "1984 Оруэлл",
    2: "Убить пересмешника Харпер Ли"
};

// Локальные данные — гарантированный fallback, если сеть недоступна
const LOCAL_BOOK_FALLBACK = {
    0: {
        title: "Мастер и Маргарита",
        authors: ["Михаил Булгаков"],
        publishedDate: "1967",
        publisher: "Художественная литература",
        pageCount: 480,
        averageRating: 4.8,
        categories: ["Русская классика", "Мистика", "Роман"]
    },
    1: {
        title: "1984",
        authors: ["Джордж Оруэлл"],
        publishedDate: "1949",
        publisher: "Secker & Warburg",
        pageCount: 328,
        averageRating: 4.7,
        categories: ["Антиутопия", "Фантастика", "Политика"]
    },
    2: {
        title: "Убить пересмешника",
        authors: ["Харпер Ли"],
        publishedDate: "1960",
        publisher: "J. B. Lippincott & Co.",
        pageCount: 281,
        averageRating: 4.8,
        categories: ["Американская классика", "Драма"]
    }
};

const bookCache = {};

// Таймаут для fetch, чтобы карточка не «висела» при плохой сети
function fetchWithTimeout(url, ms = 6000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    return fetch(url, { signal: controller.signal })
        .finally(() => clearTimeout(timer));
}

async function fetchGoogleBooks(isbn, bookId) {
    // 1. Пытаемся найти по ISBN
    const isbnUrl = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`;
    try {
        const resp = await fetchWithTimeout(isbnUrl);
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
            const resp = await fetchWithTimeout(textUrl);
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

    let info = null;
    const isbn = BOOK_ISBN_MAP[bookId];
    if (isbn) {
        info = await fetchGoogleBooks(isbn, bookId);
    }

    // Гарантированный fallback: если сеть/API не дали результата —
    // отдаём локальные данные, чтобы карточка всегда заполнялась
    if (!info) {
        console.warn(`[Books] Google Books недоступен для bookId=${bookId}, используем локальные данные`);
        info = LOCAL_BOOK_FALLBACK[bookId] || null;
    }

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
