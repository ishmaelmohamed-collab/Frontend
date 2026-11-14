import { AlertTriangle, ChevronDown } from 'lucide-react'
import { useId, type ReactNode, type ComponentProps, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

/**
 * Form controls. Always a visible label; optional hint; errors sit right under the
 * field in warning red (the only place red is used besides "Overdue"), with an icon.
 */

interface FieldProps {
  label: string
  hint?: string
  error?: string
  optionalLabel?: string
}

const control =
  'w-full rounded-control border bg-panel px-3 text-ink placeholder:text-ink-subtle transition-shadow duration-150 ' +
  'text-base sm:text-sm ' +
  'focus:outline-none focus:border-slate focus:ring-4 focus:ring-mist ' +
  'disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-ink-subtle'

const border = (error?: string) =>
  error ? 'border-2 border-alert focus:border-alert focus:ring-alert-soft' : 'border-line-input'

function useIds(error?: string, hint?: string) {
  const id = useId()
  const errorId = error ? `${id}-e` : undefined
  const hintId = hint && !error ? `${id}-h` : undefined
  return { id, errorId, hintId, describedBy: errorId ?? hintId }
}

function Frame({
  id,
  label,
  optionalLabel,
  hint,
  hintId,
  error,
  errorId,
  disabled,
  children,
}: FieldProps & { id: string; hintId?: string; errorId?: string; disabled?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={cn('text-sm font-semibold', disabled && 'text-ink-subtle')}>
        {label}
        {optionalLabel && <span className="text-ink-muted font-normal"> ({optionalLabel})</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="text-alert flex items-start gap-1.5 text-xs font-semibold">
          <AlertTriangle aria-hidden className="mt-px size-3.5 shrink-0" />
          {error}
        </p>
      )}
      {hintId && (
        <p id={hintId} className="text-ink-muted text-xs">
          {hint}
        </p>
      )}
    </div>
  )
}

export function TextField({
  label,
  hint,
  error,
  optionalLabel,
  numeric = false,
  className,
  ...props
}: FieldProps & ComponentProps<'input'> & { numeric?: boolean }) {
  const ids = useIds(error, hint)
  return (
    <Frame
      {...ids}
      label={label}
      hint={hint}
      error={error}
      optionalLabel={optionalLabel}
      disabled={props.disabled}
    >
      <input
        id={ids.id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        inputMode={numeric ? 'decimal' : props.inputMode}
        dir={numeric ? 'ltr' : props.dir}
        className={cn(
          control,
          'min-h-10 pointer-coarse:min-h-11',
          border(error),
          numeric && 'num',
          className,
        )}
        {...props}
      />
    </Frame>
  )
}

export function SelectField({
  label,
  hint,
  error,
  optionalLabel,
  className,
  children,
  ...props
}: FieldProps & ComponentProps<'select'>) {
  const ids = useIds(error, hint)
  return (
    <Frame
      {...ids}
      label={label}
      hint={hint}
      error={error}
      optionalLabel={optionalLabel}
      disabled={props.disabled}
    >
      <div className="relative">
        <select
          id={ids.id}
          aria-invalid={error ? true : undefined}
          aria-describedby={ids.describedBy}
          className={cn(
            control,
            'min-h-10 appearance-none pe-9 pointer-coarse:min-h-11',
            border(error),
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden
          className="text-ink-muted pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2"
        />
      </div>
    </Frame>
  )
}

export function TextAreaField({
  label,
  hint,
  error,
  optionalLabel,
  className,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ids = useIds(error, hint)
  return (
    <Frame
      {...ids}
      label={label}
      hint={hint}
      error={error}
      optionalLabel={optionalLabel}
      disabled={props.disabled}
    >
      <textarea
        id={ids.id}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(control, 'py-2', border(error), className)}
        {...props}
      />
    </Frame>
  )
}

export function Checkbox({
  label,
  className,
  ...props
}: { label: string } & Omit<ComponentProps<'input'>, 'type'>) {
  const id = useId()
  return (
    <div className={cn('flex min-h-9 items-center gap-3 pointer-coarse:min-h-11', className)}>
      <input
        id={id}
        type="checkbox"
        className="accent-slate size-4.5 shrink-0 cursor-pointer disabled:cursor-not-allowed"
        {...props}
      />
      <label htmlFor={id} className={cn('text-sm', props.disabled && 'text-ink-subtle')}>
        {label}
      </label>
    </div>
  )
}

/** On/off for settings that apply immediately. */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-9 items-center gap-3 text-start text-sm disabled:cursor-not-allowed pointer-coarse:min-h-11"
    >
      <span
        aria-hidden
        className={cn(
          'inline-flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors duration-150',
          checked ? 'bg-slate' : 'bg-line-input',
          disabled && 'opacity-50',
        )}
      >
        <span
          className={cn(
            'size-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked && 'translate-x-4 rtl:-translate-x-4',
          )}
        />
      </span>
      <span className={cn(disabled && 'text-ink-subtle')}>{label}</span>
    </button>
  )
}

/** Segmented choice (e.g. payment method). Radio-group semantics, keyboard friendly. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-semibold">{label}</legend>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => (
          <label
            key={o.value}
            className={cn(
              'rounded-control flex min-h-10 cursor-pointer items-center justify-center px-2 text-center text-sm transition-colors duration-150 pointer-coarse:min-h-11',
              'has-focus-visible:outline-slate has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
              value === o.value
                ? 'border-slate bg-mist text-slate border-2 font-bold'
                : 'border-line-input bg-panel hover:bg-mist-soft border',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
