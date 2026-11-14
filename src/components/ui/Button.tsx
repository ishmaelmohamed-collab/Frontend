import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cn } from '@/lib/cn'
import { buttonBase, buttonSizes, buttonVariants, type ButtonSize, type ButtonVariant } from './button-styles'

interface Own {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Own & { loading?: boolean }) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)}
      {...props}
    >
      {loading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}: LinkProps & Own) {
  return (
    <Link className={cn(buttonBase, buttonSizes[size], buttonVariants[variant], className)} {...props}>
      {icon}
      {children}
    </Link>
  )
}

/** Icon-only button. `label` is required — it is what screen readers announce. */
export function IconButton({
  label,
  className,
  type = 'button',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'text-ink-muted hover:bg-mist-soft hover:text-ink active:bg-mist rounded-control grid size-10 place-items-center transition-colors duration-150 pointer-coarse:size-11',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
