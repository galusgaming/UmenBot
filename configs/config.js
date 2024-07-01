require("dotenv").config();

module.exports = {
  token: process.env.TOKEN,
  prefix: "?",
  botAuthor: "<@465932200123301928>",
  botVersion: "0.1v ALPHA",
  description:
    "Nowy bot stworzony przez GalusGaming'a, który ma za zadanie ułatwić życie na serwerze.Bedzie posiadać różne funkcje od administracyjnych po te do zabawy.\n Bot jest w fazie ALPHA, więc mogą występować błędy. W razie problemów proszę o kontakt ze mną",
  DatabaseURL: process.env.MONGODB_URL,
};
