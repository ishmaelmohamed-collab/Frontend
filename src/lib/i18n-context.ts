import { createContext, useContext } from 'react'
import { appAr, appEn } from './messages-app'
import { b2Ar, b2En } from './messages-batch2'
import { b3Ar, b3En } from './messages-batch3'
import { b4Ar, b4En } from './messages-batch4'
import { b5Ar, b5En } from './messages-batch5'

export type Locale = 'en' | 'ar'

/** UI text in both languages. TypeScript fails the build if a key is missing in either. */
const en = {
  'app.company': '[Your company]',
  'app.switch': 'العربية',
  'app.switchLabel': 'Switch to Arabic',
  'dir.eyebrow': 'Design direction · for approval',
  'dir.title': 'Blue fog',
  'dir.lead':
    'Two colours only — misty blue fading into slate blue — with quiet greys for text. Calm to work in all day, clear where numbers matter.',
  'dir.colour': 'Colour',
  'dir.colourNote':
    'Text always sits on the misty side of the fog, never in the middle, so it stays readable.',
  'dir.mist': 'Misty blue',
  'dir.mistUse': 'Backgrounds, highlights, selected items',
  'dir.slate': 'Slate blue',
  'dir.slateUse': 'Buttons, links, active states',
  'dir.shades': 'Shades made only from these two',
  'dir.neutrals': 'Neutrals for text and lines',
  'dir.type': 'Typography',
  'dir.typeNote':
    'Manrope for English, IBM Plex Sans Arabic for Arabic. Numbers are always tabular and left-to-right.',
  'dir.components': 'First components',
  'dir.sample': 'Applied to a real screen',
  'dir.alert': 'Warning red — overdue and errors only',
  'dir.alertNote':
    'Your decision (option B). Red is never decoration: it appears only when money is late or something went wrong, always with an icon and words.',
  'dir.alertName': 'Warning red',
  'dir.alertSampleTitle': '12 invoices are overdue',
  'dir.alertSampleBody': '$17,321.63 is past its due date. Send reminders to the customers.',
  'btn.primary': 'Save invoice',
  'btn.secondary': 'Save draft',
  'btn.quiet': 'View all',
  'btn.disabled': 'Record payment',
  'field.customer': 'Customer',
  'field.customerPh': 'Search customers',
  'field.due': 'Due date',
  'field.dueError': "That date doesn't exist. Pick one from the calendar.",
  'status.draft': 'Draft',
  'status.sent': 'Sent',
  'status.partial': 'Partly paid',
  'status.paid': 'Paid',
  'status.overdue': 'Overdue',
  'status.void': 'Void',
  'kpi.revenue': 'Revenue this month',
  'kpi.revenueNote': 'vs same days last month',
  'kpi.owed': 'Customers owe you',
  'kpi.owedNote': '41 open invoices',
  'kpi.overdue': 'Overdue',
  'kpi.overdueNote': '12 invoices past due',
  'kpi.bank': 'Bank & wallets',
  'kpi.bankNote': 'Across 3 accounts',
  'table.title': 'Recent invoices',
  'table.no': 'Number',
  'table.customer': 'Customer',
  'table.due': 'Due',
  'table.amount': 'Amount due',
  'table.status': 'Status',
  greeting: 'Good morning',
  greetingSub: 'Saturday 14 November 2026',

  // Design-system gallery (Phase 4)
  'ds.eyebrow': 'Phase 4 · Design system · for approval',
  'ds.title': 'Design system',
  'ds.intro':
    'Every building block in Blue fog, in every state. These are the real components — what you approve here is exactly what the screens will use.',
  'ds.buttons': 'Buttons',
  'ds.buttonsNote':
    'Three types; hierarchy comes from fill strength. Risky actions (void, lock) use the primary button with a warning icon and always ask to confirm.',
  'ds.forms': 'Form controls',
  'ds.feedback': 'Messages',
  'ds.feedbackNote': 'Only errors use red. Everything else stays in the two fog colours.',
  'ds.data': 'Figures, filters & tables',
  'ds.overlays': 'Side panel & confirmation',
  'ds.states': 'Loading, empty & error',
  'ds.badges': 'Status badges',
  'state.default': 'Default',
  'state.hover': 'Hover',
  'state.pressed': 'Pressed',
  'state.focus': 'Focus',
  'state.disabled': 'Disabled',
  'state.loading': 'Saving…',
  'btn.type.primary': 'Primary',
  'btn.type.secondary': 'Secondary',
  'btn.type.quiet': 'Quiet',
  'btn.cancel': 'Cancel',
  'btn.void': 'Void invoice',
  'btn.newInvoice': 'New invoice',
  'btn.print': 'Print',
  'btn.openDrawer': 'Record payment',
  'btn.openDialog': 'Void invoice…',
  'btn.review': 'Review',
  'btn.undo': 'Undo',
  'btn.tryAgain': 'Try again',
  'btn.close': 'Close',
  'f.amount': 'Amount received',
  'f.invoiceNo': 'Invoice number',
  'f.autoNumber': 'Numbers are assigned automatically.',
  'f.account': 'Received into',
  'f.bankMain': 'Bank · Main account',
  'f.mobile1': 'Mobile money · [Provider 1]',
  'f.mobile2': 'Mobile money · [Provider 2]',
  'f.method': 'Paid by',
  'f.bank': 'Bank transfer',
  'f.mobile': 'Mobile money',
  'f.credit': 'Customer credit',
  'f.reference': 'Transaction ID',
  'f.referenceHint': "From the customer's SMS or the wallet statement.",
  'f.note': 'Note to customer',
  'f.optional': 'optional',
  'f.notePh': 'Thank you for your business.',
  'f.receiveStock': 'Receive these items into stock now',
  'f.reminders': 'Send payment reminders automatically',
  'f.voidReason': 'Reason for voiding',
  'msg.infoTitle': '7 payments to match',
  'msg.infoBody': 'Payments came in that are not linked to an invoice yet.',
  'msg.successTitle': 'Payment recorded',
  'msg.successBody': 'INV-3107 is now paid.',
  'msg.attentionTitle': 'Needs Owner approval',
  'msg.attentionBody': 'Bills over $10,000 must be approved before they can be paid.',
  'msg.errorTitle': "Couldn't save the invoice",
  'msg.errorBody': 'The connection dropped. Your changes are kept — try again.',
  'msg.toast': 'Invoice INV-3107 sent to Al-Noor Trading',
  'drawer.subtitle': 'INV-3107 · Al-Noor Trading',
  'drawer.result': 'Left to pay $0.00 — the invoice becomes Paid.',
  'dialog.title': 'Void invoice INV-3107?',
  'dialog.body':
    'It stays in your records marked as void. Stock is returned and the sale is reversed in the books. This cannot be undone.',
  'filter.label': 'Show invoices',
  'filter.all': 'All',
  'filter.unpaid': 'Unpaid',
  'filter.overdue': 'Overdue',
  'filter.paid': 'Paid',
  'search.label': 'Search invoices',
  'search.ph': 'Number or customer',
  'empty.title': 'No invoices yet',
  'empty.hint': 'Create your first invoice to start tracking what customers owe.',
  'empty.filtered': 'No invoices match this search',
  'error.title': "Couldn't load invoices",
  'error.hint': 'Check your connection, then try again. Nothing you entered was lost.',
  loading: 'Loading invoices…',
} as const

