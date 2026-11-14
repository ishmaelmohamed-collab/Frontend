import { Link } from 'react-router'
import { Marker, Row, WBox, WButton, WField, WStatus, WTable, WireFrame } from './kit'

/* Flow A — sell on credit: invoice → payment */

export function A1Invoices() {
  const rows = [
    ['INV-3108', 'Sahel Wholesale', '14 Nov', '28 Nov', '$1,120.00', 'Draft'],
    ['INV-3107', 'Al-Noor Trading', '14 Nov', '28 Nov', '$2,480.00', 'Sent'],
    ['INV-3106', 'Crescent Foods Ltd.', '13 Nov', '27 Nov', '$0.00', 'Paid'],
    ['INV-3105', 'Horizon Mini Market', '12 Nov', '26 Nov', '$1,955.00', 'Partly paid'],
    ['INV-3104', 'Riverside Retail', '10 Nov', '24 Nov', '$740.25', 'Sent'],
    ['INV-3103', 'Green Valley Grocers', '4 Nov', '11 Nov', '$4,105.20', 'Overdue'],
    ['INV-3101', 'Al-Noor Trading', '1 Nov', '8 Nov', '$1,504.50', 'Overdue'],
  ]
  return (
    <WireFrame
      code="A1 · Invoices list"
      active="Invoices"
      title="Invoices"
      actions={
        <>
          <WButton marker={4}>Export</WButton>
          <WButton primary to="/wireframes/a2">
            + New invoice
          </WButton>
        </>
      }
      rules={[
        'Tabs show live counts. "Unpaid" means Sent + Partly paid + Overdue, oldest due date first.',
        'Click a row to open the invoice. Tick rows for bulk actions: send reminders, download PDFs.',
        'The total under the list always matches the rows shown, so the list works as a quick report.',
        'Only Owner and Accountant can export. Sales staff see the list without the Export button.',
      ]}
      next="+ New invoice"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Marker n={1} />
          {['All 128', 'Draft 3', 'Unpaid 41', 'Overdue 12', 'Paid 72'].map((t, i) => (
            <span
              key={t}
              className={
                i === 0
                  ? 'bg-ink rounded-md px-3 py-1.5 text-sm font-semibold text-white'
                  : 'border-line-input rounded-md border px-3 py-1.5 text-sm'
              }
            >
              {t}
            </span>
          ))}
        </div>
        <span className="border-line-input text-ink-muted flex min-h-9 w-64 items-center rounded-md border px-3 text-sm">
          Search number or customer
        </span>
      </div>
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Marker n={2} /> <span className="text-ink-muted">Rows open the invoice</span>
      </div>
      <WTable
        cols={['Number', 'Customer', 'Issued', 'Due', 'Amount due', 'Status']}
        numericCols={[4]}
        rows={rows.map((r) => [
          <Link key="n" to="/wireframes/a3" className="font-semibold underline">
            {r[0]}
          </Link>,
          r[1],
          r[2],
          r[3],
          r[4],
          <WStatus key="s" s={r[5]} />,
        ])}
      />
      <p className="text-ink-muted mt-3 flex items-center gap-2 text-sm">
        <Marker n={3} /> 7 of 128 shown · total due in view <strong className="text-ink">$11,904.95</strong>
      </p>
    </WireFrame>
  )
}

