const { client } = require("tenorjs");

const DEFAULT_TENOR_OPTIONS = {
  Filter: "off",
  Locale: "en_US",
  MediaFilter: "minimal",
  DateFormat: "D/MM/YYYY - H:mm:ss A",
};

function getTenorClient(options = {}) {
  const apiKey = process.env.TENOR_API_KEY;

  if (!apiKey) {
    throw new Error("Brakuje zmiennej TENOR_API_KEY w pliku .env");
  }

  return client({
    Key: apiKey,
    ...DEFAULT_TENOR_OPTIONS,
    ...options,
  });
}

async function getRandomGifUrl(query, options = {}) {
  const tenor = getTenorClient(options);
  const results = await tenor.Search.Random(query, "1");
  const post = Array.isArray(results) ? results[0] : results?.[0];
  const gifUrl = post?.media_formats?.gif?.url;

  if (!gifUrl) {
    throw new Error(`Nie udało się pobrać GIFa dla zapytania: ${query}`);
  }

  return gifUrl;
}

module.exports = {
  getRandomGifUrl,
};