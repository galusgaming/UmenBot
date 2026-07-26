const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_BASE_URL = "https://api.giphy.com/v1/gifs/search";

// Mapowanie komend bota na zapytania wysyłane do Giphy
const QUERY_MAP = {
  cat: "cat",
  dog: "dog",
  frog: "frog",
  kiss: "anime kiss",
  love: "anime hug",
};

function toGiphyLang(locale) {
  if (!locale) return "en";
  return String(locale).split(/[_-]/)[0].toLowerCase();
}

function toGiphyRating(filter) {
  const map = { low: "g", medium: "pg", high: "pg-13" };
  return map[String(filter || "medium").toLowerCase()] || "pg";
}

/**
 * @param {string} query klucz komendy (np. "cat", "kiss")
 * @param {{ Locale?: string, Filter?: string }} [options]
 */
async function getRandomGifUrl(query, options = {}) {
  if (!GIPHY_API_KEY) {
    throw new Error("Brak GIPHY_API_KEY w zmiennych środowiskowych.");
  }

  const normalizedQuery = String(query).trim().toLowerCase();
  const searchTerm = QUERY_MAP[normalizedQuery] || normalizedQuery;

  const params = new URLSearchParams({
    api_key: GIPHY_API_KEY,
    q: searchTerm,
    limit: "25",
    rating: toGiphyRating(options.Filter),
    lang: toGiphyLang(options.Locale),
  });

  const response = await fetch(`${GIPHY_BASE_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Giphy API zwróciło błąd ${response.status}`);
  }

  const data = await response.json();
  const results = data?.data ?? [];

  if (results.length === 0) {
    throw new Error(`Brak wyników GIF dla zapytania: ${normalizedQuery}`);
  }

  const randomResult = results[Math.floor(Math.random() * results.length)];
  const gifUrl =
    randomResult?.images?.original?.url ||
    randomResult?.images?.downsized?.url;

  if (!gifUrl) {
    throw new Error(`Nie udało się odczytać adresu GIFa dla zapytania: ${normalizedQuery}`);
  }

  return gifUrl;
}

module.exports = {
  getRandomGifUrl,
};