const DEFAULT_TENOR_OPTIONS = {
  filter: "off",
  locale: "en_US",
  mediaFilter: "gif",
};

async function getRandomGifUrl(query, options = {}) {
  const apiKey = process.env.TENOR_API_KEY;

  if (!apiKey) {
    throw new Error("Brakuje zmiennej TENOR_API_KEY w pliku .env");
  }

  const searchParams = new URLSearchParams({
    key: apiKey,
    q: query,
    limit: "1",
    random: "true",
    contentfilter: options.Filter || DEFAULT_TENOR_OPTIONS.filter,
    locale: options.Locale || DEFAULT_TENOR_OPTIONS.locale,
    media_filter: options.MediaFilter || DEFAULT_TENOR_OPTIONS.mediaFilter,
  });

  const response = await fetch(`https://tenor.googleapis.com/v2/search?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Tenor API zwróciło błąd ${response.status}`);
  }

  const data = await response.json();
  const post = data?.results?.[0];
  const gifUrl = post?.media_formats?.gif?.url;

  if (!gifUrl) {
    throw new Error(`Nie udało się pobrać GIFa dla zapytania: ${query}`);
  }

  return gifUrl;
}

module.exports = {
  getRandomGifUrl,
};