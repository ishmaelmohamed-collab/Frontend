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

// ── Money & books (batch 4) ──────────────────────────────
export type AccountId = MoneyAccount['id']

export type BankTxnKind = 'receipt' | 'billPayment' | 'transferIn' | 'transferOut' | 'fee' | 'unapplied'

/** One movement in a bank or wallet account, as the books see it. Amount is signed: + in, − out. */
export interface BankTxn {
  id: string
  accountId: AccountId
  date: ISODate
  kind: BankTxnKind
  party: string // customer, vendor or other account
  reference: string
  amount: Money
  matched: boolean
  link: { kind: 'invoice' | 'bill'; id: string } | null
  balanceAfter: Money
}

/**
 * A line from the imported bank / wallet statement.
 * suggested = the books have a likely match · missing = an open invoice was paid but never recorded ·
 * fee = only on the statement · unknown = money in, payer not known · matched = done.
 */
export type StatementState = 'matched' | 'suggested' | 'missing' | 'fee' | 'unknown'

export interface StatementLine {
  id: string
  accountId: AccountId
  date: ISODate
  text: string // as printed on the statement
  reference: string
  amount: Money
  state: StatementState
  why: 'exact' | 'amountCustomer' | null
  bookTxnId: string | null
  invoiceId: string | null
  /** How it was resolved, once matched. */
  resolution: 'matched' | 'recorded' | 'fee' | 'held' | null
}

export interface Reconciliation {
  accountId: AccountId
  statementDate: ISODate
  statementBalance: Money
  bookBalance: Money
  difference: Money
  lines: StatementLine[]
  /** Matched earlier, from previous statements. */
  matchedBefore: number
}

export type ResolveAction = 'match' | 'record' | 'fee' | 'hold'

export interface TransferInput {
  fromId: AccountId
  toId: AccountId
  amount: Money
  date: ISODate
  reference: string
}

export type LedgerType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'

export interface LedgerAccount {
  code: string
  type: LedgerType
  /** Bank, wallet, receivable and payable accounts only move through their own screens. */
  system: boolean
  /** Natural-sign balance (assets/expenses: debit − credit; others: credit − debit). */
  balance: Money
  debit: Money
  credit: Money
}

export type JournalSource =
  'opening' | 'invoice' | 'payment' | 'bill' | 'billPayment' | 'transfer' | 'fee' | 'unapplied' | 'manual'

export interface JournalLine {
  accountCode: string
  debit: Money
  credit: Money
}

export interface JournalEntry {
  id: string
  date: ISODate
  source: JournalSource
  reference: string // document number, e.g. INV-3101
  party: string
  memo: string // free text, manual entries only
  lines: JournalLine[]
  total: Money
  by: Role
}

export interface JournalInput {
  date: ISODate
  memo: string
  lines: { accountCode: string; debit: Money; credit: Money }[]
}

export type CloseCheckId =
  'reconcile-bank-main' | 'reconcile-mobile-1' | 'reconcile-mobile-2' | 'drafts' | 'approvals' | 'stockCount'

export interface CloseCheck {
  id: CloseCheckId
  done: boolean
  count: number
}

export interface PeriodEvent {
  at: string // ISO date-time
  action: 'lock' | 'reopen'
  month: string // yyyy-MM
  by: Role
  reason: string
}

export interface MonthClose {
  month: string // yyyy-MM — the month being closed (last month)
  checks: CloseCheck[]
  income: Money
  expenses: Money
  debits: Money
  credits: Money
  lockedThrough: ISODate | null
  locked: boolean
  /** True from the 3rd of the month while last month is still open (business rule 5). */
  reminder: boolean
  history: PeriodEvent[]
}

// ── Sign-in, users & settings (batch 5) ──────────────────
export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
}

export interface Session {
  token: string
  user: User
}

export interface Settings {
  companyName: string
  address: string
  phone: string
  email: string
  provider1: string // mobile-money provider names (client still to confirm)
  provider2: string
  approvalLimit: Money // rule 1
  reminderDay: number // rule 5
}

export type ReportKind = 'profit' | 'balance' | 'aging' | 'sales'

export interface ReportLine {
  /** Message key for the label (account names, section titles), or plain text for customer/item names. */
  label: string
  labelIsKey: boolean
  amount: Money
  /** For the aging report: one amount per bucket. */
  buckets?: Money[]
  kind: 'row' | 'subtotal' | 'total' | 'heading'
  code?: string
}

export interface Report {
  kind: ReportKind
  from: ISODate | null
  to: ISODate
  lines: ReportLine[]
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
