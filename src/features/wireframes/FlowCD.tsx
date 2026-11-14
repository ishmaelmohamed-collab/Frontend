import { Marker, Row, WBox, WButton, WTable, WireFrame } from './kit'

/* Flow C — reconcile bank & wallets · Flow D — close the month */

export function C1Reconcile() {
  const rows = [
    [
      '14 Nov · Received +$2,480.00 · MP-7720-1934',
      '⟷',
      'Payment for INV-3107 · Al-Noor Trading',
      'Exact: amount + ID',
      'Match',
    ],
    [
      '13 Nov · Received +$1,955.00 · MP-7716-0482',
      '⟷',
      'Payment for INV-3105 · Horizon Mini Market',
      'Amount + customer',
      'Match',
    ],
    [
      '12 Nov · Received +$740.25 · Riverside',
      '?',
      'INV-3104 is open for $740.25 — payment never entered',
      'Missing payment',
      'Record & match',
    ],
    [
      '12 Nov · Fee −$15.00 · wallet service fee',
      '?',
      'Nothing in the books',
      'Fee only on statement',
      'Add as fee',
    ],
    ['11 Nov · Received +$500.00 · no name', '?', 'No match found', 'Unknown payer', 'Find or hold…'],
  ]
  return (
    <WireFrame
      code="C1 · Reconcile"
      active="Reconciliation"
      title="Reconcile"
      actions={<WButton marker={1}>Import statement (CSV)</WButton>}
      rules={[
        'Import the bank or wallet statement as a CSV file. Each account is reconciled separately; a tick on its tab means fully matched.',
        'The difference must reach $0.00. Here the unrecorded $740.25 and $500.00, less the $15.00 fee, explain the $1,225.25 exactly.',
        'Matches are suggested from amount, transaction ID (from A4) and customer. A person always confirms — nothing matches silently.',
        'Every fix creates a proper record (payment, fee, unapplied credit), so the books stay complete and the audit trail clean.',
      ]}
      next="Resolve the 3 open lines"
    >
      <div className="mb-4 flex flex-wrap gap-1.5 text-sm">
        <span className="border-line-input rounded-md border px-3 py-1.5">Bank · Main ✓</span>
        <span className="bg-ink rounded-md px-3 py-1.5 font-semibold text-white">
          Mobile money · [Provider 1] · 3 open
        </span>
        <span className="border-line-input rounded-md border px-3 py-1.5">
          Mobile money · [Provider 2] · 2 open
        </span>
      </div>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WBox>
          <p className="text-ink-muted text-xs">Statement balance (14 Nov)</p>
          <p className="text-lg font-bold">$15,920.30</p>
        </WBox>
        <WBox>
          <p className="text-ink-muted text-xs">In the books</p>
          <p className="text-lg font-bold">$14,695.05</p>
        </WBox>
        <WBox className="border-ink border-2">
          <p className="text-ink-muted flex items-center gap-1.5 text-xs">
            Difference <Marker n={2} />
          </p>
          <p className="text-lg font-bold">$1,225.25</p>
        </WBox>
        <WBox>
          <p className="text-ink-muted text-xs">Progress</p>
          <p className="font-semibold">38 matched · 2 suggested · 3 open</p>
        </WBox>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Marker n={3} /> <span className="text-ink-muted">Statement on the left, the books on the right</span>
      </div>
      <WTable
        cols={['On the statement', '', 'In the books', 'Why', 'Action']}
        highlight={[2, 3, 4]}
        wrap
        rows={rows.map((r) => [
          r[0],
          r[1],
          r[2],
          <span key="w" className="text-ink-muted">
            {r[3]}
          </span>,
          <WButton key="a" primary={r[4] === 'Match'}>
            {r[4]}
          </WButton>,
        ])}
      />
      <p className="text-ink-muted mt-3 flex items-center gap-2 text-sm">
        <Marker n={4} /> Each action creates a real record — never a silent adjustment.
      </p>
    </WireFrame>
  )
}

export function D1CloseMonth() {
  const checks: [boolean, string, string][] = [
    [true, 'Bank · Main reconciled', 'Matched to statement up to 31 Oct'],
    [true, 'Mobile money · [Provider 1] reconciled', 'Matched up to 31 Oct'],
    [false, 'Mobile money · [Provider 2] reconciled', '2 unmatched transactions in October'],
    [true, 'All October bills entered', '12 bills · last one 30 Oct'],
    [false, '3 draft invoices dated October', 'Finish and send, or delete them'],
    [true, 'Stock count recorded', '31 Oct · 2 adjustments ($184.50 shrinkage)'],
  ]
  return (
    <WireFrame
      code="D1 · Close the month"
      active="Accounts & journal"
      title="Close October 2026"
      meta="4 of 6 checks done"
      rules={[
        'A guided checklist instead of guesswork. Each open item links straight to the screen that fixes it (e.g. Fix → Reconcile).',
        'A one-glance result before locking, so the Owner sees the month’s profit and that the books balance.',
        'Locking protects reported figures. Only the Owner can lock; reopening also needs the Owner and a written reason, kept in the audit log.',
        'Proposed: a reminder to the Accountant on the 3rd of each month if last month is still open.',
      ]}
      next="Fix the 2 open checks, then Lock"
    >
      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <WBox title="Checklist" marker={1}>
          <ul className="flex flex-col">
            {checks.map(([done, title, detail]) => (
              <li
                key={title}
                className="border-line flex items-center gap-3 border-t py-3 first:border-t-0 first:pt-0"
              >
                <span
                  aria-label={done ? 'Done' : 'To do'}
                  className={
                    done
                      ? 'bg-ink grid size-6 shrink-0 place-items-center rounded-full text-xs text-white'
                      : 'border-ink grid size-6 shrink-0 place-items-center rounded-full border-2 text-xs font-bold'
                  }
                >
                  {done ? '✓' : '!'}
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-ink-muted text-xs">{detail}</span>
                </span>
                {done ? <span className="text-ink-muted text-xs">Done</span> : <WButton primary>Fix</WButton>}
              </li>
            ))}
          </ul>
        </WBox>
        <div className="flex flex-col gap-4">
          <WBox title="October at a glance" marker={2}>
            <div className="flex flex-col gap-1.5">
              <Row label="Income" value="$49,000.00" />
              <Row label="Expenses" value="$33,700.00" />
              <Row label="Net profit" value="$15,300.00" bold />
              <Row label={<span className="text-ink-muted">Trial balance</span>} value="Debits = credits ✓" />
            </div>
          </WBox>
          <WBox title="Lock the period · Owner only" marker={3} className="border-ink border-2">
            <p className="text-sm">
              After locking, nothing dated 31 Oct or earlier can be added, changed or deleted.
            </p>
            <p className="border-line-input text-ink-muted mt-3 grid min-h-10 place-items-center rounded-md border border-dashed text-sm font-semibold">
              Lock October — finish 2 checks first
            </p>
          </WBox>
        </div>
      </div>
      <p className="text-ink-muted mt-4 flex items-center gap-2 text-sm">
        <Marker n={4} /> Reminder on the 3rd of each month if the previous month is open.
      </p>
    </WireFrame>
  )
}
