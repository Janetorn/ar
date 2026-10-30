// js/app.js

// ========== Закладки (localStorage) ==========
const BOOKMARKS_KEY = "ar_library_bookmarks";

function loadBookmarks() {
    try {
        return JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveBookmark(title, isbn) {
    const bookmarks = loadBookmarks();
    if (bookmarks.some(b => b.isbn === isbn)) {
        showToast("Уже в закладках");
        return;
    }
    bookmarks.push({ title, isbn, time: new Date().toISOString() });
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    showToast(`Закладка добавлена: ${title}`);
}

function showBookmarksList() {
    const bookmarks = loadBookmarks();
    if (bookmarks.length === 0) {
        showToast("Закладок нет");
        return;
    }
    const list = bookmarks.map((b, i) => `${i + 1}. ${b.title} (ISBN: ${b.isbn})`).join("\n");
    alert("=== ЗАКЛАДКИ ===\n" + list);
}

// ========== Уведомления ==========
function showToast(msg) {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.classList.remove("hidden");
    setTimeout(() => toast.classList.add("hidden"), 2500);
}

// ========== Состояние карточки ==========
let currentBookId = null;
let currentBookInfo = null;
let currentIsbn = null;

function showCard(bookId, bookInfo, quoteText) {
    currentBookId = bookId;
    currentBookInfo = bookInfo;
    currentIsbn = BOOK_ISBN_MAP[bookId];

    document.getElementById("card-title").textContent = bookInfo?.title || "Без названия";
    document.getElementById("card-authors").textContent =
        bookInfo?.authors?.join(", ") || "Автор не указан";

    const year = bookInfo?.publishedDate?.substring(0, 4) || "—";
    document.getElementById("card-passport").textContent =
        `${year} | ${bookInfo?.publisher || "—"} | ${bookInfo?.pageCount || "—"} стр.`;
    document.getElementById("card-isbn").textContent = `ISBN: ${currentIsbn}`;
    document.getElementById("card-rating").textContent =
        bookInfo?.averageRating
            ? `Рейтинг: ${bookInfo.averageRating.toFixed(1)}/5`
            : "Рейтинг: нет данных";
    document.getElementById("card-genre").textContent =
        bookInfo?.categories?.slice(0, 3).join(", ") || "Жанр: —";
    document.getElementById("card-quote").textContent = quoteText;

    const similar = LOCAL_DATA[bookId]?.similar_books || [];
    document.getElementById("card-similar").innerHTML =
        similar.map(s => `<li>${s}</li>`).join("");

    document.getElementById("book-card").classList.remove("hidden");
}

function hideCard() {
    document.getElementById("book-card").classList.add("hidden");
    currentBookId = null;
    currentBookInfo = null;
    currentIsbn = null;
}

// ========== AR-события: три кастомных маркера ==========

// Привязка DOM-id маркера → bookId (индекс в BOOK_ISBN_MAP / LOCAL_DATA / CITATY_URL_MAP)
const MARKER_BOOK_MAP = {
    "marker-char1": 0,   // pattern-char1.patt → книга №0
    "marker-char2": 1,   // pattern-char2.patt → книга №1
    "marker-char3": 2,   // pattern-char3.patt → книга №2
};

function bindMarker(markerEl, bookId) {
    if (!markerEl) {
        console.warn(`[AR] Маркер для bookId=${bookId} не найден в DOM`);
        return;
    }

    markerEl.addEventListener("markerFound", async () => {
        console.log(`[AR] Обнаружен маркер: ${markerEl.id} (bookId=${bookId})`);

        const bookInfo = await getBookInfo(bookId);
        const quote = await getRandomQuote(bookId);

        showCard(bookId, bookInfo, quote);
    });

    markerEl.addEventListener("markerLost", () => {
        console.log(`[AR] Маркер потерян: ${markerEl.id}`);
        // Скрываем карточку только если потерян именно текущий маркер
        if (currentBookId === bookId) {
            hideCard();
        }
    });
}

// Навешиваем обработчики на все три маркера
bindMarker(document.getElementById("marker-char1"), MARKER_BOOK_MAP["marker-char1"]);
bindMarker(document.getElementById("marker-char2"), MARKER_BOOK_MAP["marker-char2"]);
bindMarker(document.getElementById("marker-char3"), MARKER_BOOK_MAP["marker-char3"]);

// ========== Обработка кнопок ==========
document.getElementById("close-card").addEventListener("click", hideCard);

document.getElementById("btn-music").addEventListener("click", () => {
    if (currentBookId === null) return;
    const query = LOCAL_DATA[currentBookId]?.mood_query;
    if (!query) {
        showToast("Запрос настроения не задан");
        return;
    }
    const url = `https://music.yandex.ru/search?text=${encodeURIComponent(query)}`;
    window.open(url, "_blank");
});

document.getElementById("btn-new-quote").addEventListener("click", () => {
    if (currentBookId === null) return;
    const newQuote = refreshQuote(currentBookId);
    if (newQuote) {
        document.getElementById("card-quote").textContent = newQuote;
    } else {
        showToast("Нет доступных цитат");
    }
});

document.getElementById("btn-bookmark").addEventListener("click", () => {
    if (!currentBookInfo || !currentIsbn) return;
    saveBookmark(currentBookInfo.title || "Неизвестно", currentIsbn);
});

document.getElementById("btn-show-bookmarks").addEventListener("click", showBookmarksList);