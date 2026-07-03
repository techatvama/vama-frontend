import React, { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'

export default function AddStaffModal({ open, onClose, onSave, initialData }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    takesClasses: true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setError('')
      if (initialData) {
        setForm({
          firstName: initialData.firstName || initialData.name?.split(' ')[0] || '',
          lastName: initialData.lastName || initialData.name?.split(' ').slice(1).join(' ') || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          role: initialData.role || '',
          takesClasses: initialData.takesClasses !== undefined ? initialData.takesClasses : true,
        })
      } else {
        setForm({ firstName: '', lastName: '', email: '', phone: '', role: '', takesClasses: true })
      }
    }
  }, [open, initialData])


  if (!open) return null

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function submit(e) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.role) return
    setLoading(true)
    setError('')
    const newStaff = {
      name: form.firstName + ' ' + form.lastName,
      role: form.role,
      phone: form.phone || '',
      email: form.email,
      calendar: !!form.takesClasses,
      firstName: form.firstName,
      lastName: form.lastName,
      takesClasses: form.takesClasses,
    }
    try {
      await onSave(newStaff)
      onClose()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(
        Array.isArray(detail)
          ? detail.map(d => d.msg).join(', ')
          : (detail || 'Failed to save staff. Please try again.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{initialData ? 'Edit staff' : 'Add staff'}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm text-red-700">{error}</div>
          )}
          <div>
            <h3 className="text-base font-semibold text-slate-900">Personal information</h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">First name *</label>
              <input name="firstName" value={form.firstName} onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Jane" required />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Last name *</label>
              <input name="lastName" value={form.lastName} onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
                placeholder="Doe" required />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <input type="email" name="email" value={form.email} onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="jane@example.com" required />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              placeholder="+91" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Role *</label>
            <select name="role" value={form.role} onChange={handleChange}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none" required>
              <option value="">Choose a role...</option>
              <option value="Teacher">Teacher</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" name="takesClasses" checked={form.takesClasses} onChange={handleChange} />
            Takes classes
            <span className="text-slate-500">Allow staff member to make and receive bookings on the calendar.</span>
          </label>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={loading}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              style={{ backgroundColor: '#463a7a' }}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
