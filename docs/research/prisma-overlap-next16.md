# Research: непересечение интервалов (PostgreSQL + Prisma) и всегда-свежая доступность слотов (Next.js 16.4.3)

Тикет: [#14](https://github.com/dadev1307/ai-for-developers-project-386/issues/14). Это факты, а не решение: выбор механизма — отдельный grilling-тикет [#15](https://github.com/dadev1307/ai-for-developers-project-386/issues/15).

Дата: 2026-10-27. Стек: PostgreSQL + Prisma (ещё не установлен) + docker-compose, Next.js 16.4.3 (в проекте уже включены `cacheComponents: true` и `partialPrefetching: true` — проверено в `next.config.ts` на main).

## Источники

- **Next.js 16.4.3** — локальные доки установленного релиза: `node_modules/next/dist/docs/` (главы: `01-getting-started/06-fetching-data.md`, `07-mutating-data.md`, `08-caching.md`, `09-revalidating.md`, `15-route-handlers.md`; `02-guides/server-actions.md`, `02-guides/migrating-to-cache-components.md`; `03-api-reference/03-file-conventions/02-route-segment-config/`).
- **Prisma** — официальные доки prisma.io (актуальны для ORM 8, см. ниже): [raw-queries](https://www.prisma.io/docs/orm/reference/raw-queries), [transactions-and-runtime](https://www.prisma.io/docs/orm/reference/transactions-and-runtime), [fundamentals/transactions](https://www.prisma.io/docs/orm/fundamentals/transactions), [migration-api](https://www.prisma.io/docs/orm/reference/migration-api), [coming-from-prisma-orm-7](https://www.prisma.io/docs/orm/coming-from-prisma-orm-7).
- **PostgreSQL** — официальный мануал (current = 18): [5.5.6 Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html), [8.17 Range Types](https://www.postgresql.org/docs/current/rangetypes.html) (пример `room_reservation`), [F.8 btree_gist](https://www.postgresql.org/docs/current/btree-gist.html), [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [Appendix A: Error Codes](https://www.postgresql.org/docs/current/errcodes-appendix.html).

---

## 0. Версионный ландшафт Prisma (влияет на всё остальное)

Факт: в npm `latest`-тэг пакета `prisma` указывает на **8.0.0-rc.27** (стабильная предыдущая — 7.10.1 под тэгом `prev`, проверено `npm view prisma dist-tags` 2026-10-27). То есть `npm install prisma` сегодня ставит **RC-версию ORM 8**. У проекта Prisma ещё нет — выбор мажора будет первым решением при внедрении.

Различия, критичные для темы тикета:

| Что | Prisma 7 (стабильная) | Prisma 8 (RC) |
| --- | --- | --- |
| Клиент | `new PrismaClient()` из `schema.prisma` | файл `src/prisma/db.ts`: `postgres({ contract, url })`; схема переименована в `contract.prisma` (первая строка `// use prisma-8`); клиент создаётся из `contract.json`/`contract.d.ts`, которые пишет `npx prisma contract emit` |
| Транзакции | `prisma.$transaction(fn, { isolationLevel, timeout, maxWait })` — опции существуют | `db.transaction(fn)` — **только callback**: «There are no `isolationLevel`, `timeout`, or `maxWait` options» |
| Raw SQL | `$queryRaw` / `$executeRaw` | ``db.raw.sql`...` `` + `.returnsRow(spec).build()` → `db.query()` (чтение) или `.affectedCount().build()` → `db.execute()` (запись); внутри транзакции — `tx.query` / `tx.execute` |
| Ошибки БД | коды `P2002` (unique violation), `P2025` | коды `P20xx` **удалены**; ошибка несёт стандартный SQLSTATE в `error.sqlState` (например `23505`); конфликт на коммите — код `RUNTIME.TRANSACTION_COMMIT_FAILED`, исходная ошибка БД — в `error.cause` |
| DateTime | `Date` | `Temporal.Instant` (не `Date`); полифилл `temporal-polyfill` на Node 22/24; миграции требуют Node ≥ 22.18 / 24.11 / 26 |
| Миграции | SQL-файлы `prisma migrate dev/deploy` | `migration.ts` (TypeScript): `prisma migration plan` → редактируешь → `node migration.ts` пишет `ops.json` → `prisma db migrate` применяет; один прогон `db migrate` = одна транзакция |

Источник: prisma.io, «Coming from Prisma ORM 7» (таблицы Schema/Commands/Queries и секция «Not available», где прямо перечислено: «Transaction options: `isolationLevel`, `timeout`, `maxWait`… not available», «The `P2002` / `P2025` style error codes… database error… carries the standard SQL state code in `error.sqlState`»).

Ниже факты даются парой «PostgreSQL-механика → как ложится на Prisma 7 / Prisma 8».

---

## 1. Вариант A: exclusion constraint (btree_gist + tstzrange)

### Механика PostgreSQL

- Exclusion constraint гарантирует: для любых двух строк хотя бы одна из операторных проверок по указанным столбцам/**выражениям** вернёт false/null. Автоматически создаёт индекс указанного типа (GiST) (мануал 5.5.6).
- `tstzrange` (диапазон `timestamp with time zone`) — встроенный тип PostgreSQL; оператор `&&` — «перекрывается» (мануал 8.17). Каноничный пример из мануала (8.17.10):

  ```sql
  CREATE TABLE reservation (
      during tsrange,
      EXCLUDE USING GIST (during WITH &&)
  );
  ```

  Попытка вставить пересекающийся интервал даёт:

  ```text
  ERROR:  conflicting key value violates exclusion constraint "reservation_during_excl"
  DETAIL:  Key (during)=(["2010-01-01 14:45:00","2010-01-01 15:45:00")) conflicts
  with existing key (during)=(["2010-01-01 11:30:00","2010-01-01 15:00:00")).
  ```

- Чтобы учитывать в констрейнте ещё и скалярный столбец (например «тип события» или «владелец»), нужен модуль **btree_gist**: GiST-опклассы с B-tree-поведением для `timestamptz`, `uuid`, `text`, `int` и т.д. (мануал F.8). Пример из мануала:

  ```sql
  CREATE EXTENSION btree_gist;
  CREATE TABLE room_reservation (
      room text,
      during tsrange,
      EXCLUDE USING GIST (room WITH =, during WITH &&)
  );
  ```

- btree_gist — **trusted**-расширение: ставится `CREATE EXTENSION` без суперпользователя, достаточно `CREATE` на базу (мануал F.8). Входит в официальный дистрибутив PostgreSQL (Appendix F «Additional Supplied Modules»); наличие в конкретном docker-образе — проверить при реализации (ожидаемо да в официальном `postgres`).
- SQLSTATE нарушения: **`23P01` `exclusion_violation`** (Appendix A, класс 23). Гарантия — мгновенная, на уровне INSERT, независимо от уровня изоляции и от приложения.

### Что значит для Prisma

- **Контракт/схема**: exclusion constraint в языке схемы Prisma (ни 7, ни 8) не выражается. В миграционном API Prisma 8 есть методы `addUnique`, `addCheckConstraint`, `foreignKey`… но **метода для EXCLUDE нет** — мануал прямо говорит: «Use it [rawSql] for a statement that has no method on this page». Итог: констрейнт добавляется raw-операцией. Для btree_gist есть готовый хелпер `createExtension('btree_gist')` (пишет `CREATE EXTENSION IF NOT EXISTS`, идемпотентно, без пречеков).
- **Диапазон в схеме**: отдельный столбец `tstzrange` в контракте Prisma объявить нельзя (нет такого типа среди поддерживаемых; неподдерживаемые типы в v7 требовали `Unsupported`/raw). Обход — мануал 5.5.6 разрешает **выражения** в EXCLUDE, поэтому можно хранить обычные `startsAt`/`endsAt` (`timestamptz`) и написать констрейнт вида `EXCLUDE USING gist (tstzrange("startsAt", "endsAt") WITH &&)` — тогда контракт остаётся целиком в типизированных полях, а range живёт только в констрейнте. Альтернатива — сгенерированный столбец `GENERATED ALWAYS AS (tstzrange(...)) STORED` (механика PG 5.4).
- **Миграция Prisma 8**: `migration plan` создаёт `migration.ts`; в `operations` добавляешь `createExtension('btree_gist')` + `rawSql({ id, label, operationClass, target: { id: 'postgres' }, precheck, execute, postcheck })` с DDL констрейнта. Нюанс: «`db migrate` checks the database against the end contract after applying a migration» — как финальная проверка отнесётся к констрейнту, которого нет в контракте, в доках не специфицировано → проверить при реализации.
- **Миграция Prisma 7**: `prisma migrate dev --create-only` + рукописный SQL в файле миграции (классический задокументированный путь кастомизации миграций).
- **INSERT в рантайме**: обычный типизированный `create()` — констрейнт проверяет БД. При гонке второй INSERT падает с ошибкой, несущей `sqlState === '23P01'` (Prisma 8; ловится как `error instanceof Error && "sqlState" in error && error.sqlState === "23P01"`). В Prisma 7 аналогичная ошибка БД маппится в `PrismaClientKnownRequestError` с кодом уровня БД (P2002 — только unique; нарушение exclusion приходит как ошибка констрейнта БД — проверить точный код при реализации).
- **Второй гость**: получает детерминированный отказ на INSERT (быстрый, без повторов) → интерфейс показывает «интервал занят» + свежую сетку.

---

## 2. Вариант B: SERIALIZABLE-транзакции с повтором

### Механика PostgreSQL

- SERIALIZABLE = Serializable Snapshot Isolation: эмулирует последовательное выполнение; **приложение обязано уметь повторять транзакции** при serialization failure (мануал 13.2.3). Откат происходит либо на стейтменте, либо на коммите.
- SQLSTATE: **`40001` `serialization_failure`** (Appendix A; мануал 13.2.3: «always return with an SQLSTATE value of '40001'»). Сообщение: `could not serialize access due to read/write dependencies among transactions`.
- Предикатные локи (SIReadLock) не блокируют, но мониторинг и рестарты стоят ресурсов; мануал рекомендует: пул соединений, короткие транзакции, `READ ONLY` где можно, не держать idle in transaction (`idle_in_transaction_session_timeout`; PG17+ `transaction_timeout`).
- Важный подпункт мануала (13.2.3): при SERIALIZABLE возможны **ложные для пользователя** срабатывания — в т.ч. ошибки unique constraint (`23505`) при конкурентных вставках ключей, если не все транзакции предварительно проверяют ключ. Также: даже без истинного конфликта аномалия может «угадываться» — транзакция отменяется, хотя при реальном последовательном исполнении всё было бы нормально.
- Схема «проверил пересечение SELECT'ом → INSERT» работает под SERIALIZABLE: либо коммит, либо 40001 → повтор. Под дефолтным READ COMMITTED эта же схема **не гарантирует** ничего (классический race: обе транзакции проверили до вставки первой).

### Что значит для Prisma

- **Prisma 7**: `prisma.$transaction(async (tx) => { /* SELECT перекрытий; INSERT */ }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })` — опция задокументированно существовала (подтверждено списком удалённого в «Coming from Prisma ORM 7»). Повтор — свой цикл по ошибке.
- **Prisma 8**: у `db.transaction()` **нет способа задать уровень изоляции** — «Every transaction runs at the database's default isolation level, `READ COMMITTED` on PostgreSQL, and you cannot ask for another level yet». Документированный воркараунд (цитата из fundamentals/transactions):

  ```ts
  await db.transaction(async (tx) => {
    await tx.execute(db.raw.sql`SET TRANSACTION ISOLATION LEVEL SERIALIZABLE`.affectedCount().build());
    // ваши записи
  });
  ```

  (первым стейтментом транзакции — это валидно для PostgreSQL: `SET TRANSACTION` до любых запросов, мануал 13.2).
- **Повтор при конфликте**: встроенного ретрая нет ни в 7, ни в 8 — «Nothing retries a failed transaction for you. Write the retry loop yourself». Документированный образец (fundamentals/transactions): ловить `sqlState === '40001' || '40P01'` (deadlock), причём при конфликте на коммите ошибка приходит как `RUNTIME.TRANSACTION_COMMIT_FAILED` с БД-ошибкой в `cause` — проверять `sqlState` и на ошибке, и на её `cause`. Альтернатива задать уровень всем транзакциям разом: `default_transaction_isolation` в connection string / конфиге сервера (docker-compose) — но тогда SERIALIZABLE падает на ВСЕ транзакции базы со ростом числа конфликтов.
- **Второй гость**: его транзакцию БД откатывает (40001) → ретрай (обычно 1–2 попытки хватает) → на повторе SELECT видит первую бронь → приложение возвращает «слот занят». Худший случай — несколько лишних roundtrip и ложные отмены без истинного конфликта. Если ретрай не написан/исчерпан — гость видит 500.

---

## 3. Вариант C: уникальный ключ слота при фиксированной сетке стартов

### Механика

- Модель: старты кратны шагу сетки (например каждые 30 мин), длительность фиксирована. Непересечение «в пределах сетки» сводится к уникальности пары (тип события/владелец, `startsAt`): два события не могут начаться в один слот.
- В контракт/схему Prisma пишется нативно: `@@unique([eventTypeId, startsAt])` (в таблице соответствий Prisma 7→8 `@@unique` — «unchanged»). В миграционном API есть метод `addUnique`. Никакого raw SQL ни в миграциях, ни в запросах.
- Нарушение при гонке: **`23505` `unique_violation`** (Appendix A). Prisma 8: `error.sqlState === '23505'` (документированный пример ловли именно этого кода); Prisma 7: `P2002`.
- Конкурентная вставка без исключения: у Prisma 8 `.createAll(rows, { onConflict: 'skip', conflictOn: ['startsAt', ...] })` (аналог `ON CONFLICT`); у Prisma 7 — `createMany({ skipDuplicates: true })`.

### Границы гарантии (факты, не решение)

- Констрейнт проверяет **идентичность слота, а не пересечение интервалов**: если длительность события > шага сетки, события соседних слотов пересекаются, не нарушая unique. В карте #9 это уже отражено как открытый вопрос («шаг ≠ длительности, самопересечение слотов сетки»). Гарантия непересечения достигается только при длительности ≤ шага — и это придётся гарантировать отдельно (данными/проверкой).
- Гость не может «выбрать произвольное время»: только узлы сетки. Любые вне-сеточные интервалы (если появятся у владельца) этот констрейнт не защищает вообще.

### Второй гость

Детерминированный мгновенный отказ на INSERT (`23505`/P2002) → «слот уже занят». Никаких ретраев и дополнительных roundtrip.

---

## 4. Наблюдаемые характеристики вариантов

| Характеристика | A: exclusion (btree_gist+tstzrange) | B: SERIALIZABLE + ретрай | C: unique слот сетки |
| --- | --- | --- | --- |
| Гонка двух гостей на один интервал/слот | БД отклоняет второй INSERT: `23P01`, мгновенно | Одна транзакция коммитится, вторая отменяется `40001` (на коммите или стейтменте); нужен ретрай | БД отклоняет второй INSERT: `23505` (P2002 в v7), мгновенно |
| Что видит второй гость | «Занято» сразу, 1 roundtrip | «Занято» после 1–2 повторов (или 500, если ретрай не написан) | «Занято» сразу, 1 roundtrip |
| Защищает ли произвольные интервалы (не сетку) | Да, любые `[start, end)` | Да, любые | Нет — только одинаковые старты слотов |
| Ложные срабатывания без конфликта | Нет | Возможны (природа SSI; плюс документированный кейс ложных `23505`) | Нет |
| Переживает рестарт Next/контейнера | Да (DDL в БД) | Да (логика в приложении, БД не меняется) | Да (DDL в БД) |
| Raw SQL | Миграция: да (rawSql + createExtension); запросы: нет | Запросы: да в v8 (`SET TRANSACTION…` первым стейтментом; опции убраны); в v7 — только опция isolationLevel | Нет вообще |
| Где живёт гарантия | В БД, на каждую запись | В коде каждого пути записи (забыл SERIALIZABLE → тихо READ COMMITTED → возможен оверлап) | В БД + в инварианте «длительность ≤ шаг» вне БД |
| Зависимость от мажора Prisma | Средняя (миграционный механизм разный) | Высокая (v7: опция; v8: raw-стейтмент + свой ретрай) | Низкая (`@@unique` одинаков) |

Дополнительно (наблюдаемо): персистентность броней при рестарте во всех трёх вариантах обеспечивает сама PostgreSQL — констрейнты/уровень изоляции/данные живут в БД (docker-volume), состояние Next.js ни на что из этого не влияет.

## 5. Всегда-свежая доступность слотов в Next.js 16.4.3

Факты из локальных доков релиза (в проекте `cacheComponents: true`, `partialPrefetching: true` — значит актуальна модель Cache Components, а не «предыдущая модель»):

- **«Динамический рендер» изменился семантически**: `export const dynamic = 'force-dynamic'` — легаси предыдущей модели; гайд миграции прямо говорит: «**Remove the config.** … With Cache Components, uncached data and Request-time APIs already run at request time. Next.js prerenders any static or cached UI around them» (`02-guides/migrating-to-cache-components.md`). Конфиг-файлов `dynamic`/`revalidate`/`fetchCache` в актуальном route-segment-config больше нет (там остались `dynamicParams`, `ensureStatic`, `instant`, `maxDuration`, `preferredRegion`, `prefetch`, `runtime`).
- **Всегда-свежая сетка без кэша**: асинхронное чтение БД (запрос Prisma) в Server Component **без** `'use cache'`, обёрнутое в `<Suspense>`, стримится **на каждый запрос** — «require fresh data on every request, do not use `"use cache"`… The fallback ships with the prerendered shell while the async work runs at request time» (`08-caching.md`, секция Streaming uncached data). Кэш-записи с коротким временем жизни (`revalidate: 0`, профиль `seconds`) автоматически исключаются из пререндеров и становятся динамическими дырками (`09-revalidating.md`). Инвалидация такому блоку не нужна вовсе.
- **fetch-семантика**: «`fetch` requests are not cached by default» (`06-fetching-data.md`) — кэширование fetch только явное, через `'use cache'` + `cacheLife`.
- **Route Handlers**: с включёнными Cache Components `GET`-хендлеры следуют той же модели, что UI-роуты: «run at request time by default, can be prerendered when they don't access uncached or runtime data» (`15-route-handlers.md`). Небраузерные клиенты (если слот-сетка понадобится как API) получают свежие данные из неоткэшированного `GET` автоматически.
- **Server Actions для брони**: вызываются только по POST; «сервер не ставит их в очередь — каждый запрос выполняется независимо» («the server does not queue Server Actions… Each one runs in its own request»), поэтому два разных гостя реально параллельны на сервере; ответ экшена одним roundtrip возвращает и данные, и обновлённый UI (`07-mutating-data.md`, `02-guides/server-actions.md`). Отсюда: сам факт гонки двух гостей — это два параллельных server action, и защиту от неё обязан дать слой БД (разделы 1–3).
- **Инвалидация после успешной брони** (если сетка всё же закэширована через `'use cache'` + `cacheTag('slots')`):
  - `updateTag('slots')` — мгновенно истощает кэш-тег; **доступен только в Server Actions**; сценарий «пользователь видит свою запись сразу» (read-your-own-writes) (`09-revalidating.md`);
  - `revalidateTag('slots', 'max')` — stale-while-revalidate (старьё отдаётся сразу, свежее готовится в фоне); работает и в Server Actions, и в Route Handlers;
  - `revalidatePath('/booking')` — инвалидация по пути, «когда не знаешь теги»; доки рекомендуют теговый способ как более точный.
- **Переживание рестарта**: кэш по умолчанию — in-memory, per-instance, «ephemeral on serverless», не переживает деплой (ключ включает build id). Отсюда наблюдение: кэш-прослойка в Next не может быть хранилищем истины для занятости слотов; истина — только PostgreSQL.

## 6. Открытые вопросы (проверить при реализации; не решения)

1. Финальная сверка `db migrate` с контрактом при наличии exclusion-констрейнта, отсутствующего в контракте Prisma 8 — задокументированного поведения нет.
2. Фактический код ошибки Prisma 7 при нарушении exclusion constraint (ожидаемо ошибка БД 23P01, обёрнутая в PrismaClientKnownRequestError с P2004 «constraint failed» — подтвердить живой проверкой).
3. Наличие `btree_gist` в конкретном docker-образе `postgres`, который выберет проект.
4. Мажор Prisma (7.10.1 stable против 8.0.0-rc.27) — отдельное решение вне этого тикета; RC-статус 8 фиксируется как факт npm-тэгов на 2026-10-27.
