<div align="center">

# UmenBot

Lekki i modularny bot Discord oparty o discord.js v14 — moderacja, poziomy, informacje i więcej.

[![node](https://img.shields.io/badge/node-%3E%3D18.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![license](https://img.shields.io/badge/license-ISC-blue.svg)](./LICENSE)
![status](https://img.shields.io/badge/status-ALPHA-orange)
![docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)
![version](https://img.shields.io/badge/version-v1.2.0-blue)

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

2) Utwórz plik `.env` w katalogu głównym repozytorium (patrz sekcja Konfiguracja)

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

Bot korzysta z `dotenv`. W katalogu głównym utwórz plik `.env` z kluczami:

```dotenv
TOKEN=twoj_token_bota_discord
# użyj jednego z poniższych (preferowane MONGODB_URL)
MONGODB_URL=mongodb+srv://user:pass@host/dbname
# MONGODB_URI=mongodb://localhost:27017/umenbot
```

Uwaga: W kodzie bot próbuje połączyć się używając `configs/config.js` (DatabaseURL) albo zmiennych środowiskowych `MONGODB_URL` lub `MONGODB_URI`.

---

## Uruchamianie w Dockerze

Instrukcje (Windows PowerShell):

- Zbuduj obraz:

```powershell
docker build -t umenbot:latest .
```

- Uruchom kontener (wymagany plik `.env` z `TOKEN` i `MONGODB_URL`/`MONGODB_URI`):

```powershell
docker run -d --name umenbot --env-file .env umenbot:latest
```

- Lub docker-compose:

```powershell
docker-compose up -d --build
```

Bot nie wystawia portów — łączy się wychodząco do API Discorda.

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
