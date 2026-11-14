/**
 * The contract between screens and the API. Screens depend on these types, not on a backend.
 * Money is a decimal string ("1234.50"); dates are ISO "yyyy-MM-dd".
 */
export type Money = string
export type ISODate = string

export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'
export type PaymentMethod = 'bank' | 'mobile' | 'credit'
export type Role = 'owner' | 'accountant' | 'cashier' | 'sales'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string
  creditLimit: Money
  balance: Money
  overdue: Money
}

export interface InvoiceLine {
  itemId: string
  description: string
  quantity: number
  unitPrice: Money
  amount: Money
}

export interface Payment {
  id: string
  date: ISODate
  method: PaymentMethod
  accountId: string | null // null for customer credit
  reference: string
  amount: Money
  recordedBy: Role
  matched: boolean
}

export interface ActivityEntry {
  at: string // ISO date-time
  kind: 'created' | 'sent' | 'viewed' | 'payment' | 'reminder'
  by: Role | 'customer'
  amount?: Money
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  issueDate: ISODate
  dueDate: ISODate
  lines: InvoiceLine[]
  total: Money
  paid: Money
  due: Money
  status: InvoiceStatus
  payments: Payment[]
  activity: ActivityEntry[]
}

export interface MoneyAccount {
  id: 'bank-main' | 'mobile-1' | 'mobile-2'
  kind: 'bank' | 'mobile'
  balance: Money
  unmatched: number
}

export interface DashboardSummary {
  revenueThisMonth: Money
  revenueSameDaysLastMonth: Money
  receivables: Money
  openInvoices: number
  overdue: Money
  overdueCount: number
  cash: Money
  incomeVsExpenses: { month: string; income: Money; expenses: Money }[] // month "yyyy-MM"
  aging: { bucket: 'current' | 'd30' | 'd60' | 'd90' | 'd90plus'; amount: Money }[]
  recentInvoices: Invoice[]
  accounts: MoneyAccount[]
}

export interface RecordPaymentInput {
  amount: Money
  date: ISODate
  method: PaymentMethod
  accountId: string | null
  reference: string
}

export interface Item {
  id: string
  name: string
  unitPrice: Money
  stock: number
  reorderLevel: number
}

export interface CustomerSummary extends Customer {
  openInvoices: number
}

// ── Purchases (batch 3) ──────────────────────────────────
export interface Vendor {
  id: string
  name: string
  phone: string
  owed: Money
  overdue: Money
  openBills: number
}

export type BillStatus = 'approval' | 'unpaid' | 'partial' | 'overdue' | 'paid'

export interface BillLine {
  itemId: string | null // null = expense (rent, electricity…)
  description: string
  quantity: number
  unitCost: Money
  amount: Money
}

export interface Bill {
  id: string
  vendorId: string
  vendorName: string
  vendorRef: string // the vendor's own bill number
  billDate: ISODate
  dueDate: ISODate
  poId: string | null
  lines: BillLine[]
  total: Money
  paid: Money
  due: Money
  needsApproval: boolean
  approved: boolean
  status: BillStatus
}

export type OrderStatus = 'open' | 'partial' | 'received'

export interface PurchaseOrder {
  id: string
  vendorId: string
  vendorName: string
  orderDate: ISODate
  expectedDate: ISODate
  lines: { itemId: string; description: string; ordered: number; received: number; unitCost: Money }[]
  total: Money
  status: OrderStatus
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'expired' | 'converted'

export interface Quote {
  id: string
  customerId: string
  customerName: string
  issueDate: ISODate
  validUntil: ISODate
  lines: InvoiceLine[]
  total: Money
  status: QuoteStatus
  invoiceId: string | null
}

export interface ReceivedPayment extends Payment {
  invoiceId: string
  invoiceNumber: string
  customerName: string
}

export interface CreateBillInput {
  vendorId: string
  vendorRef: string
  billDate: ISODate
  dueDate: ISODate
  poId: string | null
  lines: { itemId: string | null; description: string; quantity: number; unitCost: Money }[]
  receiveIntoStock: boolean
}

export interface PayBillsInput {
  billIds: string[]
  accountId: string
  date: ISODate
}

export interface CreateInvoiceInput {
  customerId: string
  issueDate: ISODate
  dueDate: ISODate
  lines: { itemId: string; quantity: number }[]
  note: string
  /** true = send now (stock and books update); false = save as draft. */
  send: boolean
}
