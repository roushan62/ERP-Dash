import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { currentUser, useDbVersion } from '../lib/db.js'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

let toastId = 0

export function AppProvider({ children }) {
  useDbVersion()
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null)
  const user = currentUser()

  const toast = useCallback((msg, type = 'success') => {
    const id = ++toastId
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }, [])

  const confirm = useCallback((opts) => {
    return new Promise((resolve) => {
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  const value = { user, toast, confirm }
  return (
    <Ctx.Provider value={value}>
      {children}
      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`anim-slideIn flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ring-1 ${t.type === 'error' ? 'bg-rose-600 text-white ring-rose-700' : 'bg-slate-900 text-white ring-slate-700'}`}>
            {t.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} className="text-emerald-400" />}
            {t.msg}
          </div>
        ))}
      </div>
      {/* Confirm dialog */}
      {confirmState && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm anim-fadeIn p-4">
          <div className="card w-full max-w-md p-6 anim-fadeUp">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-rose-100 p-2.5"><AlertTriangle className="text-rose-600" size={20} /></div>
              <div>
                <h3 className="font-semibold text-slate-900">{confirmState.title || 'Are you sure?'}</h3>
                <p className="mt-1 text-sm text-slate-500">{confirmState.message || 'This action cannot be undone.'}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                onClick={() => { confirmState.resolve(false); setConfirmState(null) }}
              >Cancel</button>
              <button
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
                onClick={() => { confirmState.resolve(true); setConfirmState(null) }}
              >{confirmState.confirmText || 'Delete'}</button>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
