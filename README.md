<div align="center">

# UmenBot

Lekki i modularny bot Discord oparty o discord.js v14 — moderacja, poziomy, informacje i więcej.

[![node](https://img.shields.io/badge/node-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![license](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
![status](https://img.shields.io/badge/status-ALPHA-orange)
![docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![version](https://img.shields.io/badge/version-v1.3.0-blue)

</div>

---

## Spis treści

- Wprowadzenie
- Wymagania
- Szybki start (Windows PowerShell)
- Konfiguracja (.env)
- Uruchamianie w Dockerze
- Komendy (przegląd)
- Taryfikator ostrzeżeń (jak działa)
- Struktura projektu
- Rozwiązywanie problemów (FAQ)
- Change Log i licencja

---

## Wprowadzenie

UmenBot to bot dla Discorda (discord.js v14) skupiony na prostocie i czytelnej strukturze. Zawiera m.in.: system ostrzeżeń z taryfikatorem (automatyczne akcje kick/ban/timeout), podstawowe komendy moderacji, komendy publiczne oraz integrację z MongoDB.

Projekt jest w fazie ALPHA — mogą występować błędy. Używasz na własną odpowiedzialność.

Autor: GalusGaming (Discord: `galusgaming4096`)

---

## Wymagania

- Node.js 18+
- Konto bota Discord z włączonymi intentami (MESSAGE CONTENT jeśli potrzebny)
- Dostępne połączenie do MongoDB (Atlas lub własny serwer)

---

## Szybki start (Windows PowerShell)

1) Zainstaluj zależności

```powershell
npm install
```

2) Skopiuj `.env.example` do `.env` i uzupełnij wartości

3) Uruchom bota (dev):

```powershell
node index.js
```

Jeśli używasz nodemon:

```powershell
nodemon ./index.js
```

---

## Konfiguracja (.env)

Bot korzysta z `dotenv`. W katalogu głównym przygotuj plik `.env` na bazie `.env.example`:

```dotenv
TOKEN=twoj_token_bota_discord
MONGODB_URL=mongodb+srv://user:pass@host/dbname
# albo:
# MONGODB_URI=mongodb://localhost:27017/umenbot

# Panel WWW (Discord OAuth2)
SESSION_SECRET=silny_losowy_ciag
PANEL_PORT=3000
DISCORD_CLIENT_ID=ID_twojej_aplikacji_Discord
DISCORD_CLIENT_SECRET=Sekret_twojej_aplikacji_Discord
DISCORD_CALLBACK_URL=http://localhost:3000/auth/callback
```

Uwaga: W kodzie bot próbuje połączyć się używając `configs/config.js` (DatabaseURL) albo zmiennych środowiskowych `MONGODB_URL` lub `MONGODB_URI`. Komendy GIF korzystają teraz z publicznej strony wyszukiwania Tenora, więc nie wymagają już `TENOR_API_KEY`.

---

## Uruchamianie w Dockerze

Instrukcje (Windows PowerShell):

- Zbuduj obraz:

```powershell
docker build -t umenbot:latest .
```

- Uruchom kontener (wymagany plik `.env` z `TOKEN`, `TENOR_API_KEY` i `MONGODB_URL`/`MONGODB_URI`):

```powershell
docker run -d --name umenbot --env-file .env umenbot:latest
```

- Lub docker-compose:

```powershell
docker-compose up -d --build
```

Bot nie wystawia portów — łączy się wychodząco do API Discorda.

---

## Panel WWW (OAuth2 + React) — konfiguracja XP, role-rewards, blacklisty

Panel jest wbudowany (Express + Discord OAuth2). Działa obok bota w tym samym procesie.

1) Skonfiguruj aplikację na https://discord.com/developers/applications
	- Utwórz OAuth2 Redirect: `http://localhost:3000/auth/callback` (albo Twój publiczny adres HTTPS)
	- Skopiuj `CLIENT ID` i `CLIENT SECRET` do `.env`
	- Zakresy wymagane: `identify`, `guilds`
2) Uzupełnij zmienne w `.env` (zobacz wyżej). Upewnij się, że `PANEL_PORT` i `DISCORD_CALLBACK_URL` są spójne.
3) Uruchom bota: panel będzie na `http://localhost:3000` (domyślnie)
4) Zaloguj się i wybierz serwer, na którym jest bot. Wymagane uprawnienie: właściciel serwera lub `Zarządzanie serwerem`.

W panelu ustawisz:
- XP rate: mnożnik XP (np. 1.0, 1.5, 2.0)
- Role-rewards: listę ról przyznawanych po osiągnięciu poziomu (poziom -> ID roli)
- Blacklisty: ID kanałów/użytkowników/ról, dla których nie będzie naliczany XP ani przyjmowane komendy XP
 - Blacklisty: ID kanałów/użytkowników/ról, dla których nie będzie naliczany XP