type BaseKey = keyof typeof en
export type MessageKey =
  BaseKey | keyof typeof appEn | keyof typeof b2En | keyof typeof b3En | keyof typeof b4En | keyof typeof b5En

const ar: Record<BaseKey, string> = {
  'app.company': '[اسم شركتك]',
  'app.switch': 'English',
  'app.switchLabel': 'التبديل إلى الإنجليزية',
  'dir.eyebrow': 'اتجاه التصميم · للموافقة',
  'dir.title': 'الضباب الأزرق',
  'dir.lead':
    'لونان فقط — أزرق ضبابي يتدرج إلى أزرق أردوازي — مع رماديات هادئة للنصوص. مريح للعمل طوال اليوم وواضح حيث تهم الأرقام.',
  'dir.colour': 'الألوان',
  'dir.colourNote': 'يوضع النص دائماً على الجانب الفاتح من التدرج، وليس في وسطه، ليبقى واضحاً.',
  'dir.mist': 'أزرق ضبابي',
  'dir.mistUse': 'الخلفيات والإبراز والعناصر المحددة',
  'dir.slate': 'أزرق أردوازي',
  'dir.slateUse': 'الأزرار والروابط والحالات النشطة',
  'dir.shades': 'درجات مشتقة من هذين اللونين فقط',
  'dir.neutrals': 'ألوان محايدة للنصوص والخطوط',
  'dir.type': 'الخطوط',
  'dir.typeNote':
    'خط Manrope للإنجليزية وخط IBM Plex Sans Arabic للعربية. الأرقام دائماً بعرض ثابت ومن اليسار إلى اليمين.',
  'dir.components': 'أول المكونات',
  'dir.sample': 'مطبّق على شاشة حقيقية',
  'dir.alert': 'أحمر تحذيري — للمتأخرات والأخطاء فقط',
  'dir.alertNote':
    'قرارك (الخيار ب). الأحمر ليس للزينة أبداً: يظهر فقط عندما يتأخر المال أو يحدث خطأ، ودائماً مع أيقونة وكلمات.',
  'dir.alertName': 'أحمر تحذيري',
  'dir.alertSampleTitle': '12 فاتورة متأخرة',
  'dir.alertSampleBody': 'تجاوز مبلغ 17,321.63$ تاريخ استحقاقه. أرسل تذكيرات إلى العملاء.',
  'btn.primary': 'حفظ الفاتورة',
  'btn.secondary': 'حفظ كمسودة',
  'btn.quiet': 'عرض الكل',
  'btn.disabled': 'تسجيل دفعة',
  'field.customer': 'العميل',
  'field.customerPh': 'ابحث عن العملاء',
  'field.due': 'تاريخ الاستحقاق',
  'field.dueError': 'هذا التاريخ غير موجود. اختر تاريخاً من التقويم.',
  'status.draft': 'مسودة',
  'status.sent': 'مرسلة',
  'status.partial': 'مدفوعة جزئياً',
  'status.paid': 'مدفوعة',
  'status.overdue': 'متأخرة',
  'status.void': 'ملغاة',
  'kpi.revenue': 'الإيرادات هذا الشهر',
  'kpi.revenueNote': 'مقارنة بنفس الأيام من الشهر الماضي',
  'kpi.owed': 'المستحق لك من العملاء',
  'kpi.owedNote': '41 فاتورة مفتوحة',
  'kpi.overdue': 'متأخرة',
  'kpi.overdueNote': '12 فاتورة تجاوزت الاستحقاق',
  'kpi.bank': 'البنك والمحافظ',
  'kpi.bankNote': 'موزعة على 3 حسابات',
  'table.title': 'أحدث الفواتير',
  'table.no': 'الرقم',
  'table.customer': 'العميل',
  'table.due': 'الاستحقاق',
  'table.amount': 'المبلغ المستحق',
  'table.status': 'الحالة',
  greeting: 'صباح الخير',
  greetingSub: 'السبت 14 نوفمبر 2026',

  'ds.eyebrow': 'المرحلة 4 · نظام التصميم · للموافقة',
  'ds.title': 'نظام التصميم',
  'ds.intro':
    'كل عناصر البناء بأسلوب الضباب الأزرق وبجميع حالاتها. هذه هي المكونات الحقيقية — ما توافق عليه هنا هو بالضبط ما ستستخدمه الشاشات.',
  'ds.buttons': 'الأزرار',
  'ds.buttonsNote':
    'ثلاثة أنواع؛ يأتي الترتيب من قوة التعبئة. الإجراءات الحساسة (الإلغاء، الإقفال) تستخدم الزر الأساسي مع أيقونة تحذير وتطلب التأكيد دائماً.',
  'ds.forms': 'حقول الإدخال',
  'ds.feedback': 'الرسائل',
  'ds.feedbackNote': 'الأخطاء فقط تستخدم الأحمر. كل ما عداها يبقى بلوني الضباب.',
  'ds.data': 'الأرقام والفلاتر والجداول',
  'ds.overlays': 'اللوحة الجانبية والتأكيد',
  'ds.states': 'التحميل والفراغ والخطأ',
  'ds.badges': 'شارات الحالة',
  'state.default': 'عادي',
  'state.hover': 'تمرير',
  'state.pressed': 'ضغط',
  'state.focus': 'تركيز',
  'state.disabled': 'معطّل',
  'state.loading': 'جارٍ الحفظ…',
  'btn.type.primary': 'أساسي',
  'btn.type.secondary': 'ثانوي',
  'btn.type.quiet': 'هادئ',
  'btn.cancel': 'إلغاء',
  'btn.void': 'إلغاء الفاتورة',
  'btn.newInvoice': 'فاتورة جديدة',
  'btn.print': 'طباعة',
  'btn.openDrawer': 'تسجيل دفعة',
  'btn.openDialog': 'إلغاء الفاتورة…',
  'btn.review': 'مراجعة',
  'btn.undo': 'تراجع',
  'btn.tryAgain': 'حاول مرة أخرى',
  'btn.close': 'إغلاق',
  'f.amount': 'المبلغ المستلم',
  'f.invoiceNo': 'رقم الفاتورة',
  'f.autoNumber': 'تُعيَّن الأرقام تلقائياً.',
  'f.account': 'استُلم في',
  'f.bankMain': 'البنك · الحساب الرئيسي',
  'f.mobile1': 'محفظة الجوال · [المزوّد 1]',
  'f.mobile2': 'محفظة الجوال · [المزوّد 2]',
  'f.method': 'طريقة الدفع',
  'f.bank': 'تحويل بنكي',
  'f.mobile': 'محفظة الجوال',
  'f.credit': 'رصيد العميل',
  'f.reference': 'رقم العملية',
  'f.referenceHint': 'من رسالة العميل النصية أو كشف المحفظة.',
  'f.note': 'ملاحظة للعميل',
  'f.optional': 'اختياري',
  'f.notePh': 'شكراً لتعاملكم معنا.',
  'f.receiveStock': 'استلام هذه الأصناف في المخزون الآن',
  'f.reminders': 'إرسال تذكيرات الدفع تلقائياً',
  'f.voidReason': 'سبب الإلغاء',
  'msg.infoTitle': '7 مدفوعات بحاجة إلى مطابقة',
  'msg.infoBody': 'وصلت مدفوعات غير مرتبطة بأي فاتورة بعد.',
  'msg.successTitle': 'تم تسجيل الدفعة',
  'msg.successBody': 'الفاتورة INV-3107 مدفوعة الآن.',
  'msg.attentionTitle': 'تحتاج إلى موافقة المالك',
  'msg.attentionBody': 'يجب الموافقة على فواتير الموردين التي تزيد عن 10,000$ قبل دفعها.',
  'msg.errorTitle': 'تعذّر حفظ الفاتورة',
  'msg.errorBody': 'انقطع الاتصال. تغييراتك محفوظة — حاول مرة أخرى.',
  'msg.toast': 'تم إرسال الفاتورة INV-3107 إلى شركة النور التجارية',
  'drawer.subtitle': 'INV-3107 · شركة النور التجارية',
  'drawer.result': 'المتبقي 0.00$ — تصبح الفاتورة مدفوعة.',
  'dialog.title': 'إلغاء الفاتورة INV-3107؟',
  'dialog.body':
    'تبقى في سجلاتك وعليها علامة "ملغاة". يُعاد المخزون ويُعكس البيع في الدفاتر. لا يمكن التراجع عن ذلك.',
  'filter.label': 'عرض الفواتير',
  'filter.all': 'الكل',
  'filter.unpaid': 'غير مدفوعة',
  'filter.overdue': 'متأخرة',
  'filter.paid': 'مدفوعة',
  'search.label': 'البحث في الفواتير',
  'search.ph': 'الرقم أو العميل',
  'empty.title': 'لا توجد فواتير بعد',
  'empty.hint': 'أنشئ فاتورتك الأولى لبدء تتبع ما يدين به العملاء.',
  'empty.filtered': 'لا توجد فواتير مطابقة لهذا البحث',
  'error.title': 'تعذّر تحميل الفواتير',
  'error.hint': 'تحقق من الاتصال ثم حاول مرة أخرى. لم يُفقد أي شيء أدخلته.',
  loading: 'جارٍ تحميل الفواتير…',
}

export const messages: Record<Locale, Record<MessageKey, string>> = {
  en: { ...en, ...appEn, ...b2En, ...b3En, ...b4En, ...b5En },
  ar: { ...ar, ...appAr, ...b2Ar, ...b3Ar, ...b4Ar, ...b5Ar },
}

/** Names from Settings that replace the [placeholders] in the text. Blank = keep the placeholder. */
export interface Brand {
  company: string
  provider1: string
  provider2: string
}

const PLACEHOLDERS: [keyof Brand, string[]][] = [
  ['company', ['[Your company]', '[اسم شركتك]']],
  ['provider1', ['[Provider 1]', '[المزوّد 1]']],
  ['provider2', ['[Provider 2]', '[المزوّد 2]']],
]

export function applyBrand(text: string, brand: Brand) {
  let out = text
  for (const [k, tokens] of PLACEHOLDERS)
    if (brand[k]) for (const tok of tokens) out = out.split(tok).join(brand[k])
  return out
}

export interface LocaleContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
  setBrand: (brand: Brand) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside <LocaleProvider>')
  return ctx
}
