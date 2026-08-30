import React, { useEffect } from 'react'
import { X, ChevronDown, Inbox } from 'lucide-react'
import { cn, toneClasses, statusTone } from '../lib/utils.js'

export function Card({ className, children, ...rest }) {
  return <div className={cn('card', className)} {...rest}>{children}</div>
}

export function PageHeader({ title, desc, actions }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 anim-fadeUp">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{title}</h1>
        {desc && <p className="mt-0.5 text-sm text-slate-500">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Button({ children, variant = 'primary', size = 'md', className, ...rest }) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' }
  const variants = {
    primary: 'text-white shadow-sm hover:opacity-90 focus:ring-brand-500/40',
    secondary: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500/40',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500/40',
  }
  return (
    <button
      className={cn(base, sizes[size], variants[variant], className)}
      style={variant === 'primary' ? { background: 'var(--brand)' } : undefined}
      {...rest}
    >{children}</button>
  )
}

export function Badge({ children, tone }) {
  const t = tone || statusTone(typeof children === 'string' ? children : '')
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1', toneClasses[t] || toneClasses.slate)}>
      {children}
    </span>
  )
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'indigo', onClick }) {
  const tones = {
    indigo: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600', blue: 'bg-sky-50 text-sky-600', violet: 'bg-violet-50 text-violet-600', slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div onClick={onClick} className={cn('card flex items-center gap-3.5 p-4 anim-fadeUp', onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition')}>
      {Icon && <div className={cn('rounded-xl p-2.5 shrink-0', tones[tone] || tones.indigo)}><Icon size={20} /></div>}
      <div className="min-w-0">
        <div className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</div>
        <div className="truncate text-lg font-bold text-slate-900">{value}</div>
        {sub && <div className="truncate text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose?.()
    if (open) window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-slate-900/50 backdrop-blur-sm anim-fadeIn p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn('card w-full anim-fadeUp', wide ? 'max-w-3xl' : 'max-w-xl')}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children, required, className }) {
  return (
    <div className={className}>
      <label className="label">{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
    </div>
  )
}

export function Select({ className, children, ...rest }) {
  return (
    <div className="relative">
      <select className={cn('input appearance-none pr-9', className)} {...rest}>{children}</select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="rounded-2xl bg-slate-100 p-4"><Inbox className="text-slate-400" size={28} /></div>
      <h3 className="mt-3 font-semibold text-slate-700">{title}</h3>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full transition disabled:opacity-40', checked ? '' : 'bg-slate-300')}
      style={checked ? { background: 'var(--brand)' } : undefined}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
    </button>
  )
}

export function Progress({ value, className }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0))
  const color = v >= 100 ? 'bg-emerald-500' : v >= 50 ? '' : v > 0 ? 'bg-amber-500' : 'bg-slate-300'
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${v}%`, ...(v >= 50 && v < 100 ? { background: 'var(--brand)' } : {}) }} />
      </div>
      <span className="text-xs font-semibold text-slate-500">{v}%</span>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('rounded-lg px-3.5 py-1.5 text-sm font-medium transition', active === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700')}
        >{t.label}</button>
      ))}
    </div>
  )
}

export function Avatar({ name, size = 'md' }) {
  const ini = (name || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
  const palette = ['bg-indigo-100 text-indigo-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-rose-100 text-rose-700', 'bg-violet-100 text-violet-700']
  let h = 0
  for (const ch of (name || '')) h = (h * 31 + ch.charCodeAt(0)) % 997
  const cls = palette[h % palette.length]
  const sizes = { sm: 'h-7 w-7 text-[10px]', md: 'h-9 w-9 text-xs', lg: 'h-11 w-11 text-sm' }
  return <div className={cn('flex shrink-0 items-center justify-center rounded-full font-bold', cls, sizes[size])}>{ini}</div>
}
