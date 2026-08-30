import React, { useState, useMemo, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Search, Bell, LogOut, ChevronDown, Building2, Command } from 'lucide-react'
import { MODULES, MODULE_GROUPS } from '../lib/modules.js'
import { visibleModules, db, logout } from '../lib/db.js'
import { useApp } from '../store/AppContext.jsx'
import { Avatar } from './ui.jsx'
import { initials, fmtDateTime } from '../lib/utils.js'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, toast } = useApp()
  const searchRef = useRef(null)

  const allowed = useMemo(() => visibleModules(MODULES), [user])
  const groups = useMemo(() => {
    const g = {}
    allowed.forEach((m) => { (g[m.group] = g[m.group] || []).push(m) })
    return g
  }, [allowed])

  useEffect(() => { setSidebarOpen(false); setSearchOpen(false); setQuery('') }, [location.pathname])

  const searchResults = query.trim() && !searchOpen
    ? allowed.filter((m) => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : []

  const logoutNow = () => { logout(); navigate('/login') }

  const meta = db.getState().meta || {}
  const company = meta.company || { name: 'AURA Interiors & Fitout', short: 'AURA' }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 transition-transform duration-200 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-slate-800 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white" style={{ background: 'var(--brand)' }}>{company.short?.[0] || 'A'}</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">{company.short || 'AURA'} ERP</div>
            <div className="truncate text-[10px] text-slate-400">Fitout & Construction Suite</div>
          </div>
          <button className="ml-auto text-slate-400 lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
        </div>
        <nav className="sidebar-scroll flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {MODULE_GROUPS.map((group) => {
            const mods = groups[group]
            if (!mods?.length) return null
            return (
              <div key={group}>
                <div className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group}</div>
                <div className="space-y-0.5">
                  {mods.map((m) => (
                    <NavLink
                      key={m.id}
                      to={m.path}
                      end={m.path === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${isActive ? 'text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      style={({ isActive }) => (isActive ? { background: 'var(--brand)' } : undefined)}
                    >
                      <m.icon size={16} className="shrink-0" />
                      <span className="truncate">{m.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>
        <div className="shrink-0 border-t border-slate-800 p-3">
          <div className="flex items-center gap-2.5 rounded-lg bg-slate-800/60 px-3 py-2.5">
            <Avatar name={user?.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-white">{user?.name}</div>
              <div className="truncate text-[10px] capitalize text-slate-400">{user?.role === 'pm' ? 'Project Manager' : user?.role === 'admin' ? 'Administrator' : user?.role}</div>
            </div>
            <button onClick={logoutNow} title="Sign out" className="rounded-md p-1.5 text-slate-400 hover:bg-slate-700 hover:text-rose-400"><LogOut size={14} /></button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSearchOpen(false) }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults[0]) { navigate(searchResults[0].path); setSearchOpen(true) }
              }}
              placeholder="Search modules… (e.g. invoice, vendor, leads)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-14 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/10"
            />
            <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:flex"><Command size={10} />K</kbd>
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                {searchResults.map((m) => (
                  <button key={m.id} onClick={() => navigate(m.path)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <m.icon size={15} className="text-slate-400" /> {m.name}
                    <span className="ml-auto text-[10px] uppercase text-slate-400">{m.group}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <button onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false) }} className="relative rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <Bell size={17} />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
              {notifOpen && <NotifPanel onClose={() => setNotifOpen(false)} />}
            </div>
            <button onClick={() => { setUserOpen(!userOpen); setNotifOpen(false) }} className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-2.5 hover:bg-slate-50">
              <Avatar name={user?.name} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="max-w-[120px] truncate text-xs font-semibold text-slate-800">{user?.name}</div>
                <div className="text-[10px] text-slate-400">{company.short} Team</div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {userOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserOpen(false)} />
                <div className="absolute right-4 top-16 z-50 mt-0 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl anim-fadeUp">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <div className="text-sm font-semibold text-slate-800">{user?.name}</div>
                    <div className="text-xs text-slate-400">{user?.email}</div>
                    <div className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">{user?.role === 'pm' ? 'Project Manager' : user?.role === 'admin' ? 'Administrator' : user?.role}</div>
                  </div>
                  <button onClick={logoutNow} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={15} /> Sign out</button>
                </div>
              </>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}

function NotifPanel({ onClose }) {
  const audit = JSON.parse(localStorage.getItem('aura_erp_v1') || '{}')?.audit || []
  const recent = audit.slice(0, 7)
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl anim-fadeUp">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">Recent Activity</span>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">LIVE</span>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {recent.map((a) => (
            <div key={a.id} className="flex gap-2.5 border-b border-slate-50 px-4 py-2.5 last:border-0">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${a.action === 'Delete' ? 'bg-rose-500' : a.action === 'Create' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <div className="min-w-0">
                <p className="text-xs text-slate-700"><b>{a.user}</b> · {a.action} · {a.module}{a.title ? ` — ${a.title}` : ''}</p>
                <p className="text-[10px] text-slate-400">{fmtDateTime(a.ts)}</p>
              </div>
            </div>
          ))}
          {!recent.length && <div className="px-4 py-6 text-center text-xs text-slate-400">No activity yet</div>}
        </div>
      </div>
    </>
  )
}
