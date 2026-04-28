'use client'

// ─────────────────────────────────────────────────────────
// CONSTRUCTIQ — UI Primitives
// Every UI component lives here. Import from '@/components/ui'
// Never write inline styles for these patterns — use these.
// ─────────────────────────────────────────────────────────

import { clsx } from 'clsx'
import React from 'react'

// ── BUTTON ────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: React.ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg border transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#1a1a1a] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

  const variants = {
    primary: 'bg-[#1a1a1a] text-white border-[#1a1a1a] hover:bg-[#2d2d2d]',
    secondary: 'bg-white text-[#111110] border-[rgba(0,0,0,0.14)] hover:bg-[#f8f7f4]',
    danger: 'bg-[#b83232] text-white border-[#b83232] hover:bg-[#a02a2a]',
    ghost: 'bg-transparent text-[#6b6a66] border-transparent hover:bg-[#f8f7f4] hover:text-[#111110]',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  }

  return (
    <button
      disabled={disabled || loading}
      className={clsx(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  )
}

// ── INPUT ─────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#111110]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'h-9 w-full rounded-lg border bg-white px-3 text-sm text-[#111110] placeholder:text-[#9e9d99] transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a]',
          error
            ? 'border-[#b83232] focus:ring-[#b83232]'
            : 'border-[rgba(0,0,0,0.14)] hover:border-[rgba(0,0,0,0.25)]',
          className
        )}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[#9e9d99]">{hint}</p>}
      {error && <p className="text-xs text-[#b83232]">{error}</p>}
    </div>
  )
}

// ── TEXTAREA ──────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#111110]">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={clsx(
          'w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#111110] placeholder:text-[#9e9d99] transition-colors resize-none',
          'focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a]',
          error
            ? 'border-[#b83232]'
            : 'border-[rgba(0,0,0,0.14)] hover:border-[rgba(0,0,0,0.25)]',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[#b83232]">{error}</p>}
    </div>
  )
}

// ── SELECT ────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: Array<{ value: string; label: string }>
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#111110]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={clsx(
          'h-9 w-full rounded-lg border bg-white px-3 text-sm text-[#111110] transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a]',
          error
            ? 'border-[#b83232]'
            : 'border-[rgba(0,0,0,0.14)] hover:border-[rgba(0,0,0,0.25)]',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-[#b83232]">{error}</p>}
    </div>
  )
}

// ── CARD ──────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hoverable?: boolean
}

export function Card({ children, className, onClick, hoverable }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white border border-[rgba(0,0,0,0.08)] rounded-xl p-5',
        hoverable && 'cursor-pointer transition-all hover:border-[rgba(0,0,0,0.2)] hover:shadow-sm',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

// ── BADGE / PILL ──────────────────────────────────────────
type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'orange' | 'gray'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const badgeStyles: Record<BadgeVariant, string> = {
  green:  'bg-[#edf5f0] text-[#1a4d31]',
  red:    'bg-[#fdf0f0] text-[#6e1a1a]',
  amber:  'bg-[#fdf4e3] text-[#6b4010]',
  blue:   'bg-[#eef3fb] text-[#0f3360]',
  orange: 'bg-[#fdf0e8] text-[#7a2d0d]',
  gray:   'bg-[#f8f7f4] text-[#6b6a66]',
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap',
        badgeStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

// ── SPINNER ───────────────────────────────────────────────
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }

  return (
    <svg
      className={clsx('animate-spin-slow', sizes[size], className || 'text-[#6b6a66]')}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ── ALERT ─────────────────────────────────────────────────
type AlertVariant = 'info' | 'warning' | 'danger' | 'success'

interface AlertProps {
  variant?: AlertVariant
  title?: string
  children: React.ReactNode
  className?: string
}

const alertStyles: Record<AlertVariant, string> = {
  info:    'bg-[#eef3fb] text-[#0f3360] border-[#b5d4f4]',
  warning: 'bg-[#fdf4e3] text-[#6b4010] border-[#FAC775]',
  danger:  'bg-[#fdf0f0] text-[#6e1a1a] border-[#F7C1C1]',
  success: 'bg-[#edf5f0] text-[#1a4d31] border-[#9FE1CB]',
}

export function Alert({ variant = 'info', title, children, className }: AlertProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed',
        alertStyles[variant],
        className
      )}
    >
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      <p>{children}</p>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  subVariant?: 'default' | 'up' | 'down' | 'warn'
}

const subColors = {
  default: 'text-[#6b6a66]',
  up: 'text-[#2d7a4f]',
  down: 'text-[#b83232]',
  warn: 'text-[#d95f2b]',
}

export function StatCard({ label, value, sub, subVariant = 'default' }: StatCardProps) {
  return (
    <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-xl px-4 py-3.5">
      <p className="text-xs font-medium text-[#9e9d99] uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-semibold tracking-tight text-[#111110]">{value}</p>
      {sub && <p className={clsx('text-xs mt-0.5', subColors[subVariant])}>{sub}</p>}
    </div>
  )
}

// ── DIVIDER ───────────────────────────────────────────────
export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-0 border-t border-[rgba(0,0,0,0.08)]', className)} />
}

// ── EMPTY STATE ───────────────────────────────────────────
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <p className="text-sm font-medium text-[#111110] mb-1">{title}</p>
      {description && <p className="text-sm text-[#6b6a66] max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────
interface ProgressBarProps {
  value: number   // 0–100
  color?: string
  className?: string
}

export function ProgressBar({ value, color = '#2d7a4f', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={clsx('h-1.5 rounded-full bg-[#f0ede8] overflow-hidden', className)}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

// ── MODAL ─────────────────────────────────────────────────
interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!open) return null

  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={clsx('w-full bg-white rounded-2xl shadow-xl animate-fade-in', sizes[size])}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,0,0,0.08)]">
          <h2 className="text-sm font-semibold text-[#111110]">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b6a66] hover:bg-[#f8f7f4] transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-[rgba(0,0,0,0.08)] bg-[#f8f7f4] rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
