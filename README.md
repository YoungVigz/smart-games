# Smart Games

Platforma z grami logicznymi. Aktualnie dostępne jest Sudoku w trybie jednoosobowym oraz w trybie PvP (pojedynki w czasie rzeczywistym), wraz z systemem kont, poziomów (XP) i rankingiem.

## Stos technologiczny

| Warstwa    | Technologie                                            |
| ---------- | ------------------------------------------------------ |
| Frontend   | Next.js 16, React 19, Tailwind CSS 4, Socket.IO Client |
| Backend    | NestJS 11, Prisma 7, Socket.IO, JWT, OpenAPI (Scalar)  |
| Dane       | PostgreSQL 16, Redis 7                                 |
| Środowisko | Docker Compose, pnpm 10.30.3, Node.js 22               |

## Struktura repozytorium

```
smart-games/
  docker-compose.yml     orkiestracja usług
  env.example           wzór konfiguracji
  apps/smart-games-api/       backend (NestJS)
  apps/smart-games-front/     frontend (Next.js)
  packages/                  pusty katalog na przysz?e pakiety
```

## Wymagania

- Docker oraz Docker Compose v2
- Opcjonalnie, do pracy bez Dockera: Node.js 22 i pnpm 10.30.3

## Szybki start

1. Utwórz plik konfiguracyjny i uzupełnij wartości (w szczególności hasła oraz `JWT_ACCESS_SECRET`):

    ```bash
    cp env.example .env
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

| Usługa           | Adres                      |
| ---------------- | -------------------------- |
| Frontend         | http://localhost:3001      |
| API              | http://localhost:3000      |
| Dokumentacja API | http://localhost:3000/docs |
| pgAdmin          | http://localhost:5050      |
| Redis Insight    | http://localhost:5540      |
| PostgreSQL       | localhost:5432             |
| Redis            | localhost:6379             |

## Konfiguracja

Wszystkie zmienne środowiskowe opisane są w pliku `env.example`. Wymagane do startu: dane bazy PostgreSQL, `FRONT_URL`, `JWT_ACCESS_SECRET` oraz dane logowania do pgAdmin.

## Dokumentacja szczegółowa

- Backend: [apps/smart-games-api/README.md](apps/smart-games-api/README.md)

## Przydatne polecenia

```bash
docker compose down            # zatrzymanie usług
docker compose down -v         # zatrzymanie wraz z usunięciem danych (bazy, pgAdmin, Redis Insight)
docker compose logs -f api     # logi backendu
```

## pnpm workspace

Aplikacje znajduj? si? w `apps/smart-games-api` i `apps/smart-games-front`.
Katalog `packages/` jest na razie pusty (`.gitkeep` zachowuje go w Git).

Z katalogu g??wnego:

```bash
pnpm install
pnpm dev:api
# w drugim terminalu:
pnpm dev:front
```

Na tym etapie ka?da aplikacja zachowuje sw?j `pnpm-lock.yaml`
(`sharedWorkspaceLockfile: false`), aby nie przebudowywa? jeszcze konfiguracji Dockera.
Nie dodajemy wsp?lnych pakiet?w ani zale?no?ci mi?dzy aplikacjami.

## Nx

Nx jest zainstalowany w katalogu g??wnym i korzysta z istniej?cych skrypt?w aplikacji.

```bash
pnpm exec nx show projects
pnpm exec nx run smart-games-front:build
pnpm exec nx run smart-games-api:build
```

## Lint i formatowanie

Wsp?lny Prettier korzysta z konfiguracji w katalogu g??wnym. ESLint ma wsp?ln? baz?
oraz osobne regu?y Next.js i backendu. Wymagane jest `pnpm install` z root.

- `pnpm lint` ? sprawdza root i obie aplikacje przez Nx, bez zapisywania poprawek.
- `pnpm lint:fix` ? stosuje automatyczne poprawki ESLinta.
- `pnpm format:check` ? sprawdza formatowanie ca?ego repo.
- `pnpm format` ? formatuje ca?e repo; mo?e zmieni? wiele istniej?cych plik?w.

W VS Code zainstaluj rekomendowane rozszerzenia ESLint i Prettier. Otw?rz g??wny
katalog repozytorium. Ustawienia workspace w??czaj? Prettiera przy zapisie oraz
automatyczne poprawki ESLinta przy r?cznym zapisie. Po instalacji rozszerze? u?yj
`Developer: Reload Window`. Konfiguracja nie w??cza automatycznego zapisywania plik?w.

Wygenerowany klient Prisma, buildy, cache i lockfile'y s? pomijane przez formatter.
Istniej?ce b??dy lintowania i r??nice formatowania wymagaj? osobnych poprawek;
wdro?enie konfiguracji nie formatuje automatycznie ca?ej aplikacji.
