<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project

Сервис бронирования звонков («Календарь звонков»), учебный проект Хекслета. UI-тексты и README — на русском; коммит-месседжи — на английском. Менеджер пакетов — только npm.

## Commands

- `npm run dev` — dev-сервер на http://localhost:3000 (Turbopack)
- `npm run build` — production-сборка, включает проверку TypeScript
- `npm run lint`
- `npm test` — все тесты (vitest run); `npm run test:watch` — watch-режим
- `npx vitest run src/components/ui/__tests__/button.test.tsx` — один файл
- `npx shadcn@latest add <name>` — добавить UI-компонент

## Conventions

- Работа идёт через фича-ветки: ветка → PR в `main` → squash-merge. Прямые пуши в `main` не делаем (запрещены pre-push hook'ом и `opencode.json`). Имя ветки — `feat/...`, `fix/...`, `docs/...`, `ci/...`; заголовок PR — обязательно в формате Conventional Commits (при squash он попадает в историю `main`).
- Агент создаёт ветки и PR, но **не апрувит и не мержит** — мержит только человек (запрет в `opencode.json`: merge/review эндпоинты и прямые пуши в `main`).
- Коммиты строго в Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`) — release-please (`release-type: node`) собирает из них Release PR после каждого мержа в `main`.
- `.github/workflows/hexlet-check.yml` не трогать (не переименовывать, не удалять) — требование Хекслета.
- Импорт-алиас: `@/*` → `src/*`.

## Toolchain pins

- `@vitejs/plugin-react` зафиксирован на `^5`: v6 требует `@babel/core@8`, а цепочка зависимостей shadcn CLI — `@babel/core@7` (npm ERESOLVE). Не обновлять вслепую.
- `vitest.config.mts` использует нативный Vite `resolve.tsconfigPaths: true` — плагин `vite-tsconfig-paths` не нужен.
- Vitest гоняет стабильный `react-dom@19.3`, браузер — React canary из бандла Next. Предупреждения гидратации о «лишних» DOM-атрибутах в jsdom не воспроизводятся — не пытайтесь ловить их тестами.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues (this repo); use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five defaults: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
