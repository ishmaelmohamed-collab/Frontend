import { lazy, Suspense, type ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import { Skeleton } from '@/components/ui/States'
import { AppShell } from './AppShell'
import type { Permission } from '@/lib/permissions'
import { Guard, NotFound, RequireUser } from './ComingSoon'

const SignInPage = lazy(() => import('@/features/admin/SignInPage').then((m) => ({ default: m.SignInPage })))
const ReportsPage = lazy(() =>
  import('@/features/admin/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const SettingsPage = lazy(() =>
  import('@/features/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })),
)

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
const BankingPage = lazy(() =>
  import('@/features/books/BankingPage').then((m) => ({ default: m.BankingPage })),
)
const ReconcilePage = lazy(() =>
  import('@/features/books/ReconcilePage').then((m) => ({ default: m.ReconcilePage })),
)
const CloseMonthPage = lazy(() =>
  import('@/features/books/CloseMonthPage').then((m) => ({ default: m.CloseMonthPage })),
)
const AccountsPage = lazy(() =>
  import('@/features/books/AccountsPage').then((m) => ({ default: m.AccountsPage })),
)
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

const page = (el: ReactNode, perm?: Permission) => (
  <Guard perm={perm}>
    <Suspense fallback={<Skeleton rows={6} label="Loading…" />}>{el}</Suspense>
  </Guard>
)

export function App() {
  return (
    <Routes>
      <Route path="sign-in" element={page(<SignInPage />)} />
      <Route
        element={
          <RequireUser>
            <AppShell />
          </RequireUser>
        }
      >
        <Route index element={page(<DashboardPage />)} />
        <Route path="invoices" element={page(<InvoicesPage />, 'sales.view')} />
        <Route path="invoices/new" element={page(<NewInvoicePage />, 'sales.edit')} />
        <Route path="invoices/:id" element={page(<InvoiceDetailPage />, 'sales.view')} />
        <Route path="customers" element={page(<CustomersPage />, 'sales.view')} />
        <Route path="items" element={page(<ItemsPage />, 'items.view')} />
        <Route path="bills" element={page(<BillsPage />, 'purchases.view')} />
        <Route path="bills/new" element={page(<NewBillPage />, 'purchases.edit')} />
        <Route path="bills/pay" element={page(<PayBillsPage />, 'bills.pay')} />
        <Route path="vendors" element={page(<VendorsPage />, 'purchases.view')} />
        <Route path="orders" element={page(<OrdersPage />, 'purchases.view')} />
        <Route path="quotes" element={page(<QuotesPage />, 'sales.view')} />
        <Route path="payments" element={page(<PaymentsPage />, 'money.view')} />
        <Route path="banking" element={page(<BankingPage />, 'money.view')} />
        <Route path="reconcile" element={page(<ReconcilePage />, 'money.view')} />
        <Route path="close" element={page(<CloseMonthPage />, 'books.view')} />
        <Route path="accounts" element={page(<AccountsPage />, 'books.view')} />
        <Route path="reports" element={page(<ReportsPage />, 'reports.view')} />
        <Route path="settings" element={page(<SettingsPage />, 'settings.view')} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="direction" element={page(<DirectionPage />)} />
      <Route path="design-system" element={page(<DesignSystemPage />)} />
      <Route path="wireframes/*" element={page(<Wireframes />)} />
    </Routes>
  )
}
