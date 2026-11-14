import { Languages } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n-context'
import { BloomConcept } from './BloomConcept'
import './concepts.css'
import { LedgerConcept } from './LedgerConcept'
import { NightConcept } from './NightConcept'

type Id = 'ledger' | 'night' | 'bloom'

/** Frame text is the designer talking to the client, so it stays out of the app's dictionaries. */
const FRAME = {
  en: {
    eyebrow: 'Design exploration · for your choice',
    title: 'Three design concepts',
    lead: 'The same accounting system and the same figures, designed three different ways. Each uses only two colours — every shade, line and chart bar comes from those two. Overdue stands out with a solid fill, an icon and words, never a third colour. Pick one, mix parts, or keep Blue fog.',
    forWho: 'Best for',
    strengths: 'Strengths',
    tradeoffs: 'Trade-offs',
    colours: 'Two colours',
    type: 'Type',
  },
  ar: {
    eyebrow: 'استكشاف تصميمي · لاختيارك',
    title: 'ثلاثة مفاهيم تصميمية',
    lead: 'نفس النظام المحاسبي ونفس الأرقام، بثلاثة تصاميم مختلفة. كلٌّ منها يستخدم لونين فقط — كل درجة وخط وعمود في الرسم مشتق منهما. تبرز المتأخرات بتعبئة كاملة وأيقونة وكلمات، دون لون ثالث أبداً. اختر واحداً، أو امزج أجزاء، أو أبقِ الضباب الأزرق.',
    forWho: 'الأنسب لـ',
    strengths: 'نقاط القوة',
    tradeoffs: 'المقايضات',
    colours: 'اللونان',
    type: 'الخط',
  },
}

const CONCEPTS: {
  id: Id
  letter: string
  name: { en: string; ar: string }
  line: { en: string; ar: string }
  swatches: [string, string]
  colourNames: { en: string; ar: string }
  type: string
  forWho: { en: string; ar: string }
  strengths: { en: string; ar: string }
  tradeoffs: { en: string; ar: string }
}[] = [
  {
    id: 'ledger',
    letter: 'A',
    name: { en: 'Ledger', ar: 'الدفتر' },
    line: {
      en: 'Paper & ink — editorial, like a well-kept account book',
      ar: 'ورق وحبر — تحريري، كدفتر حسابات مرتب',
    },
    swatches: ['#F5F1E8', '#1E4636'],
    colourNames: { en: 'Paper #F5F1E8 · Ink green #1E4636', ar: 'ورقي #F5F1E8 · أخضر حبري #1E4636' },
    type: 'Fraunces + Noto Naskh Arabic · Manrope + IBM Plex Sans Arabic',
    forWho: {
      en: 'An Owner and Accountant who read figures carefully and print or share statements.',
      ar: 'مالك ومحاسب يقرآن الأرقام بعناية ويطبعان الكشوف أو يشاركانها.',
    },
    strengths: {
      en: 'Calm and trustworthy. Ruled tables instead of boxes; numbers read like a printed statement. Top navigation leaves the full width for tables.',
      ar: 'هادئ وموثوق. جداول مسطّرة بدل الصناديق؛ الأرقام تُقرأ ككشف مطبوع. التنقل العلوي يترك العرض كاملاً للجداول.',
    },
    tradeoffs: {
      en: 'Less “app-like” on phones; the serif headings feel formal. Fewer colours means status relies more on words and icons.',
      ar: 'أقل شبهاً بالتطبيقات على الجوال؛ العناوين المزخرفة تبدو رسمية. قلة الألوان تجعل الحالة تعتمد أكثر على الكلمات والأيقونات.',
    },
  },
  {
    id: 'night',
    letter: 'B',
    name: { en: 'Night desk', ar: 'مكتب الليل' },
    line: {
      en: 'Graphite & amber — dark, dense and keyboard-first',
      ar: 'جرافيت وكهرماني — داكن، كثيف، يعتمد على لوحة المفاتيح',
    },
    swatches: ['#13161C', '#F0B429'],
    colourNames: { en: 'Graphite #13161C · Amber #F0B429', ar: 'جرافيت #13161C · كهرماني #F0B429' },
    type: 'Readex Pro (Latin + Arabic) · JetBrains Mono for numbers',
    forWho: {
      en: 'A Cashier or Accountant working many hours a day on a big screen, entering a lot quickly.',
      ar: 'أمين صندوق أو محاسب يعمل ساعات طويلة يومياً على شاشة كبيرة ويُدخل الكثير بسرعة.',
    },
    strengths: {
      en: 'Easy on the eyes all day. Most information per screen; list and detail side by side; a command bar and shortcuts (N, P, /) for speed.',
      ar: 'مريح للعين طوال اليوم. أكبر قدر من المعلومات في الشاشة؛ القائمة والتفاصيل جنباً إلى جنب؛ شريط أوامر واختصارات (N، P، /) للسرعة.',
    },
    tradeoffs: {
      en: 'Dark screens are harder in bright sunlight and need a light version for printing. Dense layouts take a day to get used to.',
      ar: 'الشاشات الداكنة أصعب تحت الشمس الساطعة وتحتاج نسخة فاتحة للطباعة. التصاميم الكثيفة تحتاج يوماً للتعود عليها.',
    },
  },
  {
    id: 'bloom',
    letter: 'C',
    name: { en: 'Bloom', ar: 'تفتّح' },
    line: {
      en: 'Violet & lilac — friendly, rounded, phone-first',
      ar: 'بنفسجي وليلكي — ودود، دائري الحواف، للجوال أولاً',
    },
    swatches: ['#F1EDFA', '#3D2C8D'],
    colourNames: { en: 'Lilac #F1EDFA · Violet #3D2C8D', ar: 'ليلكي #F1EDFA · بنفسجي #3D2C8D' },
    type: 'Rubik (Latin + Arabic)',
    forWho: {
      en: 'Sales staff and an Owner who work mostly from the phone, and new users with little accounting background.',
      ar: 'موظفو مبيعات ومالك يعملون غالباً من الجوال، ومستخدمون جدد بخلفية محاسبية بسيطة.',
    },
    strengths: {
      en: 'Welcoming and simple. Big numbers, big touch targets, a “today’s focus” that tells you what to do next. Bento layout reads well at any size.',
      ar: 'مرحّب وبسيط. أرقام كبيرة ومساحات لمس كبيرة، و"أولويات اليوم" تخبرك بما تفعله بعد ذلك. تخطيط البنتو مقروء بأي حجم.',
    },
    tradeoffs: {
      en: 'Shows fewer rows per screen, so long lists need more scrolling. Playful look may feel less “serious” to auditors and banks.',
      ar: 'يعرض صفوفاً أقل في الشاشة، فالقوائم الطويلة تحتاج تمريراً أكثر. المظهر المرح قد يبدو أقل "جدية" للمدققين والبنوك.',
    },
  },
]

