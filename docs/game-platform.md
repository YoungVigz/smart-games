# Gry, XP i statystyki

## Podział odpowiedzialności

- `@smart-games/game-engine`: wspólne typy, katalog gier i trybów, poziomy trudności. Subpath `/sudoku` zawiera generator, solver, walidację oraz tworzenie planszy. Typ `Board<TCell>` jest ogólny; reguły komórek Sudoku pozostają właściwe dla Sudoku.
- `@smart-games/xp`: czyste obliczenia nagród i poziomów. Front importuje `XpEngine.getLevelProgress(rawXp)`, backend `calculateReward(...)`. Backend sam ustala wynik, liczbę błędów, tryb i trudność. Żądania klienta nie określają nagrody.
- Moduł API `games`: rozliczanie zakończonych gier, historia i agregacje. Moduły poszczególnych gier odpowiadają za przebieg i walidację rozgrywki.

Nie zmieniono auth ani strategii kolejki PvP. XP mierzy postęp konta. Przyszła ocena umiejętności powinna być osobnym modelem według gry/trybu; nie należy wyliczać jej bezpośrednio z XP.

## Rozliczenie i dane historyczne

`GameSession` opisuje jedną zakończoną rozgrywkę. `GameParticipant` zapisuje wynik każdego uczestnika, błędy, czas gry, faktycznie przyznane XP i wersję reguł nagrody. Solo ma jednego uczestnika, PvP dwóch. Czas sesji PvP nie jest sumą czasów jej uczestników: do statystyk gracza używamy jego `timeElapsed`.

Identyfikator rozgrywki powstaje przed pierwszym ruchem. Zapis wyniku, uczestników, aktualizacja salda XP oraz kompatybilny zapis solo w `SudokuGame` są jedną transakcją. Unikalny identyfikator sesji zapobiega powtórnemu naliczeniu XP także przy równoczesnych żądaniach. Przy ponowieniu zwracany jest zapisany wynik, a nie wynik przeliczony według nowych zasad. Redis blokuje równoległe mutacje jednej gry; blokada wygasa po 60 sekundach. Zdarzenie aktualizacji rankingu następuje po zatwierdzeniu transakcji i jest ponawiane przy ponowieniu rozliczenia.

Aktywne plansze pozostają w Redisie. Statystyki obejmują gry zakończone rozwiązaniem lub poddaniem, a dla PvP zwycięstwem lub dyskwalifikacją przeciwnika. Wygaśnięcie aktywnej gry w Redisie i rozłączenie gracza nie tworzą obecnie wyniku. Nie jest to jeszcze kompletny zapis do badań: nie zapisujemy kolejki, strategii dopasowania, zdarzeń każdego ruchu, porzuceń ani stanu symulacji.

Migracja przenosi zakończone starsze gry solo do nowej historii bez zmiany salda użytkownika. Stare nagrody mają `xpGained: null` i `rewardVersion: null`, bo nie były zapisywane. `recordedXp` sumuje tylko znane nagrody; `gamesWithRecordedXp` pozwala ocenić kompletność danych. Początek starej gry jest przybliżony na podstawie czasu aktywnej gry i daty zapisu. Historycznych meczów PvP nie da się odtworzyć z dotychczasowego schematu.

Aktualna polityka zachowuje solo: 100/250/500 XP, kara 10% za błąd, minimum 30% nagrody. PvP stosuje tę samą bazę za wygraną i zero za przegraną; ma oddzielną wersję polityki. To początkowe wartości do strojenia. Przy zmianie zasad zmień również `version`. Front tylko prezentuje zatwierdzone saldo; biblioteka nie stanowi zabezpieczenia przed manipulacją klientem.

## API

Wszystkie poniższe endpointy korzystają z istniejącego guarda i dotyczą zalogowanego gracza:

- `GET /games/catalog`: gry, tryby, trudności i liczba uczestników.
- `GET /games/:sessionId`: szczegóły wyniku konkretnej rozgrywki oraz wyniki i publiczne dane jej uczestników. Dostęp ma uczestnik tej rozgrywki.
- `GET /games/history?gameKey=sudoku&modeKey=pvp&difficulty=medium&limit=25&before=<sessionId>`: wyniki uczestnika wraz z sesją i wynikami przeciwników. `before` jest identyfikatorem ostatniej sesji z poprzedniej strony; limit 1–100.
- `GET /games/statistics?gameKey=sudoku&modeKey=solo&difficulty=hard`: liczba gier i wygranych, czas gry w sekundach, błędy, znane nagrody XP i podział według wyniku (liczby, sumy, średnie). Pominięcie filtrów daje statystyki ogólne.

Dotychczasowe `/sudoku/statistics` i dane profilu nadal działają i zachowują dotychczasowy zakres solo. Nowe ekrany obejmujące wszystkie gry powinny używać `/games/*`.

## Dodawanie gry lub trybu

1. Dodaj definicję gry/trybu do `GAME_CATALOG` w `game-engine`.
2. Dodaj odpowiedni silnik gry, typy i testy; frontend i backend importują te same kontrakty.
3. Zarejestruj politykę `gameKey/modeKey` i jej wersję w `REWARD_POLICIES` w pakiecie `xp`.
4. W module API sprawdzaj ruchy i wywołaj `GamesService.finalize` z trwałym identyfikatorem oraz wynikami wszystkich uczestników. Nie przyjmuj wyniku/XP od klienta.
5. Dodaj UI trybu. Historia i statystyki korzystają ze wspólnego modelu; nie wymagają nowej tabeli dla każdego trybu. Dane właściwe dla konkretnej gry można rozszerzać osobno.

## Uruchomienie i migracja

Z katalogu głównego: `pnpm install`. Skrypty build/dev/start aplikacji budują wspólne pakiety w kolejności zależności. Po zmianach bibliotek podczas lokalnego developmentu uruchom `pnpm --filter @smart-games/xp... run build` i zrestartuj proces aplikacji, jeśli nie przeładuje zależności. Docker Compose buduje aplikacje z kontekstu całego monorepo; watch przebudowuje kontenery po zmianach bibliotek.

Polecenia bazy wykonuj w `apps/smart-games-api` (w Dockerze przez `docker compose exec api`). Nowa, pusta baza:

```sh
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Repozytorium wcześniej nie zawierało migracji. Dla istniejącej bazy, która odpowiada dotychczasowemu schematowi `User`, `UserSession`, `SudokuGame`, po wykonaniu kopii danych oznacz początkową migrację jako już zastosowaną, a następnie zastosuj rozszerzenie:

```sh
pnpm exec prisma migrate resolve --applied 20261115000000_baseline
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

Nie uruchamiaj początkowej migracji tworzącej tabele na bazie już zawierającej te tabele. Jeżeli baza ma własną historię migracji lub różni się od schematu początkowego, najpierw uzgodnij jej stan. Zmiany w repo nie wykonują automatycznie migracji Twojej bazy.

## Weryfikacja

```sh
pnpm --filter @smart-games/game-engine --filter @smart-games/xp test
pnpm --filter smart-games-api build
pnpm --filter smart-games-front exec tsc --noEmit --incremental false
pnpm --filter smart-games-api run test:integration
pnpm --filter smart-games-api run test:games
```

Test integracyjny wymaga Dockera. Uruchamia własny PostgreSQL na losowym porcie, sprawdza migrację starszych wyników, równoczesne rozliczenia i rollback, a następnie usuwa tylko utworzony przez siebie kontener. Nie korzysta z bazy wskazanej w `.env`.
