// js/books.js

// Привязка bookId (0, 1, 2) к ISBN
const BOOK_ISBN_MAP = {
    0: "9785040904600",   // char1 — Пустая могила
    1: "9785041194437",   // char2 — Полночь в кафе "Черный дрозд"
    2: "9785170903320",   // char3 — Гордость и предубеждение
};

// Резервные запросы на случай, если поиск по ISBN не дал результатов
const FALLBACK_QUERIES = {
    0: "Пустая могила Джонатан Страуд",
    1: "Полночь в кафе Черный дрозд Хэзер Уэббер",
    2: "Гордость и предубеждение Джейн Остин"
};

// Локальные данные — гарантированный fallback, если сеть недоступна
const LOCAL_BOOK_FALLBACK = {
    0: {
        title: "Пустая могила",
        authors: ["Джонатан Страуд"],
        publishedDate: "2018",
        publisher: "Дом историй",
        pageCount: 480,
        averageRating: 4.5,
        categories: ["Фэнтези", "Мистика", "Детектив", "Young Adult"]
    },
    1: {
        title: "Полночь в кафе \"Черный дрозд\"",
        authors: ["Хэзер Уэббер"],
        publishedDate: "2021",
        publisher: "Inspiria",
        pageCount: 384,
        averageRating: 4.3,
        categories: ["Магический реализм", "Уютное фэнтези", "Современная проза"]
    },
    2: {
        title: "Гордость и предубеждение",
        authors: ["Джейн Остин"],
        publishedDate: "1813",
        publisher: "АСТ",
        pageCount: 384,
        averageRating: 4.7,
        categories: ["Классическая литература", "Английская классика", "Роман"]
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
        similar_books: ["Тень ветра", "Зимнее блюдо", "Амулет Самарканда"]
    },
    1: {
        mood_query: "уютный инди фолк акустика осенний вечер кофейня",
        similar_books: ["Смерть на Ниле", "Убийство в библиотеке", "Затерянный книжный"]
    },
    2: {
        mood_query: "английская классика фортепиано романтика XIX век струнные",
        similar_books: ["Доводы рассудка", "Джейн Эйр", "Незнакомка из Уайлдфелл-Холла"]
    },
};
