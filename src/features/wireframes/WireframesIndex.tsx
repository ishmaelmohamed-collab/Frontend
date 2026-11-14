import { Link } from 'react-router'

const flows = [
  {
    name: 'Flow A — Sell on credit: invoice → payment',
    clickable: true,
    steps: [
      ['a1', 'A1 · Invoices list'],
      ['a2', 'A2 · New invoice'],
      ['a3', 'A3 · Invoice sent'],
      ['a4', 'A4 · Record payment'],
      ['a5', 'A5 · Invoice paid'],
    ],
  },
  {
    name: 'Flow B — Buy from a vendor: bill → payment',
    clickable: true,
    steps: [
      ['b1', 'B1 · New bill'],
      ['b2', 'B2 · Pay bills'],
    ],
  },
  {
    name: 'Flows C & D — Reconcile, then close the month',
    clickable: false,
    steps: [
      ['c1', 'C1 · Reconcile bank & wallets'],
      ['d1', 'D1 · Close the month'],
    ],
  },
]

/** Phase 3 entry page: map of all wireframe flows. */
export function WireframesIndex() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-slate text-sm font-semibold">Phase 3 · for approval</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Wireframes</h1>
          <p className="text-ink-muted mt-1 max-w-2xl text-sm">
            Grey boxes on purpose: judge what is on each screen and the order of the steps. Start a flow and
            click the slate buttons to walk through it. Numbered markers match the rules panel on each screen.
            English only for now — Arabic versions come with the final screens.
          </p>
        </div>
        <div className="flex gap-4 text-sm font-semibold">
          <Link to="/direction" className="text-slate">
            ← Design direction
          </Link>
          <Link to="/design-system" className="text-slate">
            Design system →
          </Link>
        </div>
      </div>

      {flows.map((f) => (
        <section key={f.name} className="bg-panel border-line rounded-card shadow-card border p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{f.name}</h2>
            {f.clickable && (
              <Link
                to={`/wireframes/${f.steps[0][0]}`}
                className="bg-slate hover:bg-slate-hover rounded-control inline-flex min-h-10 items-center px-4 text-sm font-semibold text-white"
              >
                Start the flow →
              </Link>
            )}
          </div>
          <ol className="flex flex-wrap items-center gap-2">
            {f.steps.map(([id, label], i) => (
              <li key={id} className="flex items-center gap-2">
                {i > 0 && (
                  <span aria-hidden className="text-ink-subtle rtl:rotate-180">
                    →
                  </span>
                )}
                <Link
                  to={`/wireframes/${id}`}
                  className="border-line-input hover:bg-mist-soft rounded-control border px-3 py-2 text-sm font-semibold"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ol>
        </section>
      ))}

      <section className="rounded-card border border-[#e8dfa0] bg-[#fdfbea] p-5 text-sm">
        <h2 className="mb-2 font-bold">Rules I'm proposing — please confirm or change</h2>
        <ul className="flex list-disc flex-col gap-1 ps-5">
          <li>
            Bills over <strong>$10,000</strong> need Owner approval before payment.
          </li>
          <li>
            Customers going over their <strong>credit limit</strong> need Owner approval.
          </li>
          <li>Sales staff cannot change prices, record payments or export lists.</li>
          <li>Only the Owner can void documents or lock a month; both need a written reason.</li>
          <li>
            A reminder on the <strong>3rd of each month</strong> if last month is not closed.
          </li>
        </ul>
      </section>
    </div>
  )
}
