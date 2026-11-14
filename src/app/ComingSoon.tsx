import { Hammer } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Layout'
import { useLocale, type MessageKey } from '@/lib/i18n-context'

/** Placeholder for screens scheduled in a later batch. */
export function ComingSoon({ titleKey, batch }: { titleKey: MessageKey; batch: number }) {
  const { t } = useLocale()
  return (
    <>
      <PageHeader title={t(titleKey)} />
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span
          aria-hidden
          className="fog-soft border-mist text-slate grid size-14 place-items-center rounded-full border"
        >
          <Hammer className="size-6" />
        </span>
        <p className="text-lg font-bold">
          {t('soon.title')} {batch}
        </p>
        <p className="text-ink-muted max-w-md text-sm">{t('soon.body')}</p>
        <ButtonLink to="/" variant="secondary" className="mt-2">
          {t('soon.back')}
        </ButtonLink>
      </Card>
    </>
  )
}

export function NotFound() {
  const { t } = useLocale()
  return (
    <>
      <PageHeader title={t('notFound.title')} />
      <ButtonLink to="/">{t('soon.back')}</ButtonLink>
    </>
  )
}
