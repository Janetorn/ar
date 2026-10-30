const CACHE_NAME = "ar-library-v1";
const ASSETS = [
    "./",
    "./index.html",
    "./css/style.css",
    "./js/app.js",
    "./js/books.js",
    "./js/quotes.js",
    "./manifest.json",
    // Три кастомных маркера — обязательно кэшировать для офлайн-режима PWA
    "./markers/pattern-char1.patt",
    "./markers/pattern-char2.patt",
    "./markers/pattern-char3.patt",
];

self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener("fetch", (e) => {
    e.respondWith(
        caches.match(e.request).then(cached => cached || fetch(e.request))
    );
});