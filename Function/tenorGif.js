const DEFAULT_TENOR_OPTIONS = {
  locale: "en_US",
};

function extractStoreCache(html) {
  const match = html.match(/<script id="store-cache"[^>]*>([\s\S]*?)<\/script>/i);

  if (!match) {
    throw new Error("Nie udało się odczytać danych strony Tenor.");
  }

  return JSON.parse(match[1]);
}

function pickGifUrl(post) {
  return (
    post?.media_formats?.gif?.url ||
    post?.media_formats?.mediumgif?.url ||
    post?.media_formats?.tinygif?.url ||
    post?.media_formats?.webp?.url ||
    null
  );
}

async function getRandomGifUrl(query, options = {}) {
  const searchUrl = `https://tenor.com/search/${encodeURIComponent(query)}-gifs`;
  const response = await fetch(searchUrl, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "accept-language": options.Locale || DEFAULT_TENOR_OPTIONS.locale,
    },
  });

  if (!response.ok) {
    throw new Error(`Tenor zwrócił błąd ${response.status}`);
  }

  const html = await response.text();
  const storeCache = extractStoreCache(html);
  const searchBuckets = Object.values(storeCache?.universal?.search || {});
  const results = searchBuckets.flatMap((bucket) => (Array.isArray(bucket?.results) ? bucket.results : []));

  if (!results.length) {
    throw new Error(`Nie udało się pobrać GIFa dla zapytania: ${query}`);
  }

  const shuffledResults = results.sort(() => Math.random() - 0.5);

  for (const post of shuffledResults) {
    const gifUrl = pickGifUrl(post);

    if (gifUrl) {
      return gifUrl;
    }
  }

  throw new Error(`Nie udało się pobrać GIFa dla zapytania: ${query}`);
}

module.exports = {
  getRandomGifUrl,
};