export function ConceptsPage() {
  const { locale, setLocale, t } = useLocale()
  const [params, setParams] = useSearchParams()
  const id: Id = (['ledger', 'night', 'bloom'] as const).includes(params.get('c') as Id)
    ? (params.get('c') as Id)
    : 'ledger'
  const f = FRAME[locale]
  const c = CONCEPTS.find((x) => x.id === id)!

  return (
    <div className="min-h-dvh bg-[#f2f2f2] font-sans text-[#111111]">
      <header className="border-b border-[#dddddd] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-wider text-[#555555] uppercase">{f.eyebrow}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">{f.title}</h1>
            </div>
            <button
              type="button"
              lang={locale === 'en' ? 'ar' : 'en'}
              aria-label={t('app.switchLabel')}
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-[#888888] px-3 text-sm font-semibold hover:bg-[#f2f2f2]"
            >
              <Languages aria-hidden className="size-4" />
              {t('app.switch')}
            </button>
          </div>
          <p className="max-w-3xl text-[15px] text-[#555555]">{f.lead}</p>
          <div role="tablist" aria-label={f.title} className="grid gap-3 md:grid-cols-3">
            {CONCEPTS.map((x) => {
              const on = x.id === id
              return (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  aria-controls="concept-panel"
                  onClick={() => setParams(x.id === 'ledger' ? {} : { c: x.id }, { replace: true })}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border p-3 text-start transition-colors',
                    on
                      ? 'border-2 border-[#111111] bg-white'
                      : 'border-[#dddddd] bg-[#fafafa] hover:bg-white',
                  )}
                >
                  <span
                    aria-hidden
                    className="flex shrink-0 overflow-hidden rounded-lg border border-[#cccccc]"
                  >
                    <span className="size-9" style={{ background: x.swatches[0] }} />
                    <span className="size-9" style={{ background: x.swatches[1] }} />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="font-bold">
                      {x.letter} · {x.name[locale]}
                    </span>
                    <span className="text-xs text-[#555555]">{x.line[locale]}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </header>

      <main
        id="concept-panel"
        role="tabpanel"
        className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-8"
      >
        <section className="grid gap-4 rounded-xl border border-[#dddddd] bg-white p-5 lg:grid-cols-4">
          <div>
            <h2 className="text-xs font-bold tracking-wider text-[#555555] uppercase">{f.colours}</h2>
            <p className="mt-1 text-sm" dir="ltr">
              {c.colourNames[locale]}
            </p>
            <h2 className="mt-3 text-xs font-bold tracking-wider text-[#555555] uppercase">{f.type}</h2>
            <p className="mt-1 text-sm" dir="ltr">
              {c.type}
            </p>
          </div>
          {(['forWho', 'strengths', 'tradeoffs'] as const).map((k) => (
            <div key={k}>
              <h2 className="text-xs font-bold tracking-wider text-[#555555] uppercase">{f[k]}</h2>
              <p className="mt-1 text-sm">{c[k][locale]}</p>
            </div>
          ))}
        </section>

        {id === 'ledger' && <LedgerConcept />}
        {id === 'night' && <NightConcept />}
        {id === 'bloom' && <BloomConcept />}
      </main>
    </div>
  )
}
