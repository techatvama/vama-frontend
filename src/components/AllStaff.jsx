import { useMemo, useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Plus, Search, Edit, Trash2, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import AddStaffModal from './AddStaffModal.jsx'
import { api } from '../lib/api'

function CalendarSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label="Calendar access"
      className="relative inline-flex h-5 w-9 items-center rounded-full flex-shrink-0 transition-all"
    >
      <span className={`absolute inset-0 rounded-full border transition ${checked ? 'bg-emerald-600/10 border-emerald-600/40' : 'bg-slate-100 border-slate-300'}`} />
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${checked ? 'translate-x-5 ring-1 ring-emerald-600/50' : 'translate-x-0.5 ring-1 ring-slate-300'}`} />
    </button>
  )
}

function RoleBadge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-50 to-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
      {children}
    </span>
  )
}

export default function AllStaff() {
  const [query, setQuery] = useState('')
  const [rows, setRows] = useState([])
  const [cal, setCal] = useState({})   // { [staffId]: boolean }
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Modal states
  const [open, setOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    fetchStaff()
    if (pathname.endsWith('/add')) setOpen(true)
  }, [pathname])

  async function fetchStaff() {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/staff')
      if (Array.isArray(res.data)) {
        setRows(res.data)
        const calState = {}
        res.data.forEach(s => { calState[s.id] = !!s.calendar })
        setCal(calState)
      } else {
        setRows([])
      }
    } catch {
      setError('Failed to load staff members.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCalendarToggle(staffId, value) {
    setCal(prev => ({ ...prev, [staffId]: value }))
    try {
      await api.patch(`/staff/${staffId}/calendar`, null, { params: { enabled: value } })
    } catch {
      // Revert on failure
      setCal(prev => ({ ...prev, [staffId]: !value }))
    }
  }

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(s => [s.name, s.role, s.phone, s.email].some(v => v && v.toLowerCase().includes(q)))
  }, [query, rows])

  // Pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filtered.slice(start, start + rowsPerPage)
  }, [filtered, currentPage, rowsPerPage])

  async function handleSaveStaff(staffData) {
    if (editingStaff) {
      await api.put(`/staff/${editingStaff.id}`, { ...staffData, id: editingStaff.id })
    } else {
      await api.post('/add-staff', staffData)
    }
    fetchStaff()
    setEditingStaff(null)
  }

  function openEditModal(staff) { setEditingStaff(staff); setOpen(true) }
  function openAddModal() { setEditingStaff(null); setOpen(true) }

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              All Staff
            </h1>
            <p className="mt-1 text-sm text-slate-500 hidden sm:block">
              Manage your team. Enable <strong>Calendar</strong> so they appear in the schedule's teacher filter.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl active:scale-95 transition-all"
            style={{ backgroundImage: 'linear-gradient(to right, #463a7a, #5a4b9f)' }}
          >
            <Plus className="h-4 w-4" /> Add Member
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Search */}
        <div className="mb-4 sm:mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setCurrentPage(1) }}
              placeholder="Search staff…"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#463a7a]/30 focus:bg-white focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
            />
          </div>
          {/* Calendar legend */}
          <div className="hidden sm:flex items-center gap-1.5 ml-auto text-xs text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span>Calendar ON = appears in schedule filter</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

          {/* Desktop header */}
          <div className="hidden md:grid grid-cols-12 bg-slate-50 px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <div className="col-span-4 pl-2">Name</div>
            <div className="col-span-2">Role</div>
            <div className="col-span-2 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Calendar
            </div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-2">Email</div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="px-4 py-10 text-center text-slate-500 animate-pulse">Loading…</div>
            ) : paginatedData.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-base font-medium text-slate-900">No staff found</p>
                <p className="text-sm text-slate-500 mt-1">Try adjusting your search.</p>
              </div>
            ) : paginatedData.map(s => (
              <div key={s.id} className="group">

                {/* Desktop row */}
                <div className="hidden md:grid grid-cols-12 items-center px-4 py-3 hover:bg-slate-50 transition-colors">
                  <div className="col-span-4 flex items-center gap-3 pl-2">
                    <div className="h-8 w-8 rounded-full bg-[#463a7a]/10 text-[#463a7a] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {s.firstName?.[0] || s.name?.[0]}
                    </div>
                    <button
                      onClick={() => navigate(`/teacher/${s.id}`)}
                      className="font-medium text-[#463a7a] hover:underline truncate text-left"
                    >
                      {s.name}
                    </button>
                  </div>

                  <div className="col-span-2"><RoleBadge>{s.role}</RoleBadge></div>

                  <div className="col-span-2 flex items-center gap-2">
                    <CalendarSwitch
                      checked={!!cal[s.id]}
                      onChange={v => handleCalendarToggle(s.id, v)}
                    />
                    {cal[s.id] && (
                      <span className="text-[10px] text-emerald-600 font-semibold hidden lg:block">In schedule</span>
                    )}
                  </div>

                  <div className="col-span-2 text-sm text-slate-600 font-mono truncate">{s.phone}</div>

                  <div className="col-span-2 flex items-center justify-between gap-1 pr-1">
                    <a href={`mailto:${s.email}`} className="truncate text-sm text-slate-600 hover:text-[#463a7a]" title={s.email}>
                      {s.email}
                    </a>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button onClick={() => openEditModal(s)} className="p-1.5 text-slate-400 hover:text-[#463a7a] hover:bg-[#463a7a]/10 rounded" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile card */}
                <div className="md:hidden p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#463a7a]/10 text-[#463a7a] flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {s.firstName?.[0] || s.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <button
                          onClick={() => navigate(`/teacher/${s.id}`)}
                          className="font-semibold text-[#463a7a] hover:underline truncate text-left block"
                        >
                          {s.name}
                        </button>
                        <RoleBadge>{s.role}</RoleBadge>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => openEditModal(s)} className="p-2 text-slate-400 hover:text-[#463a7a] hover:bg-[#463a7a]/10 rounded-lg" title="Edit">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1">Phone</p>
                      <p className="text-slate-700 font-mono text-xs">{s.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Calendar
                      </p>
                      <div className="flex items-center gap-2">
                        <CalendarSwitch checked={!!cal[s.id]} onChange={v => handleCalendarToggle(s.id, v)} />
                        {cal[s.id] && <span className="text-[10px] text-emerald-600 font-semibold">In schedule</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-slate-400 uppercase">Email</p>
                    <a href={`mailto:${s.email}`} className="text-sm text-[#463a7a] truncate block">{s.email}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="hidden sm:inline">Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                  className="rounded border-slate-300 bg-white py-1 pl-2 pr-6 text-sm focus:border-[#463a7a] focus:ring-[#463a7a]"
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-xs sm:text-sm">
                  {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, filtered.length)} of {filtered.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-slate-700 min-w-[3rem] text-center">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddStaffModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSaveStaff}
        initialData={editingStaff}
      />
    </div>
  )
}
