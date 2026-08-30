import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, db } from '../lib/db.js'
import { ROLES } from '../lib/permissions.js'
import { Building2, Lock, Mail, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react'

const DEMO = [
  { name: 'Aakash Jain', email: 'admin@aura.in', role: 'admin', tint: 'bg-rose-50 text-rose-700 border-rose-100', desc: 'Full control — modules, users, permissions' },
  { name: 'Rajesh Malhotra', email: 'rajesh@aura.in', role: 'management', tint: 'bg-violet-50 text-violet-700 border-violet-100', desc: 'Director view + approvals' },
  { name: 'Amit Verma', email: 'amit@aura.in', role: 'pm', tint: 'bg-indigo-50 text-indigo-700 border-indigo-100', desc: 'Projects, sites, procurement' },
  { name: 'Neha Gupta', email: 'neha@aura.in', role: 'sales', tint: 'bg-sky-50 text-sky-700 border-sky-100', desc: 'CRM & quotations only' },
  { name: 'Kavita Joshi', email: 'kavita@aura.in', role: 'accounts', tint: 'bg-emerald-50 text-emerald-700 border-emerald-100', desc: 'Invoices, expenses, payments' },
  { name: 'Vikas Yadav', email: 'vikas@aura.in', role: 'site', tint: 'bg-amber-50 text-amber-700 border-amber-100', desc: 'Site role — only assigned data' },
]

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const meta = JSON.parse(localStorage.getItem('aura_erp_v1') || '{}')?.meta || {}
  const company = meta.company || { name: 'AURA Interiors & Fitout Pvt. Ltd.', short: 'AURA' }

  const doLogin = (em, pw) => {
    setBusy(true)
    setError('')
    const res = login(em, pw)
    setTimeout(() => {
      setBusy(false)
      if (res.ok) navigate('/')
      else setError(res.error)
    }, 350)
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left brand panel */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <img src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80" alt="construction" className="absolute inset-0 h-full w-full object-cover opacity-40" onError={(e) => { e.target.style.display = 'none' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/90 via-slate-900/85 to-slate-900" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white font-black text-indigo-700">{company.short?.[0] || 'A'}</div>
            <div>
              <div className="text-lg font-bold text-white">{company.short} ERP</div>
              <div className="text-xs text-slate-300">{company.name}</div>
            </div>
          </div>
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white">One ERP for your entire<br />fitout & construction business.</h1>
            <p className="mt-4 text-slate-300">Sales · Projects · Sites · Design · Procurement · Inventory · Finance · HR — every department, every workflow, in one place. With admin-controlled access on every module.</p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              {[['30+', 'Modules'], ['9', 'Roles'], ['5-Level', 'Permissions']].map(([a, b]) => (
                <div key={b} className="rounded-xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-xl font-bold text-white">{a}</div>
                  <div className="text-[11px] text-slate-300">{b}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400">© 2026 {company.name} · Built for interior fitout & construction workflows</p>
        </div>
      </div>

      {/* Right login panel */}
      <div className="flex w-full flex-col justify-center bg-slate-50 px-6 py-10 sm:px-12 lg:w-[560px]">
        <div className="mx-auto w-full max-w-md anim-fadeUp">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 font-black text-white">{company.short?.[0] || 'A'}</div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Sign in to your workspace</h2>
          <p className="mt-1 text-sm text-slate-500">Use any demo account below — password is <span className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-xs font-bold">123456</span></p>

          <form onSubmit={(e) => { e.preventDefault(); doLogin(email, password) }} className="mt-6 space-y-4">
            <div>
              <label className="label">Work Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="you@company.in" className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} required placeholder="••••••" className="input pl-9 pr-10" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            {error && <div className="rounded-lg bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-600">{error}</div>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-60" style={{ background: 'var(--brand)' }}>
              {busy ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <ShieldCheck size={14} /> One-click role demo
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DEMO.map((d) => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPassword('123456'); doLogin(d.email, '123456') }} disabled={busy}
                  className={`group rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${d.tint}`}>
                  <div className="text-sm font-bold">{d.name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{d.role === 'pm' ? 'Project Manager' : d.role === 'admin' ? 'Administrator' : d.role}</div>
                  <div className="mt-0.5 text-[11px] opacity-60">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