export function A2NewInvoice() {
  const lines = [
    ['Rice · 25 kg bag', 'In stock: 140', '20', '$62.00', '$1,240.00'],
    ['Cooking oil · 20 L', 'In stock: 36', '10', '$84.50', '$845.00'],
    ['Sugar · 50 kg bag', 'Low stock: 6 left', '5', '$79.00', '$395.00'],
  ]
  return (
    <WireFrame
      code="A2 · New invoice"
      active="Invoices"
      crumb={{ label: 'Invoices', to: '/wireframes/a1' }}
      title="New invoice"
      meta="INV-3107 · numbered automatically · draft saved 12 seconds ago"
      actions={
        <>
          <WButton>Save draft</WButton>
          <WButton primary to="/wireframes/a3" marker={4}>
            Save &amp; send
          </WButton>
        </>
      }
      rules={[
        'Choosing the customer shows their snapshot: balance, credit limit, overdue invoices. Going over the limit needs the Owner.',
        'Type to find items. Price comes from the item list; Sales staff cannot change it. Stock left shows on each line.',
        'Totals are calculated, never typed. There is no tax line; it appears automatically if tax is ever switched on.',
        'Stock and the books change only when the invoice is sent — never while it is a draft.',
        'Works fully from the keyboard: Tab between fields, Enter adds a line, Ctrl+S saves the draft.',
      ]}
      next="Save & send"
    >
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-3">
          <WField label="Customer" value="Al-Noor Trading ▾" strong marker={1} />
          <div className="grid grid-cols-3 gap-3">
            <WField label="Invoice date" value="14 Nov 2026" />
            <WField label="Terms" value="Net 14 ▾" />
            <WField label="Due date" value="28 Nov 2026" muted />
          </div>
        </div>
        <WBox title="Customer snapshot" dashed>
          <div className="flex flex-col gap-1.5">
            <Row label="Balance owed" value="$1,504.50" />
            <Row label="Credit limit" value="$10,000.00" />
            <Row label="Available after this invoice" value="$6,015.50" />
            <p className="border-ink mt-1 rounded-md border-2 px-2 py-1 text-[13px]">
              ⚠ INV-3101 is 6 days overdue · <u>Send reminder</u>
            </p>
          </div>
        </WBox>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
          Lines <Marker n={2} />
        </div>
        <WTable
          cols={['Item', 'Qty', 'Unit price', 'Amount']}
          numericCols={[1, 2, 3]}
          rows={lines.map((l) => [
            <span key="i" className="flex flex-col">
              <span className="font-medium">{l[0]}</span>
              <span className="text-ink-muted text-xs">{l[1]}</span>
            </span>,
            l[2],
            l[3],
            l[4],
          ])}
        />
        <p className="text-ink-muted mt-2 text-sm">
          <strong className="text-ink">+ Add line</strong> · or press Enter on the last line
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_300px]">
        <WField label="Note to customer" value="Pay by bank transfer or mobile money." />
        <WBox>
          <div className="flex flex-col gap-1.5">
            <Row label="Subtotal" value="$2,480.00" />
            <Row label="Discount" value="$0.00" />
            <Row
              label={
                <span className="flex items-center gap-2">
                  Total <Marker n={3} />
                </span>
              }
              value="$2,480.00"
              bold
            />
          </div>
        </WBox>
      </div>
    </WireFrame>
  )
}