Uwaga: Bot wykorzystuje MongoDB do przechowywania ustawień (`Schemas/settings.js`). Zmiany obowiązują zwykle w ciągu kilkudziesięciu sekund (lekki cache) lub od razu po zapisaniu.

---

### Tryb deweloperski (React + Vite)

Panel to SPA w `web/client` (Vite). Podczas developmentu możesz odpalić serwer API (3000) oraz dev serwer Vite (5173) z proxy:

1) Uruchom backend (w pierwszym terminalu):

```powershell
npm start
```

2) Uruchom frontend (w drugim terminalu):

```powershell
cd web/client
npm install
npm run dev
```

Otwórz adres pokazany przez Vite (domyślnie `http://localhost:5173`). Proxy przekieruje `/api`, `/login`, `/logout`, `/auth` do backendu na porcie 3000.

### Produkcja (Docker)

Obraz Dockera buduje front automatcznie (Vite build) i serwuje go z Expressa pod portem 3000:

```powershell
docker-compose up -d --build
```

Panel będzie dostępny na `http://localhost:3000`.

---

## Komendy (przegląd)

### Publiczne
- `/ping` — sprawdza opóźnienie
- `/help` — lista komend i pomoc
- `/info` — informacje o bocie/serwerze
- `/level` — poziomy użytkownika (jeśli skonfigurowane)

### Moderacja
- `/warn user reason` — nadaje ostrzeżenie, sprawdza taryfikator i w razie progu wykonuje akcję (timeout/kick/ban)
- `/pardon user amount [reason]` — usuwa wskazaną liczbę ostrzeżeń (nie schodzi poniżej 0)
- `/ban user reason` — banuje użytkownika
- `/unban user_id [reason]` — odbanowuje użytkownika
- `/clear amount` — czyści wiadomości

### Taryfikator ostrzeżeń
- `/taryfikator dodaj warns:<n> action:<none|timeout|kick|ban> [meta:<czas>]`
- `/taryfikator usun warns:<n>`
- `/taryfikator lista`

### Developer
- `/reload` — przeładowuje komendy/zdarzenia (jeśli włączone)

---

## Taryfikator ostrzeżeń — jak działa

Taryfikator to zestaw progów. Dla danego serwera definiujesz: przy ilu ostrzeżeniach wykonać jaką akcję.

- Przykład:
	- `3 -> timeout 1h`
	- `5 -> ban`

Jeśli użytkownik osiąga 4 ostrzeżenia, zadziała reguła z najwyższym progiem mniejszym lub równym (czyli 3 ⇒ timeout 1h). Przy 5 i więcej — ban.

Pole `meta` (opcjonalne) służy do przekazania dodatkowej informacji (np. czasu dla timeout). Obsługiwane formaty czasu: `30s`, `10m`, `1h`, `2d`.

Szybkie przykłady:
- `/taryfikator dodaj warns:3 action:timeout meta:1h`
- `/taryfikator dodaj warns:5 action:ban`
- `/warn user:@User reason:Naruszenie regulaminu`
- `/pardon user:@User amount:2 reason:Odwołanie przyjęte`

---

## Struktura projektu (skrót)

```
Commands/
	Public/            # ping, help, info, level
	Moderation/        # warn, pardon, ban, unban, clear, taryfikator(...)
configs/
	config.js          # konfiguracja + dotenv (TOKEN, MONGODB_URL)
Events/
	...                # rejestracja zdarzeń, XP itd.
Schemas/
	warn.js            # liczniki ostrzeżeń użytkowników (per guild)
	setWarn.js         # reguły taryfikatora (per guild)
handlers/            # ładowanie komend/zdarzeń
```

---

## Rozwiązywanie problemów (FAQ)

- Komendy slash nie pojawiają się:
	- Upewnij się, że bot ma uprawnienia i poprawnie rejestruje komendy. Zrestartuj bota lub użyj `/reload`.
- Błąd połączenia z MongoDB:
	- Sprawdź zmienne `.env` (`MONGODB_URL` lub `MONGODB_URI`) i dostęp sieciowy.
- Timeout nie działa:
	- Sprawdź, czy reguła ma poprawne `meta` (np. `10m`) i czy bot ma uprawnienia do timeoutów.

---

## Change Log i licencja

- Zmiany: zobacz [CHANGELOG.md](CHANGELOG.md)
- Licencja: ISC

---

Miłego korzystania! Jeśli masz pomysł na funkcję albo znalazłeś błąd — utwórz zgłoszenie (Issue) lub PR.
