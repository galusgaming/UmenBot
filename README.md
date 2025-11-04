# UmenBot

### Projekt bota na discord.js v14

Obecnie jest w fazie rozwoju i powstawania **_korzystasz na własną odpowiedzialność_**



# [Change Log](CHANGELOG.md)


> > # **TODO LIST**
>
> ---
>
> 1.  ~~Unban~~
> 2.  [Warn system]()
> 3.  ~~Tickets system~~
> 4.  commands to have fun
>
> ---
>
> ## COMING SOON
---

## Docker

Instrukcje, jak zbudować i uruchomić bota w Dockerze (Windows PowerShell):

- Zbuduj obraz:

```powershell
docker build -t umenbot:latest .
```

- Uruchom kontener (upewnij się, że masz plik `.env` z `TOKEN` i `MONGODB_URL`):

```powershell
docker run -d --name umenbot --env-file .env umenbot:latest
```

- Lub użyj docker-compose:

```powershell
docker-compose up -d --build
```

Uwaga: Bot nie otwiera portów (łączy się wychodząco z Discordem). Upewnij się, że plik `.env` zawiera poprawne wartości `TOKEN` i `MONGODB_URL`.
