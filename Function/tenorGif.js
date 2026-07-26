const DEFAULT_USER_AGENT = "UmenBot/1.0 (https://github.com/galusgaming/UmenBot)";

const REACTION_ENDPOINTS = {
  ban: ["slap", "bonk", "kick"],
  kiss: ["kiss"],
  love: ["hug", "cuddle", "blowkiss"],
};

const ANIMAL_IMAGE_ENDPOINTS = {
  dog: "dog",
  cat: "cat",
};

function buildHeaders(extraHeaders = {}) {
  return {
    "user-agent": DEFAULT_USER_AGENT,
    ...extraHeaders,
  };
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(`API zwróciło błąd ${response.status}`);
  }

  return response.json();
}

async function getAnimalImageUrl(query) {
  if (query === "frog") {
    const response = await fetch("https://loremflickr.com/640/480/frog", {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      throw new Error(`API zwróciło błąd ${response.status}`);
    }

    return response.url;
  }

  const endpoint = ANIMAL_IMAGE_ENDPOINTS[query] || query;
  const data = await fetchJson(`https://some-random-api.com/img/${encodeURIComponent(endpoint)}`);
  const imageUrl = data?.link;

  if (!imageUrl) {
    throw new Error(`Nie udało się pobrać obrazka dla zapytania: ${query}`);
  }

  return imageUrl;
}

async function getReactionGifUrl(query) {
  const candidates = REACTION_ENDPOINTS[query] || [query];

  for (const endpoint of candidates) {
    const data = await fetchJson(`https://nekos.best/api/v2/${encodeURIComponent(endpoint)}`);
    const gifUrl = data?.results?.[0]?.url;

    if (gifUrl) {
      return gifUrl;
    }
  }

  throw new Error(`Nie udało się pobrać GIFa dla zapytania: ${query}`);
}

async function getRandomGifUrl(query) {
  const normalizedQuery = String(query).trim().toLowerCase();

  if (normalizedQuery === "frog" || Object.prototype.hasOwnProperty.call(ANIMAL_IMAGE_ENDPOINTS, normalizedQuery)) {
    return getAnimalImageUrl(normalizedQuery);
  }

  return getReactionGifUrl(normalizedQuery);
}

module.exports = {
  getRandomGifUrl,
};