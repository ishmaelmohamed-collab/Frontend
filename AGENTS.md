# AGENTS.md — guide for AI assistants (and new developers)

Read this first. It is the fastest way to understand the project without exploring every file.

## What this is

Frontend for a **wholesale / trading accounting system**. Runs fully on **demo data** through a mock API
in the browser (MSW) — there is no backend yet. English + Arabic (right-to-left), desktop + phone.

- Client decisions and business rules: `docs/PROJECT-BRIEF.md` (source of truth — follow it)
- Design system (colours, components, two-language rules): `docs/DESIGN-SYSTEM.md`
- Live design references in the app: `/direction`, `/wireframes`, `/design-system`

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + format check + tests — must pass before every commit
npm run build
```

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · React Router · TanStack Query & Table ·
React Hook Form + Zod · decimal.js · Recharts · Lucide · MSW · Vitest + Testing Library · oxlint + Prettier.

## Where things are

```
src/app/             AppShell (sidebar, top bar, phone tab bar), routes (App.tsx), navigation.ts
src/components/ui/   Reusable components — build screens ONLY from these
src/features/        One folder per area: dashboard, invoices, catalog (customers, items), purchases, books
src/mocks/           Demo data + fake API (db.ts, catalog.ts, purchases.ts, banking.ts, ledger.ts, handlers.ts)
                     — enforces business rules; ledger.ts builds the journal from the documents
src/lib/             money (decimal.js), dates, i18n (i18n-context.ts + messages-*.ts), api client
src/types/domain.ts  Data contract between screens and the API
```

## Rules that must not be broken

1. **Colours:** only misty blue `#DCE6F2` and slate blue `#4A5D78` (+ neutral greys). Warning red `#B42318`
   is used **only** for overdue and errors. Never put text in the middle of the `.fog` gradient.
2. **Two languages:** every UI string goes in `src/lib/messages-*.ts` in English AND Arabic (TypeScript enforces it).
   Use logical CSS (`ms/me`, `ps/pe`, `start/end`, `text-start/end`) — never left/right.
   Wrap mixed-language cells in `<bdi>`; money via `<Amount>` (always left-to-right).
3. **Money:** never JavaScript numbers for maths — use `money()` / `sum()` from `src/lib/money.ts`; API money is a
   decimal string like `"1234.50"`.
4. **Payments:** methods are bank transfer, mobile money, customer credit — **no cash**. Bank and mobile money
   require a transaction ID.
5. **Approvals:** bills over $10,000 need Owner approval before payment; accounts can't be overdrawn;
   stock only changes when an invoice is **sent** (never drafts). Only the Owner locks/reopens a month, with a
   reason; nothing dated in a locked month can be added. Journal entries must balance; reconciliation never
   matches silently.
6. **Roles:** check `useSession().can(...)` before showing an action, add the route's permission in
   `App.tsx` / `navigation.ts`, and guard the mock API route with the same permission.
7. **Accessibility:** visible labels, errors next to fields, 4.5:1 contrast, keyboard works, 44 px touch targets.
8. Every data screen has loading, empty and error states.

## Status (see brief for detail)

Phases 1–4 approved. Screens are built in batches:

- ✅ 1 App shell, Dashboard, Invoices list, Invoice detail + Record payment
- ✅ 2 New invoice, Customers, Items & stock
- ✅ 3 Bills (+ approval), New bill, Pay bills, Vendors, Purchase orders, Quotes, Payments received
- ✅ 4 Bank & wallets (+ transfers), Reconciliation, Close month (+ lock/reopen), Accounts & journal (+ manual entries)
- ✅ 5 Sign-in & roles (permission table in `src/lib/permissions.ts`, enforced by the mock API too),
  Settings (company, provider names, approval limit, reminder day, users), Reports (P&L, balance sheet,
  who owes what, sales by customer; print + CSV export)

Demo accounts: `owner|accountant|cashier|sales@demo.test`, password `demo1234` (see README).
Next phase: 7 — Launch (connect the real backend, QA, handover).

Placeholders still waiting on the client: company name, logo, mobile-money provider names.
Demo data resets on page reload (in-memory mock).
