// js/quotes.js

// Привязка bookId к URL страницы с цитатами
const CITATY_URL_MAP = {
    0: "https://citaty.info/book/mihail-bulgakov/master-i-margarita/short",
    1: "https://citaty.info/book/dzhordzh-oruell/1984/short",
    2: "https://citaty.info/book/harper-li/ubit-peresmeshnika",
};

const quotesCache = {};

// CORS-прокси (corsproxy.io)
// ВАЖНО: для production рекомендуется зарегистрировать API-ключ и добавить домен
// в панели corsproxy.io, либо развернуть собственный Cloudflare Worker
function proxify(url) {
    return `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
}

async function fetchQuotesFromCitaty(bookId) {
    const targetUrl = CITATY_URL_MAP[bookId];
    if (!targetUrl) return [];

    try {
        const resp = await fetch(proxify(targetUrl), {
            headers: { "Accept-Language": "ru-RU,ru;q=0.9" }
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();

        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Селекторы citaty.info (могут требовать обновления при изменении структуры сайта)
        const blocks = doc.querySelectorAll("div.quote, div.views-row");
        const quotes = [];
        blocks.forEach(block => {
            const textEl = block.querySelector(
                ".quote-text, .field-name-field-quote, .views-field-field-quote-text, .text"
            );
            if (textEl) {
                const text = textEl.textContent.trim();
                if (text.length > 20) quotes.push(text);
            }
        });

        return [...new Set(quotes)]; // дедупликация
    } catch (e) {
        console.error("[Citaty] Ошибка парсинга:", e);
        return [];
    }
}

async function getRandomQuote(bookId) {
    if (!quotesCache[bookId]) {
        quotesCache[bookId] = await fetchQuotesFromCitaty(bookId);
    }
    const quotes = quotesCache[bookId];
    if (quotes.length === 0) return "Цитаты не найдены (проверьте селекторы парсера)";
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function refreshQuote(bookId) {
    const quotes = quotesCache[bookId];
    if (!quotes || quotes.length === 0) return null;
    return quotes[Math.floor(Math.random() * quotes.length)];
}