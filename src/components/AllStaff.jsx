import React, { useMemo, useState } from 'react'
import { Plus, Search, MoreVertical } from 'lucide-react'
import AddStaffModal from './AddStaffModal.jsx'

function Switch({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} aria-pressed={checked} aria-label={label || 'toggle'}
      className="relative inline-flex h-6 w-11 items-center rounded-full">
      <span className={`absolute inset-0 rounded-full border transition ${checked ? 'bg-emerald-600/10 border-emerald-600/40' : 'bg-slate-100 border-slate-300'}`} />
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-6 ring-1 ring-emerald-600/50' : 'translate-x-1 ring-1 ring-slate-300'}`} />
    </button>
  )
}

function RoleBadge({ children }) {
  return <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">{children}</span>
}

const INITIAL = [
  { name: 'Aditya Darnal', role: 'Teacher', phone: '+91 95646 40363', email: 'adityadarnal94@gmail.com', calendar: true },
  { name: 'Sailu Rasaily', role: 'Teacher', phone: '+91 62960 95869', email: 'sailendra95rasaily@gmail.com', calendar: true },
  { name: 'Th D Thangneilar Chiru', role: 'Teacher', phone: '+91 70052 62256', email: 'thangneilarchiru@gmail.com', calendar: true },
  { name: 'Sumit Bhujel', role: 'Teacher', phone: '+91 6295 152 941', email: 'sumitbhujel1821@gmail.com', calendar: true },
  { name: 'Biren Limboo', role: 'Teacher', phone: '+91 81459 92384', email: 'subba1783@gmail.com', calendar: true },
  { name: 'Sonal Tony', role: 'Teacher', phone: '+91 81569 69231', email: 'sonaltonymusic@gmail.com', calendar: true },
  { name: 'Pradhyum Shanker', role: 'Teacher', phone: '+91 62941 59606', email: 'shankerpradhyum400@gmail.com', calendar: true },
]

export default function AllStaff() {
  const [query, setQuery] = useState('')
  const [archived, setArchived] = useState(false)
  const [rows, setRows] = useState(INITIAL)
  const [cal, setCal] = useState(() => Object.fromEntries(INITIAL.map(s => [s.email, s.calendar])))
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(s => [s.name, s.role, s.phone, s.email].some(v => v.toLowerCase().includes(q)))
  }, [query, rows])

  function addStaff(newStaff) {
    setRows(prev => [newStaff, ...prev])
    setCal(prev => ({ ...prev, [newStaff.email]: !!newStaff.calendar }))
  }

  return (
    <div className="min-h-screen w-full bg-white p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">All staff</h1>
            <p className="mt-1 text-sm text-slate-600">Add and manage staff members — their offerings, work hours, and pay rates.</p>
            <button className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-800">How to add team members</button>
          </div>

          <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700">
            <Plus className="h-4 w-4" /> Add staff
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-1 items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff members"
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-slate-400 focus:outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            Archived
            <Switch checked={archived} onChange={setArchived} label="Archived" />
          </label>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-12 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
            <div className="col-span-4 pl-6">Name</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2">Calendar</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Email</div>
          </div>

          <ul className="divide-y divide-slate-200">
            {filtered.map((s) => (
              <li key={s.email} className="grid grid-cols-12 items-center px-4 py-4 hover:bg-slate-50">
                <div className="col-span-4 flex items-center gap-3 pl-4">
                  <span className="cursor-grab rounded p-1 text-slate-400">⋮⋮</span>
                  <div><p className="font-medium text-slate-900">{s.name}</p></div>
                </div>
                <div className="col-span-2"><RoleBadge>{s.role}</RoleBadge></div>
                <div className="col-span-2">
                  <Switch checked={!!cal[s.email]} onChange={(v) => setCal(prev => ({ ...prev, [s.email]: v }))} label={`Calendar for ${s.name}`} />
                </div>
                <div className="col-span-2 text-slate-700">{s.phone}</div>
                <div className="col-span-2 flex items-center justify-between gap-2">
                  <a href={`mailto:${s.email}`} className="truncate text-sky-700 hover:underline" title={s.email}>{s.email}</a>
                  <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-6 py-8 text-center text-slate-500">No staff match your search.</li>}
          </ul>
        </div>
      </div>

      <AddStaffModal open={open} onClose={() => setOpen(false)} onSave={addStaff} />
    </div>
  )
}
