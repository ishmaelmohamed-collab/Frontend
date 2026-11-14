import { useLocale, type MessageKey } from '@/lib/i18n-context'
import type { BankTxn } from '@/types/domain'

/** Who or what a bank movement was with, in the reader's language. */
export function useParty() {
  const { t } = useLocale()
  return (x: Pick<BankTxn, 'kind' | 'party'>) =>
    x.kind === 'transferIn' || x.kind === 'transferOut'
      ? `${t(x.kind === 'transferIn' ? 'txk.from' : 'txk.to')} ${t(`acct.${x.party}` as MessageKey)}`
      : x.party
}
