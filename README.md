# Accounting System — Frontend

Clean start on 14 November 2026. Frontend only, with demo data. No backend or database is needed.

**Current phase:** 2 — Look & feel. The app currently shows the **"Blue fog" design direction** page for approval.
Decisions and phase plan: [docs/PROJECT-BRIEF.md](docs/PROJECT-BRIEF.md).

## Run it

Needs Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and use the **العربية / English** button to switch language and direction.

## Commands

| Command          | Does                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `npm run dev`    | Start with live reload                                             |
| `npm run build`  | Type-check and build to `dist/`                                    |
| `npm test`       | Run tests                                                          |
| `npm run check`  | Type-check + lint + format check + tests (run before every commit) |
| `npm run format` | Auto-format all files                                              |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · TanStack Query & Table · React Hook Form + Zod · decimal.js (money) ·
Recharts · Lucide icons · MSW (mock API) · Vitest + Testing Library · oxlint + Prettier.
Fonts are self-hosted: Manrope (English) and IBM Plex Sans Arabic (Arabic).

## Structure

```
src/
├─ components/ui/   Reusable parts (Button, TextField, StatusBadge, Amount)
├─ features/        One folder per area (direction = Phase 2 page)
├─ lib/             Helpers: money, languages (i18n), class names
├─ test/            Test setup
└─ index.css        "Blue fog" design tokens
docs/               Project brief
```

## Rules

- **Colour:** only misty blue `#DCE6F2` and slate blue `#4A5D78`, plus neutral greys. Text never sits mid-gradient.
- **Two languages:** every text key exists in English and Arabic. Layout uses start/end, never left/right.
- **Money:** always through `decimal.js` and the `<Amount>` component.
