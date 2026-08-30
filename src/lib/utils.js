import clsx from 'clsx'

export const cn = clsx

export const uid = (prefix = 'id') => prefix + Math.random().toString(36).slice(2, 9)

export const today = () => new Date().toISOString().slice(0, 10)

export const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export const daysAhead = (n) => daysAgo(-n)

export const monthOffset = (n) => {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d.toISOString().slice(0, 10)
}

export function inr(n, opts = {}) {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  const num = Number(n)
  if (opts.compact === false) {
    return '₹' + num.toLocaleString('en-IN')
  }
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(2).replace(/\.00$/, '')} Cr`
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(2).replace(/\.00$/, '')} L`
  if (abs >= 1e3) return `${sign}₹${(abs / 1e3).toFixed(1).replace(/\.0$/, '')}K`
  return `${sign}₹${abs}`
}

export const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export const fmtDateTime = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return dt.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)

export function exportCSV(filename, columns, rows) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const head = columns.map((c) => esc(c.label)).join(',')
  const body = rows.map((r) => columns.map((c) => esc(typeof c.raw === 'function' ? c.raw(r) : r[c.key])).join(',')).join('\n')
  const blob = new Blob(['\ufeff' + head + '\n' + body], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const statusTone = (s = '') => {
  const t = s.toLowerCase()
  if (/(paid|approved|completed|won|active|passed|received|cleared|present|close|done|processed|posted|delivered|confirmed|qualified)/.test(t)) return 'green'
  if (/(pending|draft|hold|submitted|await|review|in review|planning|half|idle|investigat|rework|processing|failed|retry)/.test(t)) return 'amber'
  if (/(rejected|lost|overdue|cancel|failed|exit|blacklist|absent|critical|major|bounced|delayed|blocked|exited)/.test(t)) return 'red'
  if (/(sent|order|ongoing|progress|partial|transit|qualified|assigned|duty|in use|notice|superseded|maintenance)/.test(t)) return 'blue'
  if (/(new|open)/.test(t)) return 'indigo'
  return 'slate'
}

export const toneClasses = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
}

export const CHART_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#f43f5e', '#14b8a6', '#a3a3a3']

export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export const monthName = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short' })

export function lastNMonths(n) {
  const arr = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    arr.push({ y: d.getFullYear(), m: d.getMonth(), label: d.toLocaleDateString('en-IN', { month: 'short' }) })
  }
  return arr
}
