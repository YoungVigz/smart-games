# Smart Games

Platforma z grami logicznymi. Aktualnie dostępne jest Sudoku w trybie jednoosobowym oraz w trybie PvP (pojedynki w czasie rzeczywistym), wraz z systemem kont, poziomów (XP) i rankingiem.

## Stos technologiczny

| Warstwa     | Technologie                                              |
| ----------- | -------------------------------------------------------- |
| Frontend    | Next.js 16, React 19, Tailwind CSS 4, Socket.IO Client   |
| Backend     | NestJS 11, Prisma 7, Socket.IO, JWT, OpenAPI (Scalar)    |
| Dane        | PostgreSQL 16, Redis 7                                   |
| Środowisko  | Docker Compose, pnpm 9, Node.js 22                       |

## Struktura repozytorium

```
smart-games/
  docker-compose.yml     orkiestracja usług
  .env.example           wzór konfiguracji
  smart-games-api/       backend (NestJS)
  smart-games-front/     frontend (Next.js)
```

## Wymagania

- Docker oraz Docker Compose v2
- Opcjonalnie, do pracy bez Dockera: Node.js 22 i pnpm 9

## Szybki start

1. Utwórz plik konfiguracyjny i uzupełnij wartości (w szczególności hasła oraz `JWT_ACCESS_SECRET`):

   ```bash
   cp .env.example .env
   ```

2. Uruchom całość w trybie deweloperskim z synchronizacją zmian w kodzie:

   ```bash
   docker compose up --build --watch
   ```

3. Zastosuj schemat bazy danych (przy pierwszym uruchomieniu):

   ```bash
   docker compose exec api pnpm prisma migrate dev
   ```

## Adresy usług

| Usługa          | Adres                      |
| --------------- | -------------------------- |
| Frontend        | http://localhost:3001      |
| API             | http://localhost:3000      |
| Dokumentacja API| http://localhost:3000/docs |
| pgAdmin         | http://localhost:5050      |
| Redis Insight   | http://localhost:5540      |
| PostgreSQL      | localhost:5432             |
| Redis           | localhost:6379             |

## Konfiguracja

Wszystkie zmienne środowiskowe opisane są w pliku `.env.example`. Wymagane do startu: dane bazy PostgreSQL, `FRONT_URL`, `JWT_ACCESS_SECRET` oraz dane logowania do pgAdmin.

## Dokumentacja szczegółowa

- Backend: [smart-games-api/README.md](smart-games-api/README.md)

## Przydatne polecenia

```bash
docker compose down            # zatrzymanie usług
docker compose down -v         # zatrzymanie wraz z usunięciem danych (bazy, pgAdmin, Redis Insight)
docker compose logs -f api     # logi backendu
```
