# Project Brief — Accounting System Frontend

**Restarted:** 14 Nov 2026 (clean start: all earlier design and code removed) · **Phase:** 5 — Screens (batch 4 built)

Only the client's own answers were carried over. Everything else in this project is new.

---

## 1. Client answers (kept)

| Topic           | Answer                                                       |
| --------------- | ------------------------------------------------------------ |
| Business        | Wholesale / trading                                          |
| Users           | Owner / manager · Accountant · Cashier · Sales staff         |
| Devices         | Desktop + phone                                              |
| Currency        | USD only                                                     |
| Version 1 scope | Full accounting                                              |
| Tax             | None for now                                                 |
| Payments        | Mobile money · Bank transfer · Customer credit — **no cash** |
| Languages       | English + Arabic (right-to-left)                             |
| Design review   | In the browser (Figma free plan is too limited)              |

## 2. New look — "Blue fog" (client choice, 14 Nov 2026)

**Only two colours**, used as a soft gradient, plus neutral greys for text and lines.

| Colour     | Hex                 | Role                                                          |
| ---------- | ------------------- | ------------------------------------------------------------- |
| Misty blue | `#DCE6F2`           | Light end of the fog: backgrounds, highlights, selected items |
| Slate blue | `#4A5D78`           | Deep end: buttons, links, active states, headings accents     |
| Gradient   | `#DCE6F2 → #4A5D78` | Page header band, brand panel, key cards                      |

Readability rules (checked):

- Slate on white 6.7 : 1 · slate on misty blue 5.3 : 1 — both pass for any text.
- **Text never sits on the middle of the gradient** (white there is only 3.4 : 1). Text goes on the misty side,
  in dark ink; the gradient mirrors for Arabic so text stays on the light side.

## 3. Still needed from the client

- [ ] Company name and logo
- [ ] Mobile-money provider names
- [x] Overdue / errors colour — **decided 14 Nov 2026: option B, warning red `#B42318`, used only for overdue and errors** (6.5 : 1 on white; always with an icon and words)

## 4. Business rules (approved with the wireframes, 14 Nov 2026)

1. Bills over **$10,000** need Owner approval before payment (limit changeable in Settings).
2. Customers going over their **credit limit** need Owner approval.
3. **Sales staff** cannot change prices, record payments or export lists.
4. Only the **Owner** can void documents or lock a month; both need a written reason (audit log).
5. Reminder on the **3rd of each month** if the previous month is not closed.
6. Risky actions (void, lock) use slate with a warning icon and always confirm — red stays for overdue and errors only.

## 5. Delivery plan

| Phase            | Deliverable                                                                                     | Sign-off                 |
| ---------------- | ----------------------------------------------------------------------------------------------- | ------------------------ |
| 1. Discovery     | Answers above                                                                                   | ✅ Kept from first round |
| 2. Look & feel   | Blue fog design direction page, English + Arabic                                                | ✅ Approved 14 Nov 2026  |
| 3. Wireframes    | Key flows: invoice → payment, bill → payment, reconcile, month-end — clickable at `/wireframes` | ✅ Approved 14 Nov 2026  |
| 4. Design system | All components, every state, LTR + RTL — live gallery at `/design-system`                       | ✅ Approved 14 Nov 2026  |
| 5–6. Screens     | Every V1 screen built working on demo data, desktop + phone, EN + AR — in 5 batches (below)     | ⏳ Batches 1–4 built     |
| 7. Launch        | Connect real backend, QA, docs, handover                                                        | Final                    |

### Screen batches

| Batch | Screens                                                                    | Status                                                |
| ----- | -------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1     | App shell · Dashboard · Invoices list · Invoice detail + Record payment    | ✅ Built & tested (EN/AR, phone) — reviewed by client |
| 2     | New invoice · Customers · Items & stock                                    | ✅ Built & tested — awaiting review                   |
| 3     | Bills · Pay bills · Vendors · Purchase orders · Quotes · Payments received | ✅ Built & tested — awaiting review                   |
| 4     | Bank & wallets · Reconciliation · Close month · Accounts & journal         | ✅ Built & tested — awaiting review                   |

### How the books work (batch 4)

- Every journal entry is built from real documents (invoices, payments, bills, bill payments, transfers,
  fees, unapplied receipts) plus manual entries — debits always equal credits, so the trial balance is a real check.
- Stock uses the **periodic method**: goods bought go to Purchases; the month-end stock count corrects the stock value.
- **Automatic accounts** (bank, wallets, receivable, payable) can't be used in manual journal entries.
- **Reconciliation:** a person confirms every statement line (Match · Record & match · Add as fee · Hold as
  unapplied). Each fix creates a real record. "Left to explain" must reach $0.00; entries in the books but not
  yet on the statement are listed separately.
- **Close month** checklist: each account reconciled, no draft invoices in the month, no bills waiting for
  approval, stock count recorded. Lock and reopen: Owner only, with a written reason, kept in the audit log.
  Nothing dated in a locked month can be added (invoices, bills, payments, transfers, journal entries).
- Demo assumptions: opening stock value $38,640.00; earlier wallet-to-bank sweeps seeded so opening balances are positive.
| 5     | Reports · Settings · Sign-in & roles                                       | —                                                     |
