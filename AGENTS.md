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

## Typecheck gotcha

`npx tsc --noEmit` падает с `Cannot find name 'LayoutProps'`, пока не существует `.next/types` — глобальные типы Next 16 (типизированные пропсы лейаутов) генерируются при `next dev`/`next build`. Перед голым `tsc` один раз запустите сборку. `next-env.d.ts` генерируется автоматически и в git не коммитится.

## Conventions

- Коммиты строго в Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`) — release-please (`release-type: node`) на каждый push в `main` собирает из них Release PR.
- `.github/workflows/hexlet-check.yml` не трогать (не переименовывать, не удалять) — требование Хекслета.
- Тесты лежат в папках `__tests__` рядом с исходниками; окружение jsdom, `@testing-library/jest-dom` подключается через `vitest.setup.ts`.
- Импорт-алиас: `@/*` → `src/*`.

## shadcn/ui specifics

- Стиль `base-nova` на примитивах `@base-ui/react` (Base UI, **не Radix** — дефолт из старых доков shadcn здесь неверен).
- Компоненты в `src/components/ui` — это скопированный исходный код, которым владеет проект: правьте свободно, удаляйте вместе с файлом. `cn` — пакет `cn`, реэкспорт из `src/lib/utils`.
- `Input` намеренно содержит `suppressHydrationWarning`: браузерные расширения (например, вписывают `data-sharkid` в `<input>`) меняют DOM до гидратации, и бандл React canary в Next предупреждает о лишних атрибутах. Не удалять без понимания причины.

## Toolchain pins

- `@vitejs/plugin-react` зафиксирован на `^5`: v6 требует `@babel/core@8`, а цепочка зависимостей shadcn CLI — `@babel/core@7` (npm ERESOLVE). Не обновлять вслепую.
- `vitest.config.mts` использует нативный Vite `resolve.tsconfigPaths: true` — плагин `vite-tsconfig-paths` не нужен.
- Vitest гоняет стабильный `react-dom@19.3`, браузер — React canary из бандла Next. Предупреждения гидратации о «лишних» DOM-атрибутах в jsdom не воспроизводятся — не пытайтесь ловить их тестами.