export function A3InvoiceSent() {
  return (
    <WireFrame
      code="A3 · Invoice sent"
      active="Invoices"
      crumb={{ label: 'Invoices', to: '/wireframes/a1' }}
      title={
        <span className="flex items-center gap-3">
          INV-3107 <WStatus s="Sent" />
        </span>
      }
      meta="Al-Noor Trading · due 28 Nov 2026 · $2,480.00 due"
      actions={
        <>
          <WButton>Send reminder</WButton>
          <WButton>PDF</WButton>
          <WButton marker={3}>More ▾</WButton>
          <WButton primary to="/wireframes/a4" marker={1}>
            Record payment
          </WButton>
        </>
      }
      rules={[
        'The single obvious next step is the slate button. On a sent invoice it is always Record payment.',
        'Activity is a permanent history — who created, sent, changed or opened it. Nothing can be removed (audit trail).',
        'More ▾ holds Duplicate, Credit note and Void. Void is Owner-only, needs a reason, and keeps the invoice visible, crossed out.',
        'The document is exactly what the customer receives, including bank and mobile-money payment details.',
      ]}
      next="Record payment"
    >
      <p className="border-line-input bg-panel mb-4 rounded-md border px-3 py-2 text-sm">
        ✓ INV-3107 sent to accounts@alnoortrading.example · <u>Undo (10 s)</u>
      </p>
      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <WBox title="Document" marker={4} className="bg-[#fafbfc]">
          <div className="flex justify-between text-sm">
            <span className="border-line-input text-ink-muted rounded border border-dashed px-6 py-2">
              [Logo]
            </span>
            <span className="text-end">
              <strong className="block text-base">INVOICE</strong>INV-3107 · 14 Nov 2026
            </span>
          </div>
          <p className="mt-4 text-sm">
            Bill to <strong>Al-Noor Trading</strong>
          </p>
          <div className="mt-3 flex flex-col gap-1">
            <Row label="Rice · 25 kg × 20" value="$1,240.00" />
            <Row label="Cooking oil · 20 L × 10" value="$845.00" />
            <Row label="Sugar · 50 kg × 5" value="$395.00" />
            <Row label="Amount due" value="$2,480.00" bold />
          </div>
          <p className="text-ink-muted mt-4 text-xs">
            Pay to: [Bank details] · Mobile money: [Provider number]
          </p>
        </WBox>
        <div className="flex flex-col gap-4">
          <WBox title="Payments">
            <p className="text-ink-muted text-sm">No payments yet.</p>
          </WBox>
          <WBox title="Activity" marker={2}>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                Opened by customer <span className="text-ink-muted block text-xs">Today 11:05</span>
              </li>
              <li>
                Sent by email <span className="text-ink-muted block text-xs">Today 10:43 · Owner</span>
              </li>
              <li>
                Created <span className="text-ink-muted block text-xs">Today 10:42 · Owner</span>
              </li>
            </ul>
          </WBox>
        </div>
      </div>
    </WireFrame>
  )
}

export function A4RecordPayment() {
  return (
    <WireFrame
      code="A4 · Record payment"
      active="Invoices"
      title="INV-3107"
      meta="Side panel opens over the invoice"
      rules={[
        'Opens as a side panel over the invoice, so you never lose your place. Amount starts as the full amount due; change it for a part payment.',
        'Only the three agreed methods: bank transfer, mobile money, customer credit (money the customer already has with you). No cash.',
        'Transaction ID is required for bank and mobile money — it is what lets the payment be matched to the statement later (Flow C).',
        'The result is shown before saving: Paid, Partly paid, or — if they paid too much — the extra becomes customer credit.',
        'Cashier, Accountant and Owner can record payments. Sales staff cannot.',
      ]}
      next="Record payment"
    >
      <div className="relative min-h-[540px] overflow-hidden rounded-lg">
        <div className="bg-panel border-line absolute inset-0 rounded-lg border p-4">
          <div className="h-5 w-40 rounded bg-[#e5e7eb]" />
          <div className="mt-3 h-64 rounded bg-[#f1f3f6]" />
        </div>
        <div className="absolute inset-0 bg-[#1c2430]/45" aria-hidden />
        <section
          aria-label="Record payment panel"
          className="bg-panel absolute inset-y-0 end-0 flex w-full max-w-md flex-col border-s border-[#8a94a3]"
        >
          <div className="border-line flex items-start justify-between border-b p-5">
            <div>
              <h2 className="text-lg font-bold">Record payment</h2>
              <p className="text-ink-muted text-sm">INV-3107 · Al-Noor Trading</p>
            </div>
            <Link to="/wireframes/a3" aria-label="Close" className="text-ink-muted px-2 text-lg">
              ✕
            </Link>
          </div>
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            <div className="grid grid-cols-2 gap-3">
              <WField label="Amount received" value="$2,480.00" strong numeric marker={1} />
              <WField label="Payment date" value="14 Nov 2026" />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold">
                Paid by <Marker n={2} />
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-sm">
                <span className="border-line-input grid min-h-10 place-items-center rounded-md border">
                  Bank transfer
                </span>
                <span className="border-ink grid min-h-10 place-items-center rounded-md border-2 bg-[#f1f3f6] font-bold">
                  ● Mobile money
                </span>
                <span className="border-line-input grid min-h-10 place-items-center rounded-md border">
                  Customer credit
                </span>
              </div>
            </div>
            <WField label="Received into" value="Mobile money · [Provider 1] ▾" />
            <WField
              label="Transaction ID (required)"
              value="MP-7720-1934"
              marker={3}
              hint="From the customer's SMS or the wallet statement."
            />
            <WBox title="Result" marker={4} dashed>
              <div className="flex flex-col gap-1.5">
                <Row label="Amount due" value="$2,480.00" />
                <Row label="This payment" value="−$2,480.00" />
                <Row label="Left to pay" value="$0.00" bold />
                <p className="text-sm">
                  → Invoice becomes <strong>Paid</strong>
                </p>
              </div>
            </WBox>
          </div>
          <div className="border-line flex justify-end gap-2 border-t bg-[#fafbfc] p-4">
            <WButton to="/wireframes/a3">Cancel</WButton>
            <WButton primary to="/wireframes/a5">
              Record payment
            </WButton>
          </div>
        </section>
      </div>
    </WireFrame>
  )
}

