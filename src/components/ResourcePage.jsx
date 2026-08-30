import React, { useMemo, useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, Filter } from 'lucide-react'
import { db, useCollection, userCan } from '../lib/db.js'
import { filterByScope } from '../lib/permissions.js'
import { useApp } from '../store/AppContext.jsx'
import { Button, Card, Modal, Field, Select, Badge, EmptyState, PageHeader, StatCard, Progress } from './ui.jsx'
import { cn, inr, fmtDate, exportCSV, today } from '../lib/utils.js'

export default function ResourcePage({ config, fixed = {}, embedded = false }) {
  const { user, toast, confirm } = useApp()
  const allRows = useCollection(config.collection)
  const canView = userCan(config.module, 'view')
  const canCreate = userCan(config.module, 'create')
  const canEdit = userCan(config.module, 'edit')
  const canDelete = userCan(config.module, 'delete')
  const canApprove = userCan(config.module, 'approve')

  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState(config.defaultSort || null)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null) // {mode:'add'|'edit', row}
  const perPage = config.perPage || 9

  const rows = useMemo(() => {
    let r = fixed && Object.keys(fixed).length ? allRows.filter((row) => Object.entries(fixed).every(([k, v]) => row[k] === v)) : allRows
    r = filterByScope(r, user)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter((row) => (config.searchKeys || Object.keys(row)).some((k) => String(row[k] ?? '').toLowerCase().includes(q)))
    }
    for (const [k, v] of Object.entries(filters)) {
      if (v) r = r.filter((row) => String(row[k]) === v)
    }
    if (sort) {
      r = [...r].sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key]
        if (av == null) return 1
        if (bv == null) return -1
        const n = Number(av) - Number(bv)
        const c = typeof av === 'number' && typeof bv === 'number' ? n : String(av).localeCompare(String(bv))
        return sort.dir === 'asc' ? c : -c
      })
    }
    return r
  }, [allRows, search, filters, sort, user, JSON.stringify(fixed)])

  useEffect(() => setPage(1), [search, filters])

  if (!canView) {
    return (
      <EmptyState title="Access restricted" message="You do not have permission to view this module. Contact your administrator." />
    )
  }

  const totalPages = Math.max(1, Math.ceil(rows.length / perPage))
  const paged = rows.slice((page - 1) * perPage, page * perPage)
  const stats = config.stats ? config.stats(rows) : []

  const openAdd = () => setModal({ mode: 'add', row: {} })
  const openEdit = (row) => setModal({ mode: 'edit', row })

  const handleDelete = async (row) => {
    const ok = await confirm({
      title: `Delete this ${config.singular || 'record'}?`,
      message: `“${row.name || row.title || row.invoiceNo || row.poNo || row.quoteNo || row.reqNo || row.grnNo || row.code || row.companyName || row.employeeName || row.month || 'this record'}” will be permanently removed.`,
    })
    if (!ok) return
    db.remove(config.collection, row.id, config.title)
    toast('Deleted successfully')
  }

  const handleApprove = (row) => {
    db.update(config.collection, row.id, { [config.statusField]: config.approve.to }, config.title, row.invoiceNo || row.reqNo || row.quoteNo || row.title || row.name)
    toast(`Approved: ${config.approve.to}`)
  }

  const doExport = () => {
    exportCSV(
      `${config.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${today()}.csv`,
      config.columns.map((c) => ({ label: c.label, key: c.key, raw: c.csvRaw || ((r) => r[c.key]) })),
      rows,
    )
    toast('CSV exported')
  }

  const api = {
    L: (collection, id, key = 'name') => {
      const rec = db.find(collection, id)
      return rec ? (rec[key] ?? '—') : id || '—'
    },
    inr, fmtDate,
  }

  const sortBtn = (col) => (
    <button className="inline-flex items-center gap-1 hover:text-slate-700" onClick={() => setSort((s) => (s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }))}>
      {col.label}
      {sort?.key === col.key ? (sort.dir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : <ChevronUp size={12} className="opacity-0 group-hover:opacity-40" />}
    </button>
  )

  return (
    <div>
      {!embedded && <PageHeader title={config.title} desc={config.desc} actions={
        <>
          <Button variant="secondary" onClick={doExport}><Download size={15} /> Export CSV</Button>
          {canCreate && <Button onClick={openAdd}><Plus size={16} /> Add {config.singular || 'Record'}</Button>}
        </>
      } />}

      {stats.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {stats.slice(0, 5).map((s, i) => <StatCard key={i} {...s} />)}
        </div>
      )}

      <Card className="overflow-hidden anim-fadeUp">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-3.5">
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="input pl-9" />
          </div>
          {(config.filters || []).map((f) => (
            <select key={f.key} value={filters[f.key] || ''} onChange={(e) => setFilters((fl) => ({ ...fl, [f.key]: e.target.value }))} className="input w-auto min-w-[130px] cursor-pointer text-xs font-medium">
              <option value="">{f.label}: All</option>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ))}
          <span className="ml-auto hidden text-xs font-medium text-slate-400 sm:block">{rows.length} records</span>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title="No records found"
            message={canCreate ? 'Get started by adding the first record.' : 'No records match your filters.'}
            action={canCreate && !embedded ? <Button onClick={openAdd}><Plus size={16} /> Add {config.singular}</Button> : null}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead className="border-b border-slate-100 bg-slate-50/60">
                <tr>
                  {config.columns.map((col) => (
                    <th key={col.key} className="th group">{col.sortable !== false ? sortBtn(col) : col.label}</th>
                  ))}
                  <th className="th text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paged.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70" onDoubleClick={() => canEdit && openEdit(row)}>
                    {config.columns.map((col) => (
                      <td key={col.key} className="td">{col.render ? col.render(row, api) : (row[col.key] ?? '—')}</td>
                    ))}
                    <td className="td">
                      <div className="flex items-center justify-end gap-1">
                        {canApprove && config.approve && config.approve.from.includes(row[config.statusField]) && (
                          <button title="Approve" onClick={() => handleApprove(row)} className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"><CheckCircle2 size={16} /></button>
                        )}
                        {canEdit && <button title="Edit" onClick={() => openEdit(row)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"><Pencil size={15} /></button>}
                        {canDelete && <button title="Delete" onClick={() => handleDelete(row)} className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={15} /></button>}
                        {!canEdit && !canDelete && !(canApprove && config.approve) && <span className="text-xs text-slate-300 pr-2">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
            <div className="flex gap-1.5">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}><ChevronLeft size={14} /> Prev</Button>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next <ChevronRight size={14} /></Button>
            </div>
          </div>
        )}
      </Card>

      {modal && (
        <FormModal
          key={modal.mode + (modal.row.id || 'new')}
          config={config}
          fixed={fixed}
          mode={modal.mode}
          row={modal.row}
          canEdit={canEdit}
          onClose={() => setModal(null)}
          onSaved={(mode) => { setModal(null); toast(mode === 'add' ? 'Record added successfully' : 'Record updated') }}
        />
      )}
    </div>
  )
}

