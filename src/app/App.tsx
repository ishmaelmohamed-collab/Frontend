import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { Skeleton } from '@/components/ui/States'
import { AppShell } from './AppShell'
import { ComingSoon, NotFound } from './ComingSoon'
import { PLANNED } from './navigation'

// Each screen downloads only when first opened (charts are heavy).
const DashboardPage = lazy(() =>
  import('@/features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const InvoicesPage = lazy(() =>
  import('@/features/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
)
const InvoiceDetailPage = lazy(() =>
  import('@/features/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })),
)
const NewInvoicePage = lazy(() =>
  import('@/features/invoices/NewInvoicePage').then((m) => ({ default: m.NewInvoicePage })),
)
const CustomersPage = lazy(() =>
  import('@/features/catalog/CustomersPage').then((m) => ({ default: m.CustomersPage })),
)
const ItemsPage = lazy(() => import('@/features/catalog/ItemsPage').then((m) => ({ default: m.ItemsPage })))
const BillsPage = lazy(() => import('@/features/purchases/BillsPage').then((m) => ({ default: m.BillsPage })))
const NewBillPage = lazy(() =>
  import('@/features/purchases/NewBillPage').then((m) => ({ default: m.NewBillPage })),
)
const PayBillsPage = lazy(() =>
  import('@/features/purchases/PayBillsPage').then((m) => ({ default: m.PayBillsPage })),
)
const lists = () => import('@/features/purchases/ListPages')
const VendorsPage = lazy(() => lists().then((m) => ({ default: m.VendorsPage })))
const OrdersPage = lazy(() => lists().then((m) => ({ default: m.OrdersPage })))
const QuotesPage = lazy(() => lists().then((m) => ({ default: m.QuotesPage })))
const PaymentsPage = lazy(() => lists().then((m) => ({ default: m.PaymentsPage })))
// Design-phase pages (kept for review)
const DirectionPage = lazy(() =>
  import('@/features/direction/DirectionPage').then((m) => ({ default: m.DirectionPage })),
)
const DesignSystemPage = lazy(() =>
  import('@/features/design-system/DesignSystemPage').then((m) => ({ default: m.DesignSystemPage })),
)
const Wireframes = lazy(() =>
  import('@/features/wireframes/WireframeRoutes').then((m) => ({ default: m.WireframeRoutes })),
)

const page = (el: ReactNode) => <Suspense fallback={<Skeleton rows={6} label="Loading…" />}>{el}</Suspense>

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={page(<DashboardPage />)} />
        <Route path="invoices" element={page(<InvoicesPage />)} />
        <Route path="invoices/new" element={page(<NewInvoicePage />)} />
        <Route path="invoices/:id" element={page(<InvoiceDetailPage />)} />
        <Route path="customers" element={page(<CustomersPage />)} />
        <Route path="items" element={page(<ItemsPage />)} />
        <Route path="bills" element={page(<BillsPage />)} />
        <Route path="bills/new" element={page(<NewBillPage />)} />
        <Route path="bills/pay" element={page(<PayBillsPage />)} />
        <Route path="vendors" element={page(<VendorsPage />)} />
        <Route path="orders" element={page(<OrdersPage />)} />
        <Route path="quotes" element={page(<QuotesPage />)} />
        <Route path="payments" element={page(<PaymentsPage />)} />
        {PLANNED.map((p) => (
          <Route key={p.to} path={p.to.slice(1)} element={<ComingSoon titleKey={p.key} batch={p.batch!} />} />
        ))}
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="direction" element={page(<DirectionPage />)} />
      <Route path="design-system" element={page(<DesignSystemPage />)} />
      <Route path="wireframes/*" element={page(<Wireframes />)} />
    </Routes>
  )
}