export function A5InvoicePaid() {
  return (
    <WireFrame
      code="A5 · Invoice paid"
      active="Invoices"
      crumb={{ label: 'Invoices', to: '/wireframes/a1' }}
      title={
        <span className="flex items-center gap-3">
          INV-3107 <WStatus s="Paid" />
        </span>
      }
      meta="Al-Noor Trading · paid 14 Nov 2026 · $0.00 due"
      actions={
        <>
          <WButton>Send receipt</WButton>
          <WButton primary to="/wireframes/a1">
            Back to invoices
          </WButton>
        </>
      }
      rules={[
        'Each payment shows method, transaction ID and who recorded it. "Not matched yet" turns into "Matched" after reconciliation (Flow C).',
        'Owner and Accountant can see the bookkeeping entries made automatically. Cashier and Sales never see this box.',
        'Knock-on effects are shown, not hidden: the customer’s new balance and stock levels, with a reorder alert when an item runs low.',
      ]}
      next="End of Flow A — Back to invoices restarts it"
    >
      <p className="border-ink mb-4 rounded-md border-2 px-3 py-2 text-sm">
        ✓ Payment of $2,480.00 recorded · INV-3107 is now <strong>Paid</strong>
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <WBox title="Payments" marker={1}>
          <Row label={<strong>Mobile money · [Provider 1]</strong>} value={<strong>$2,480.00</strong>} />
          <p className="text-ink-muted mt-1 text-xs">
            14 Nov 2026 · MP-7720-1934 · Cashier · Not matched yet
          </p>
        </WBox>
        <WBox title="In the books · Owner & Accountant only" marker={2} dashed>
          <div className="flex flex-col gap-1 text-sm">
            <p className="text-ink-muted text-xs">When sent</p>
            <Row label="Dr Accounts receivable" value="2,480.00" />
            <Row label="   Cr Sales" value="2,480.00" />
            <Row label="Dr Cost of goods sold" value="1,786.00" />
            <Row label="   Cr Inventory" value="1,786.00" />
            <p className="text-ink-muted mt-2 text-xs">When paid</p>
            <Row label="Dr Mobile money · [Provider 1]" value="2,480.00" />
            <Row label="   Cr Accounts receivable" value="2,480.00" />
            <p className="text-ink-muted mt-2 text-xs">Debits always equal credits. Nobody types these.</p>
          </div>
        </WBox>
      </div>
      <WBox className="mt-4" title="What changed" marker={3}>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
          <span>
            Customer still owes <strong>$1,504.50</strong> (INV-3101, overdue)
          </span>
          <span>
            Stock now: Rice 120 · Oil 26 · Sugar 1 — <strong>reorder alert sent</strong>
          </span>
        </div>
      </WBox>
    </WireFrame>
  )
}
