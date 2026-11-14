# Design System — Blue fog

Approved look (14 Nov 2026), built as real components. **Live gallery:** run the app and open `/design-system`
(English / العربية switch at the top). Screens are built only from these parts.

## 1. Colour

| Token                                              | Hex                         | Use                                                              |
| -------------------------------------------------- | --------------------------- | ---------------------------------------------------------------- |
| `mist`                                             | #DCE6F2                     | Light end of the fog: backgrounds, selected items, info messages |
| `slate`                                            | #4A5D78                     | Deep end: primary buttons, links, active states                  |
| `mist-soft` / `mist-strong`                        | #EEF3F9 / #C3D1E4           | Hover rows / pressed light controls                              |
| `slate-hover` / `slate-pressed` / `slate-disabled` | #3E4F66 / #34435A / #A9B6C8 | Button states                                                    |
| `alert` / `alert-soft`                             | #B42318 / #FEF3F2           | **Overdue and errors only**                                      |
| `ink` / `ink-muted` / `ink-subtle`                 | #1C2430 / #4D5866 / #69737F | Text                                                             |
| `line` / `line-input`                              | #DDE3EA / #8A94A3           | Dividers / form borders (3:1)                                    |
| `canvas` / `panel`                                 | #F6F8FB / #FFFFFF           | Page / cards                                                     |

Utilities: `.fog` (the gradient; vertical on phones, mirrors in Arabic) and `.fog-soft` (subtle surface).
**Text never sits mid-gradient.** Fonts: Manrope (English, all numbers) and IBM Plex Sans Arabic.
Radius: control 8 · card 14 · panel 20.

## 2. Components — `src/components/ui/`

| Component                                      | File              | Notes                                                                                                       |
| ---------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `Button`, `ButtonLink`, `IconButton`           | `Button.tsx`      | primary · secondary · quiet; sm · md; `loading`; `icon`. Risky actions = primary + warning icon + `Dialog`. |
| `TextField`, `SelectField`, `TextAreaField`    | `Field.tsx`       | Visible label, `hint`, `error` (red, icon, `aria-invalid`, `aria-describedby`), `numeric`.                  |
| `Segmented`, `Checkbox`, `Switch`              | `Field.tsx`       | Segmented = radio group (payment method). Switch = applies immediately.                                     |
| `StatusBadge`                                  | `StatusBadge.tsx` | draft · sent · partial · paid · overdue (red) · void — icon + word, translated.                             |
| `Alert`, `Toast`                               | `Feedback.tsx`    | info · success · attention · error (only error is red).                                                     |
| `Drawer`, `Dialog`                             | `Overlay.tsx`     | Focus in, Tab trapped, Escape closes, focus returns. Drawer opens from the end edge.                        |
| `Card`, `CardHeader`, `PageHeader`, `StatCard` | `Layout.tsx`      | StatCard: default · featured (fog) · overdue (red).                                                         |
| `DataTable`                                    | `DataTable.tsx`   | Sortable; cards on phones; `<bdi>` per cell for mixed languages.                                            |
| `FilterTabs`, `SearchInput`                    | `Filters.tsx`     | Filters with counts; labelled search.                                                                       |
| `Skeleton`, `EmptyState`, `ErrorState`         | `States.tsx`      | Every data view needs all three.                                                                            |
| `Amount`                                       | `Amount.tsx`      | Every money figure: tabular, brackets for negatives, always left-to-right.                                  |

## 3. Two languages

`const { t, locale, setLocale } = useLocale()` — every key exists in English and Arabic (build fails otherwise).
Use logical classes only (`ms/me`, `ps/pe`, `start/end`, `text-start/end`, `border-s/e`); forward arrows get
`rtl:rotate-180`; numbers and IDs stay left-to-right.

## 4. Checklist for every screen

Contrast ≥ 4.5:1 (tokens pass) · visible focus · keyboard-only works · labels on every input · status never by
colour alone · 44 px touch targets · check at 390 / 768 / 1440 px in English **and** Arabic.
