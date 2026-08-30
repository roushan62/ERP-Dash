import React, { useMemo, useState } from 'react'
import { db, useDbVersion } from '../../lib/db.js'
import { MODULES, MODULE_GROUPS, PERMISSION_ACTIONS, ACTION_LABELS } from '../../lib/modules.js'
import { ROLES } from '../../lib/permissions.js'
import { PageHeader, Card, Toggle, Button, Badge, Modal, Field, Select, Avatar, StatCard, EmptyState } from '../../components/ui.jsx'
import { useApp } from '../../store/AppContext.jsx'
import { fmtDateTime, exportCSV, today, inr } from '../../lib/utils.js'
import { Layers, UserCog, ShieldCheck, ScrollText, Settings as SettingsIcon, Plus, Download, RefreshCw, Lock, Users as UsersIcon, Search } from 'lucide-react'

const getMeta = () => db.getState().meta

// ---------------- MODULE MANAGER ----------------
export function AdminModulesPage() {
  useDbVersion()
  const { toast } = useApp()
  const meta = getMeta()
  const enabled = meta.enabledModules || []

  const toggle = (id) => {
    const next = enabled.includes(id) ? enabled.filter((x) => x !== id) : [...enabled, id]
    db.setMeta({ enabledModules: next })
    toast(enabled.includes(id) ? 'Module disabled — hidden for all users' : 'Module enabled')
  }

  return (
    <div>
      <PageHeader
        title="Module Manager"
        desc="Admin decides which modules exist in this ERP. Disable anything the company doesn't need — it disappears for everyone."
        actions={<Badge tone="indigo">{enabled.filter((id) => !MODULES.find((m) => m.id === id)?.adminOnly).length} / {MODULES.filter((m) => !m.adminOnly).length} modules active</Badge>}
      />
      {MODULE_GROUPS.map((group) => {
        const mods = MODULES.filter((m) => m.group === group && !m.adminOnly)
        if (!mods.length) return null
        return (
          <div key={group} className="mb-6">
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-slate-400">{group}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {mods.map((m) => {
                const on = enabled.includes(m.id)
                return (
                  <Card key={m.id} className={`flex items-center gap-3.5 p-4 transition ${on ? '' : 'opacity-60'}`}>
                    <div className={`rounded-xl p-2.5 ${on ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-400'}`}><m.icon size={20} /></div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-slate-800">{m.name}</div>
                      <div className="text-xs text-slate-400">{on ? `${(meta.permissions ? Object.entries(meta.permissions).filter(([r, pm]) => pm[m.id]?.view && r !== 'admin').length : 0) + 1} roles have access` : 'Disabled for entire company'}</div>
                    </div>
                    <Toggle checked={on} onChange={() => toggle(m.id)} />
                  </Card>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------- USERS ----------------
export function AdminUsersPage() {
  useDbVersion()
  const { toast, confirm } = useApp()
  const users = db.list('users')
  const [modal, setModal] = useState(null)

  const save = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target))
    if (modal?.mode === 'add') {
      if (users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) return toast('Email already exists', 'error')
      db.insert('users', { ...f, scope: f.scope || 'all', active: true, lastLogin: '' }, 'Users')
      toast('User created — they can now log in')
    } else {
      db.update('users', modal.row.id, f, 'Users', f.name)
      toast('User updated — permissions apply immediately')
    }
    setModal(null)
  }

  const toggleActive = (u) => {
    db.update('users', u.id, { active: !u.active }, 'Users', u.name)
    toast(u.active ? `${u.name} deactivated` : `${u.name} activated`)
  }

  const roleBadge = (r) => {
    const role = ROLES.find((x) => x.id === r)
    return <Badge tone={r === 'admin' ? 'red' : r === 'management' ? 'violet' : 'indigo'}>{role?.name || r}</Badge>
  }

  return (
    <div>
      <PageHeader title="Users" desc="Who can log in, with which role, and how much data they can see." actions={<Button onClick={() => setModal({ mode: 'add' })}><Plus size={16} /> Add User</Button>} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-100 bg-slate-50/60"><tr>
              <th className="th">User</th><th className="th">Role</th><th className="th">Department</th><th className="th">Data Scope</th><th className="th">Last Login</th><th className="th">Status</th><th className="th text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} size="sm" />
                      <div><div className="font-semibold text-slate-800">{u.name}</div><div className="text-xs text-slate-400">{u.email}</div></div>
                    </div>
                  </td>
                  <td className="td">{roleBadge(u.role)}{u.role === 'admin' && <Lock size={11} className="ml-1.5 inline text-slate-300" />}</td>
                  <td className="td">{u.department}</td>
                  <td className="td">
                    <Select value={u.scope} disabled={u.role === 'admin'} onChange={(e) => { db.update('users', u.id, { scope: e.target.value }, 'Users', u.name); toast('Data scope updated') }} className="!w-auto !py-1 text-xs">
                      <option value="all">Full company data</option>
                      <option value="assigned">Only assigned to me</option>
                    </Select>
                  </td>
                  <td className="td text-xs text-slate-400">{u.lastLogin ? fmtDateTime(u.lastLogin) : 'Never'}</td>
                  <td className="td"><Badge tone={u.active ? 'green' : 'red'}>{u.active ? 'Active' : 'Disabled'}</Badge></td>
                  <td className="td">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setModal({ mode: 'edit', row: u })}>Edit</Button>
                      {u.role !== 'admin' && (
                        <Button size="sm" variant={u.active ? 'danger' : 'success'} onClick={() => toggleActive(u)}>{u.active ? 'Disable' : 'Enable'}</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal open onClose={() => setModal(null)} title={modal.mode === 'add' ? 'Add User' : `Edit — ${modal.row.name}`}>
          <form onSubmit={save}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name" required><input name="name" className="input" defaultValue={modal.row?.name} required /></Field>
              <Field label="Email (login id)" required><input name="email" type="email" className="input" defaultValue={modal.row?.email} required /></Field>
              <Field label="Role — decides module access"><Select name="role" defaultValue={modal.row?.role || 'site'}>{ROLES.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
              <Field label="Department"><input name="department" className="input" defaultValue={modal.row?.department} /></Field>
              <Field label="Phone"><input name="phone" className="input" defaultValue={modal.row?.phone} /></Field>
              <Field label="Data Scope"><Select name="scope" defaultValue={modal.row?.scope || 'all'}><option value="all">Full company data</option><option value="assigned">Only assigned to me</option></Select></Field>
            </div>
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Default demo password: <b>123456</b>. Role + data scope control exactly what this person sees and edits.</p>
            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</Button>
              <Button type="submit">{modal.mode === 'add' ? 'Create User' : 'Save Changes'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ---------------- ROLES & PERMISSIONS ----------------
export function AdminRolesPage() {
  useDbVersion()
  const { toast } = useApp()
  const [role, setRole] = useState('pm')
  const meta = getMeta()
  const perms = meta.permissions || {}
  const roleInfo = ROLES.find((r) => r.id === role)
  const locked = role === 'admin'

  const setPerm = (moduleId, action, val) => {
    const p = JSON.parse(JSON.stringify(perms))
    if (!p[role]) p[role] = {}
    if (!p[role][moduleId]) p[role][moduleId] = { view: false, create: false, edit: false, delete: false, approve: false }
    p[role][moduleId][action] = val
    if (val && action !== 'view') p[role][moduleId].view = true
    db.setMeta({ permissions: p })
  }

  const setModuleAll = (moduleId, val) => {
    const p = JSON.parse(JSON.stringify(perms))
    if (!p[role]) p[role] = {}
    p[role][moduleId] = { view: val, create: val, edit: val, delete: val, approve: val }
    db.setMeta({ permissions: p })
  }

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        desc="Admin decides exactly what each role can view, create, edit, delete and approve — module by module."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button key={r.id} onClick={() => setRole(r.id)}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${role === r.id ? 'border-transparent text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
            style={role === r.id ? { background: 'var(--brand)' } : undefined}
          >
            {r.name}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${role === r.id ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
              {db.list('users').filter((u) => u.role === r.id).length}
            </span>
          </button>
        ))}
      </div>

      {locked && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          <Lock size={15} /> Admin role always has full access to every module and action. This cannot be changed.
        </div>
      )}
      {roleInfo && !locked && <p className="mb-4 text-sm text-slate-500"><b>{roleInfo.name}:</b> {roleInfo.desc}</p>}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-slate-100 bg-slate-50/60">
              <tr>
                <th className="th">Module</th>
                {PERMISSION_ACTIONS.map((a) => <th key={a} className="th text-center">{ACTION_LABELS[a]}</th>)}
                <th className="th text-center">All</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MODULES.filter((m) => !m.adminOnly).map((m) => {
                const p = perms[role]?.[m.id] || {}
                const all = ['view', 'create', 'edit', 'delete', 'approve'].every((a) => p[a])
                return (
                  <tr key={m.id} className={`hover:bg-slate-50/70 ${!enabledOrNA(m) ? 'opacity-40' : ''}`}>
                    <td className="td">
                      <div className="flex items-center gap-2.5">
                        <m.icon size={15} className="text-slate-400" />
                        <div><div className="font-medium text-slate-800">{m.name}</div><div className="text-[10px] uppercase tracking-wide text-slate-400">{m.group}</div></div>
                      </div>
                    </td>
                    {PERMISSION_ACTIONS.map((a) => (
                      <td key={a} className="td text-center">
                        <input type="checkbox" disabled={locked} checked={locked ? true : !!p[a]} onChange={(e) => setPerm(m.id, a, e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-indigo-600" />
                      </td>
                    ))}
                    <td className="td text-center">
                      <input type="checkbox" disabled={locked} checked={locked ? true : all} onChange={(e) => setModuleAll(m.id, e.target.checked)} className="h-4 w-4 cursor-pointer rounded accent-indigo-600" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      <p className="mt-3 text-xs text-slate-400">Tip: giving Create/Edit/Delete/Approve automatically ensures View is on. Disabled modules (Module Manager) stay hidden regardless.</p>
    </div>
  )
}

const enabledOrNA = (m) => (getMeta().enabledModules || []).includes(m.id)

// ---------------- AUDIT LOG ----------------
export function AdminAuditPage() {
  useDbVersion()
  const audit = db.list('audit')
  const [q, setQ] = useState('')
  const [action, setAction] = useState('')
  const rows = audit.filter((a) => (!q || (a.user + a.module + a.title).toLowerCase().includes(q.toLowerCase())) && (!action || a.action === action))
  return (
    <div>
      <PageHeader title="Audit Log" desc="Every create, update, delete, approval and login — who did what, and when." actions={
        <Button variant="secondary" onClick={() => { exportCSV(`audit-${today()}.csv`, [{ label: 'Time', key: 'ts' }, { label: 'User', key: 'user' }, { label: 'Action', key: 'action' }, { label: 'Module', key: 'module' }, { label: 'Item', key: 'title' }], rows); }}>Export</Button>
      } />
      <Card className="overflow-hidden">
        <div className="flex flex-wrap gap-2 border-b border-slate-100 p-3.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search user, module, item…" className="input pl-9" />
          </div>
          <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-auto text-xs font-medium">
            <option value="">All Actions</option>
            {['Create', 'Update', 'Delete', 'Login', 'Logout', 'Settings'].map((a) => <option key={a}>{a}</option>)}
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-slate-100 bg-slate-50/60"><tr><th className="th">Time</th><th className="th">User</th><th className="th">Action</th><th className="th">Module</th><th className="th">Item</th></tr></thead>
            <tbody className="divide-y divide-slate-50">
              {rows.slice(0, 100).map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/70">
                  <td className="td text-xs text-slate-400">{fmtDateTime(a.ts)}</td>
                  <td className="td"><div className="flex items-center gap-2"><Avatar name={a.user} size="sm" /><span className="font-medium text-slate-700">{a.user}</span></div></td>
                  <td className="td"><Badge tone={a.action === 'Delete' ? 'red' : a.action === 'Create' ? 'green' : a.action === 'Login' || a.action === 'Logout' ? 'blue' : 'amber'}>{a.action}</Badge></td>
                  <td className="td">{a.module}</td>
                  <td className="td text-slate-500">{a.title || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ---------------- SETTINGS ----------------
export function AdminSettingsPage() {
  useDbVersion()
  const { toast, confirm } = useApp()
  const meta = getMeta()
  const company = meta.company || {}
  const ACCENTS = ['#4f46e5', '#0e7490', '#047857', '#b45309', '#be123c', '#7c3aed', '#1d4ed8', '#0f172a']

  const saveCompany = (e) => {
    e.preventDefault()
    const f = Object.fromEntries(new FormData(e.target))
    db.setMeta({ company: { ...company, ...f } })
    toast('Company settings saved')
  }

  const setAccent = (c) => {
    db.setMeta({ accent: c })
    document.documentElement.style.setProperty('--brand', c)
    toast('Brand colour updated')
  }

  return (
    <div>
      <PageHeader title="Settings" desc="Company identity, branding and system data controls." />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-slate-800"><SettingsIcon size={16} /> Company Profile</h3>
          <form onSubmit={saveCompany}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Company Name" className="sm:col-span-2"><input name="name" className="input" defaultValue={company.name} required /></Field>
              <Field label="Short Name / Code"><input name="short" className="input" defaultValue={company.short} /></Field>
              <Field label="Financial Year Starts"><Select name="fyStart" defaultValue={company.fyStart}>{['January', 'April', 'July', 'October'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
            </div>
            <div className="mt-4 flex justify-end"><Button type="submit">Save</Button></div>
          </form>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-800">Brand Colour</h3>
          <div className="flex flex-wrap gap-2.5">
            {ACCENTS.map((c) => (
              <button key={c} onClick={() => setAccent(c)} className={`h-10 w-10 rounded-xl ring-offset-2 transition hover:scale-110 ${meta.accent === c ? 'ring-2 ring-slate-400' : ''}`} style={{ background: c }} title={c} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Applies to sidebar, buttons and charts across the ERP for every user.</p>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h3 className="mb-2 font-semibold text-slate-800">System Data</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => {
                const blob = new Blob([JSON.stringify(db.getState(), null, 2)], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `aura-erp-backup-${today()}.json`
                a.click()
                toast('Backup downloaded')
              }}><Download size={15} /> Download Backup (JSON)</Button>
              <Button variant="danger" onClick={async () => {
                const ok = await confirm({ title: 'Reset all data?', message: 'Everything returns to factory demo data. This cannot be undone.' })
                if (ok) { db.resetAll(); toast('System reset to demo data') }
              }}><RefreshCw size={15} /> Reset to Demo Data</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold text-slate-800">License & System Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div><div className="text-xs text-slate-400">Users</div><div className="font-bold">{db.list('users').length}</div></div>
            <div><div className="text-xs text-slate-400">Modules Active</div><div className="font-bold">{(meta.enabledModules || []).length} / {MODULES.length}</div></div>
            <div><div className="text-xs text-slate-400">Roles</div><div className="font-bold">{ROLES.length}</div></div>
            <div><div className="text-xs text-slate-400">Audit Entries</div><div className="font-bold">{db.list('audit').length}</div></div>
          </div>
        </Card>
      </div>
    </div>
  )
}
