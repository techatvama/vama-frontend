import React, { useState } from 'react'
import { X } from 'lucide-react'

export default function AddStaffModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    takesClasses: true,
  })

  if (!open) return null

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function submit(e) {
    e.preventDefault()
    if (!form.firstName || !form.lastName || !form.email || !form.role) return
    const newStaff = {
      name: form.firstName + ' ' + form.lastName,
      role: form.role,
      phone: form.phone || '—',
      email: form.email,
      calendar: !!form.takesClasses,
    }
    onSave(newStaff)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Add staff</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 px-6 py-5">
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
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
            <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
