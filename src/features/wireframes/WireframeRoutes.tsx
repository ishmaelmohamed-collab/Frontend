import { Route, Routes } from 'react-router'
import { A1Invoices, A2NewInvoice, A3InvoiceSent, A4RecordPayment, A5InvoicePaid } from './FlowA'
import { B1NewBill, B2PayBills } from './FlowB'
import { C1Reconcile, D1CloseMonth } from './FlowCD'
import { WireframesIndex } from './WireframesIndex'

/** Phase 3 clickable wireframes, mounted at /wireframes/*. */
export function WireframeRoutes() {
  return (
    <Routes>
      <Route index element={<WireframesIndex />} />
      <Route path="a1" element={<A1Invoices />} />
      <Route path="a2" element={<A2NewInvoice />} />
      <Route path="a3" element={<A3InvoiceSent />} />
      <Route path="a4" element={<A4RecordPayment />} />
      <Route path="a5" element={<A5InvoicePaid />} />
      <Route path="b1" element={<B1NewBill />} />
      <Route path="b2" element={<B2PayBills />} />
      <Route path="c1" element={<C1Reconcile />} />
      <Route path="d1" element={<D1CloseMonth />} />
    </Routes>
  )
}
