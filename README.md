# Accounting System — Frontend

Frontend for a wholesale / trading accounting system. Runs fully on demo data in the browser; no backend or database
is needed yet. English + Arabic (right-to-left), desktop + phone.

**Status:** all five screen batches built and tested — awaiting client review before launch (connecting the real backend).
Decisions, business rules and phase plan: [docs/PROJECT-BRIEF.md](docs/PROJECT-BRIEF.md). Guide for AI assistants: [AGENTS.md](AGENTS.md).

## Run it

Needs Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in with a demo account. Use **العربية / English** to switch language and direction.

### Demo accounts

Test values for the demo only — the mock API accepts them; the real backend will issue real accounts.

| Role       | Email                  | Password   |
| ---------- | ---------------------- | ---------- |
| Owner      | `owner@demo.test`      | `demo1234` |
| Accountant | `accountant@demo.test` | `demo1234` |
| Cashier    | `cashier@demo.test`    | `demo1234` |
| Sales      | `sales@demo.test`      | `demo1234` |

Demo data resets when the page reloads (you stay signed in).

## Commands

| Command          | Does                                                               |
| ---------------- | ------------------------------------------------------------------ |
| `npm run dev`    | Start with live reload                                             |
| `npm run build`  | Type-check and build to `dist/`                                    |
| `npm test`       | Run tests                                                          |
| `npm run check`  | Type-check + lint + format check + tests (run before every commit) |
| `npm run format` | Auto-format all files                                              |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · TanStack Query & Table · React Hook Form + Zod ·
decimal.js (money) · Recharts · Lucide icons · MSW (mock API) · Vitest + Testing Library · oxlint + Prettier.
Fonts are self-hosted: Manrope (English) and IBM Plex Sans Arabic (Arabic).

## Structure

```
src/
├─ app/             Shell (sidebar, top bar, phone tab bar), routes, role guards
├─ components/ui/   Reusable components — screens are built only from these
├─ features/        One folder per area: dashboard, invoices, catalog, purchases, books, admin
├─ lib/             money, dates, i18n, permissions (who can do what), session, api client, csv
├─ mocks/           Demo data + fake API that enforces the business rules
├─ types/domain.ts  Data contract between screens and the API
└─ index.css        "Blue fog" design tokens
docs/               Project brief and design system
```

## Connecting the real backend

Set `VITE_API_URL` to the API and `VITE_USE_MOCKS=false`. Every route the screens call is in `src/mocks/handlers.ts`,
with the same paths, payloads (`src/types/domain.ts`) and error codes the real API should return. The permission table
in `src/lib/permissions.ts` must be enforced by the backend too — the UI only hides what a role can't use.

## Rules

- **Colour:** only misty blue `#DCE6F2` and slate blue `#4A5D78`, plus neutral greys; warning red `#B42318` only for
  overdue and errors. Text never sits mid-gradient.
- **Two languages:** every text key exists in English and Arabic. Layout uses start/end, never left/right.
- **Money:** always through `decimal.js` and the `<Amount>` component.
