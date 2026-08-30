import { useSyncExternalStore } from 'react'
import { uid, today } from './utils.js'
import { seedState } from './seed.js'
import { can } from './permissions.js'

const KEY = 'aura_erp_v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* ignore */ }
  return null
}

let state = load() || seedState()
let rev = 0
const listeners = new Set()

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) { /* quota */ }
}

function emit() {
  rev++
  listeners.forEach((l) => l())
}

export function getState() {
  return state
}

export function subscribe(l) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useDbVersion() {
  return useSyncExternalStore(subscribe, () => rev)
}

export function useCollection(name) {
  useDbVersion()
  return state[name] || []
}

export function useMeta() {
  useDbVersion()
  return state.meta
}

// ---------- CRUD with audit ----------
export const db = {
  list(c) {
    return state[c] || []
  },
  find(c, id) {
    return (state[c] || []).find((r) => r.id === id)
  },
  audit(action, module, title, extra = {}) {
    const entry = {
      id: uid('au'),
      ts: new Date().toISOString(),
      user: state.meta.session?.name || 'System',
      role: state.meta.session?.role || '—',
      action,
      module,
      title,
      ...extra,
    }
    state = { ...state, audit: [entry, ...(state.audit || [])].slice(0, 400) }
  },
  insert(c, row, moduleName) {
    const rec = { ...row, id: uid(c.slice(0, 2)), createdAt: new Date().toISOString() }
    state = { ...state, [c]: [rec, ...(state[c] || [])] }
    this.audit('Create', moduleName || c, rec.name || rec.title || rec.invoiceNo || rec.poNo || rec.reqNo || rec.grnNo || rec.quoteNo || rec.code || rec.employeeName || rec.month || rec.date || rec.companyName || 'record')
    emit()
    return rec
  },
  update(c, id, patch, moduleName, title) {
    state = { ...state, [c]: (state[c] || []).map((r) => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r)) }
    const rec = this.find(c, id)
    this.audit('Update', moduleName || c, title || rec?.name || rec?.title || rec?.code || 'record')
    emit()
  },
  remove(c, id, moduleName) {
    const rec = this.find(c, id)
    state = { ...state, [c]: (state[c] || []).filter((r) => r.id !== id) }
    this.audit('Delete', moduleName || c, rec?.name || rec?.title || rec?.code || 'record')
    emit()
  },
  setMeta(patch) {
    state = { ...state, meta: { ...state.meta, ...patch } }
    this.audit('Settings', 'System', Object.keys(patch).join(', '))
    emit()
  },
  resetAll() {
    localStorage.removeItem(KEY)
    state = seedState()
    persist()
    emit()
  },
}

export function login(email, password) {
  const user = db.list('users').find((u) => u.email.toLowerCase() === email.toLowerCase().trim())
  if (!user) return { ok: false, error: 'No account found with this email' }
  if (!user.active) return { ok: false, error: 'This account is deactivated. Contact Admin.' }
  if (password !== '123456') return { ok: false, error: 'Incorrect password (demo password: 123456)' }
  db.setMeta({ session: { email: user.email, name: user.name, role: user.role, scope: user.scope, id: user.id } })
  db.audit('Login', 'Auth', `${user.name} signed in`)
  emit()
  return { ok: true, user }
}

export function logout() {
  const u = state.meta.session
  if (u) db.audit('Logout', 'Auth', `${u.name} signed out`)
  db.setMeta({ session: null })
  emit()
}

// ---------- runtime permission helpers ----------
export function currentUser() {
  const s = state.meta.session
  if (!s) return null
  const fresh = db.list('users').find((u) => u.email === s.email)
  return fresh ? { ...fresh } : s
}

export function userCan(moduleId, action) {
  const u = currentUser()
  if (!u) return false
  if (!(state.meta.enabledModules || []).includes(moduleId)) return false
  return can(state.meta.permissions, u.role, moduleId, action)
}

export function visibleModules(allModules) {
  const u = currentUser()
  if (!u) return []
  const isAdmin = u.role === 'admin'
  return allModules.filter((m) => {
    if ((state.meta.enabledModules || []).length && !(state.meta.enabledModules || []).includes(m.id)) return false
    if (m.adminOnly && !isAdmin) return false
    return can(state.meta.permissions, u.role, m.id, 'view')
  })
}

export function sessionActive() {
  return !!state.meta.session
}

export { today }