function FormModal({ config, fixed, mode, row, onClose, onSaved }) {
  const [form, setForm] = useState(() => {
    const init = {}
    config.fields.forEach((f) => { init[f.key] = row[f.key] ?? f.default ?? '' })
    Object.assign(init, fixed)
    return init
  })
  const [errors, setErrors] = useState({})

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    config.fields.forEach((f) => {
      if (f.required && !String(form[f.key] ?? '').trim()) errs[f.key] = 'Required'
    })
    setErrors(errs)
    if (Object.keys(errs).length) return
    const data = { ...form }
    if (mode === 'add') db.insert(config.collection, data, config.title)
    else db.update(config.collection, row.id, data, config.title, data.name || data.title || data.code)
    onSaved(mode)
  }

  const resolveOptions = (f) => {
    if (f.options) return f.options
    if (f.optionsFn) return f.optionsFn()
    return []
  }

  return (
    <Modal open onClose={onClose} title={mode === 'add' ? `Add ${config.singular || 'Record'}` : `Edit ${config.singular || 'Record'}`} wide={config.fields.length > 7}>
      <form onSubmit={submit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {config.fields.filter((f) => !fixed[f.key]).map((f) => (
            <Field key={f.key} label={f.label} required={f.required} className={f.full ? 'sm:col-span-2' : ''}>
              {f.type === 'textarea' ? (
                <textarea rows={f.rows || 3} className="input" value={form[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder || ''} />
              ) : f.type === 'select' ? (
                <Select value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {resolveOptions(f).map((o) => <option key={o} value={o}>{o}</option>)}
                </Select>
              ) : f.type === 'ref' ? (
                <Select value={form[f.key] ?? ''} onChange={(e) => set(f.key, e.target.value)}>
                  <option value="">Select…</option>
                  {db.list(f.ref).map((r) => <option key={r.id} value={r.id}>{f.refDisplay ? f.refDisplay(r) : (r[f.refLabel || 'name'] || r.name)}</option>)}
                </Select>
              ) : (
                <div className="relative">
                  {f.type === 'money' && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">₹</span>}
                  <input
                    type={f.type === 'money' || f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    className={cn('input', f.type === 'money' && 'pl-7')}
                    value={form[f.key] ?? ''}
                    onChange={(e) => set(f.key, f.type === 'money' || f.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                    placeholder={f.placeholder || ''}
                  />
                </div>
              )}
              {errors[f.key] && <p className="mt-1 text-xs text-rose-500">{errors[f.key]}</p>}
            </Field>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">{mode === 'add' ? 'Save Record' : 'Save Changes'}</Button>
        </div>
      </form>
    </Modal>
  )
}
