import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

/**
 * Modal layers. On open, focus moves inside; Tab stays inside; Escape closes;
 * on close, focus returns to the button that opened it.
 */
function useModal(open: boolean, onClose: () => void) {
  const panelRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const focusables = () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => !el.classList.contains('sr-only') || el.matches('input'))
    const first = focusables().find((el) => el.matches('input, select, textarea')) ?? focusables()[0]
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      } else if (e.key === 'Tab') {
        const list = focusables()
        if (!list.length) return
        const a = list[0]
        const z = list[list.length - 1]
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault()
          z.focus()
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault()
          a.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      opener?.focus()
    }
  }, [open])
  return panelRef
}

interface OverlayProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  closeLabel?: string
}

/** Side panel from the END edge (right in English, left in Arabic) for quick tasks like Record payment. */
export function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close',
}: OverlayProps) {
  const ref = useModal(open, onClose)
  const titleId = useId()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div aria-hidden className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-panel shadow-overlay absolute inset-y-0 end-0 flex w-full max-w-md flex-col"
      >
        <div className="fog-soft border-line flex items-start justify-between gap-3 border-b px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-bold">
              {title}
            </h2>
            {description && <p className="text-ink-muted text-sm">{description}</p>}
          </div>
          <button
            type="button"
            aria-label={closeLabel}
            onClick={onClose}
            className="text-ink-muted hover:bg-mist-soft rounded-control -me-2 grid size-10 place-items-center"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="border-line bg-canvas flex justify-end gap-2 border-t px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}

/** Centred confirmation for decisions that matter (void, lock a month). */
export function Dialog({ open, onClose, title, description, children, footer }: OverlayProps) {
  const ref = useModal(open, onClose)
  const titleId = useId()
  const descId = useId()
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div aria-hidden className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className="bg-panel shadow-overlay rounded-panel relative w-full max-w-md p-6"
      >
        <span aria-hidden className="bg-mist text-slate mb-3 grid size-11 place-items-center rounded-full">
          <AlertTriangle className="size-5" />
        </span>
        <h2 id={titleId} className="text-lg font-bold">
          {title}
        </h2>
        {description && (
          <p id={descId} className="text-ink-muted mt-2 text-sm">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}
