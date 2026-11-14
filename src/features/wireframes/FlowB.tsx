import { Marker, Row, WBox, WButton, WField, WTable, WireFrame } from './kit'

/* Flow B — buy from a vendor: bill → payment */

export function B1NewBill() {
  return (
    <WireFrame
      code="B1 · New bill"
      active="Bills"
      crumb={{ label: 'Bills', to: '/wireframes' }}
      title="New bill"
      actions={
        <>
          <WButton>Save draft</WButton>
          <WButton primary to="/wireframes/b2">
            Save &amp; send for approval
          </WButton>
        </>
      }
      rules={[
        'Start from a purchase order and the lines fill in. Bills without an order (rent, electricity) pick an expense account instead of an item.',
        'Enter what actually arrived. Short deliveries are flagged and the order stays open, so you never pay for goods you did not get.',
        'Receiving adds the goods to stock and updates each item’s average cost, which keeps profit figures right.',
        'Proposed approval limit: bills over $10,000 wait for the Owner before they can be paid. The limit is changeable in Settings.',
      ]}
      next="Save & send for approval"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WField label="Vendor" value="Gulf Grain Importers ▾" strong />
        <WField label="Vendor's bill no." value="GGI-61840" />
        <WField label="Bill date" value="12 Nov 2026" />
        <WField label="Due (Net 30)" value="12 Dec 2026" muted />
      </div>
      <p className="border-line-input mt-4 flex items-center gap-2 rounded-md border border-dashed bg-[#fafbfc] px-3 py-2 text-sm">
        <Marker n={1} /> Linked to purchase order <strong>PO-0412</strong> · lines filled from the order ·{' '}
        <u>Unlink</u>
      </p>
      <div className="mt-4">
        <WTable
          cols={['Item', 'Ordered', 'Received', 'Unit cost', 'Amount']}
          numericCols={[1, 2, 3, 4]}
          highlight={[1]}
          rows={[
            ['Rice · 25 kg bag', '200', '200', '$48.00', '$9,600.00'],
            ['Sugar · 50 kg bag', '80', <strong key="r">60 ⚠</strong>, '$61.50', '$3,690.00'],
          ]}
        />
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Marker n={2} /> 20 bags of sugar still to come — the order stays open for them.
        </p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3">
          <p className="flex items-center gap-2 text-sm">
            <span className="bg-slate inline-block h-5 w-9 rounded-full" aria-hidden /> Receive these items
            into stock now <Marker n={3} />
          </p>
          <p className="border-line-input text-ink-muted grid min-h-16 place-items-center rounded-lg border-2 border-dashed text-sm">
            Drop the vendor's invoice here (photo or PDF) · ggi-61840.pdf attached ✓
          </p>
        </div>
        <WBox>
          <Row label="Total" value="$13,290.00" bold />
          <p className="border-ink mt-3 flex gap-2 rounded-md border-2 px-2 py-1.5 text-[13px]">
            <Marker n={4} /> Over $10,000 — the Owner must approve before payment.
          </p>
        </WBox>
      </div>
    </WireFrame>
  )
}

export function B2PayBills() {
  const bills = [
    ['☑', 'PW-5531', 'Packwell Supplies', '18 Nov', 'Under limit', '$1,240.00'],
    ['☑', 'CE-11/26', 'City Electric', '20 Nov', 'Under limit', '$386.40'],
    ['☐', 'RENT-NOV', 'Harbour Properties (rent)', '30 Nov', 'Under limit', '$2,500.00'],
    ['☐', 'CT-9047', 'Coastline Transport', '5 Dec', 'Under limit', '$910.00'],
    ['☑', 'GGI-61840', 'Gulf Grain Importers', '12 Dec', '✓ Approved by Owner', '$13,290.00'],
  ]
  return (
    <WireFrame
      code="B2 · Pay bills"
      active="Bills"
      crumb={{ label: 'New bill', to: '/wireframes/b1' }}
      title="Pay bills"
      meta="5 unpaid · $18,326.40 owed to vendors"
      rules={[
        'Sorted by due date, most urgent first. A bill over the approval limit cannot be ticked until the Owner approves it.',
        'Pick the bank or wallet to pay from. The balance after payment is shown, so no account is overdrawn by mistake.',
        'Pay several bills at once — each still gets its own payment record, so vendor statements and the bank reconciliation line up.',
        'Behind the scenes: Accounts payable goes down, the bank goes down. Shown to Owner and Accountant on each bill.',
      ]}
      next="End of Flow B"
    >
      <div className="mb-2 flex items-center gap-2 text-sm">
        <Marker n={1} /> <span className="text-ink-muted">Tick bills to pay</span>
      </div>
      <WTable
        cols={['', 'Bill', 'Vendor', 'Due', 'Approval', 'Amount']}
        numericCols={[5]}
        highlight={[0, 1, 4]}
        rows={bills}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <WField
          label="Pay from"
          value="Bank · Main account ▾"
          strong
          marker={2}
          hint="Balance $52,410.75 → after $37,494.35"
        />
        <WField label="Method" value="Bank transfer ▾" />
        <WField label="Payment date" value="14 Nov 2026" />
      </div>
      <div className="border-line mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[#fafbfc] p-4">
        <span className="flex items-center gap-2 text-sm">
          <Marker n={3} /> 3 bills selected · each gets its own record <Marker n={4} />
        </span>
        <WButton primary>Pay 3 bills · $14,916.40</WButton>
      </div>
    </WireFrame>
  )
}
