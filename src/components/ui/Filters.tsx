import { Search } from 'lucide-react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

/** Status / period filter with optional counts (toggle buttons, aria-pressed). */
export function FilterTabs<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="group" aria-label={label} className="bg-mist-soft rounded-control flex flex-wrap gap-1 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-8 rounded-md px-3 text-sm transition-colors duration-150 pointer-coarse:min-h-10',
            value === o.value
              ? 'bg-slate font-semibold text-white'
              : 'text-ink-muted hover:text-ink hover:bg-mist',
          )}
        >
          {o.label}
          {o.count !== undefined && <span className="ms-1.5 tabular-nums opacity-80">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="text-ink-subtle pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-line-input bg-panel rounded-control placeholder:text-ink-subtle focus:border-slate focus:ring-mist min-h-10 w-full border ps-9 pe-3 text-base focus:ring-4 focus:outline-none sm:text-sm pointer-coarse:min-h-11"
      />
    </div>
  )
}
