import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { api } from "../lib/api";
import Sidebar from "./Sidebar";
import AddStudentDialog from "./AddStudentDialog";
import { Search, ChevronLeft, ChevronRight, Edit, Loader2, Users, UserCheck, UserPlus, Download, Upload, X, CheckCircle2, XCircle, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router";
import * as XLSX from "xlsx";

const BULK_UPLOAD_TEMPLATE_COLUMNS = [
  "First Name", "Last Name", "Email", "Phone", "Gender",
  "Course", "Center", "Teacher", "Address", "Date of Birth",
];

export default function Dashboard() {
  const navigate = useNavigate();

  // State management
  const [records, setRecords] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");     // all | active | inactive
  const [teacherFilter, setTeacherFilter] = useState("all");   // all | <teacher_id>
  const [subjectFilter, setSubjectFilter] = useState("all");   // all | <subject>
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [addaction, setAddAction] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [bulkRows, setBulkRows] = useState(null);       // parsed rows awaiting confirmation
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);  // per-row outcome after submit
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [bulkCreateSel, setBulkCreateSel] = useState(new Set()); // selected row indexes to actually create
  const [selectedIds, setSelectedIds] = useState(new Set());     // selected student ids (table, for delete)
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResults, setDeleteResults] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSnapshot, setDeleteSnapshot] = useState({});  // id -> record, frozen before delete for the results view
  const bulkFileInputRef = React.useRef(null);

  // Constants
  const columnConfig = {
    "Timestamp": "Joined On",
    "First Name": "First Name",
    "Last Name": "Last Name",
    "Email": "Email",
    "Desired Course": "Course",
    "Primary Phone Number": "Phone",
    "Select your nearest Vama Center ": "Center"
  };

  const mapStudent = (s) => ({
    ...s,
    "Timestamp": s.created_at ? new Date(s.created_at).toLocaleDateString() : "—",
    "First Name": s.first_name || "—",
    "Last Name": s.last_name || "—",
    "Email": s.email || "—",
    "Desired Course": s.desired_course || s.instrument || "—",
    "Primary Phone Number": s.primary_phone_number || "—",
    "Select your nearest Vama Center ": s.nearest_vama_center || "—",
    "Address": s.address || "—",
    "Gender": s.gender || "—",
    "Date of Birth": s.date_of_birth || "—",
    "Preferred Mode of Contact": s.preferred_mode_of_contact || "—"
  });

  // Fetch Data
  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, staffRes] = await Promise.all([
        api.get("/students"),
        api.get("/staff").catch(() => ({ data: [] })),
      ]);
      setStaffList(staffRes.data || []);
      setRecords((studentsRes.data || []).map(mapStudent));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  const teacherName = (teacherId) => staffList.find(t => t.id === teacherId)?.name || "Unassigned";

  // Called by AddStudentDialog after save.
  // If updatedStudent is provided (edit), patch local state — no re-fetch needed.
  // If null (new student added), do a full re-fetch.
  const handleStudentSaved = async (updatedStudent) => {
    if (updatedStudent?.id) {
      setRecords(prev =>
        prev.map(r => r.id === updatedStudent.id ? mapStudent(updatedStudent) : r)
      );
    } else {
      await fetchStudents();
    }
  };

  const { pathname } = useLocation();

  useEffect(() => {
    fetchStudents();
    if (pathname.endsWith('/add')) {
      setAddAction(true);
    }
  }, [pathname]);

  const subjectOptions = useMemo(() => {
    const set = new Set(records.map(r => r["Desired Course"]).filter(v => v && v !== "—"));
    return Array.from(set).sort();
  }, [records]);

  // Filtering & Sorting
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const matchesSearch = Object.entries(record).some(([key, value]) =>
        key !== 'id' && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (!matchesSearch) return false;

      const status = record.enrollment_status || 'active';
      if (statusFilter === 'active' && status !== 'active') return false;
      if (statusFilter === 'inactive' && status === 'active') return false;

      if (teacherFilter !== 'all' && String(record.teacher_id || '') !== teacherFilter) return false;

      if (subjectFilter !== 'all' && record["Desired Course"] !== subjectFilter) return false;

      return true;
    });
  }, [records, searchTerm, statusFilter, teacherFilter, subjectFilter]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === bValue) return 0;
      return (aValue > bValue ? 1 : -1) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
  }, [filteredRecords, sortConfig]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    return {
      total: records.length,
      active: records.filter(r => (r.enrollment_status || 'active') === 'active').length,
      newToday: records.filter(r => r.created_at && new Date(r.created_at).toDateString() === today).length,
    };
  }, [records]);

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / rowsPerPage);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setAddAction(true);
  };

  const handleCloseModal = () => {
    setAddAction(false);
    setEditingStudent(null);
  };

  const handleDownloadExcel = () => {
    const rows = sortedRecords.map(r => ({
      "Joined On": r["Timestamp"],
      "First Name": r["First Name"],
      "Last Name": r["Last Name"],
      "Email": r["Email"],
      "Phone": r["Primary Phone Number"],
      "Course": r["Desired Course"],
      "Center": r["Select your nearest Vama Center "],
      "Teacher": teacherName(r.teacher_id),
      "Status": (r.enrollment_status || 'active') === 'active' ? 'Active'
        : r.enrollment_status === 'on_break' ? 'On Break' : 'Dropped',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    const stamp = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `students-${stamp}.xlsx`);
  };

  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([BULK_UPLOAD_TEMPLATE_COLUMNS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "students-bulk-upload-template.xlsx");
  };

  const handleBulkFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const teacherByName = new Map(
      staffList.map(t => [String(t.name || "").trim().toLowerCase(), t.id])
    );

    const parsed = rows.map((r, idx) => {
      const get = (...keys) => {
        for (const k of keys) {
          if (r[k] !== undefined && String(r[k]).trim() !== "") return String(r[k]).trim();
        }
        return "";
      };
      const email = get("Email", "email");
      const teacherName = get("Teacher", "teacher");
      return {
        _row: idx + 2, // +2: header row + 1-indexing, matches spreadsheet line number
        first_name: get("First Name", "first_name"),
        last_name: get("Last Name", "last_name"),
        email,
        primary_phone_number: get("Phone", "Primary Phone Number", "primary_phone_number"),
        gender: get("Gender", "gender"),
        desired_course: get("Course", "Desired Course", "desired_course"),
        nearest_vama_center: get("Center", "nearest_vama_center"),
        address: get("Address", "address"),
        date_of_birth: get("Date of Birth", "date_of_birth"),
        teacher_id: teacherName ? teacherByName.get(teacherName.toLowerCase()) : undefined,
        _error: !email ? "Missing email" : !get("First Name", "first_name") ? "Missing first name" : null,
      };
    });

    setBulkResults(null);
    setBulkRows(parsed);
    setBulkCreateSel(new Set(parsed.filter(r => !r._error).map(r => r._row)));
  };

  const toggleBulkRowSel = (rowId) => {
    setBulkCreateSel(prev => {
      const next = new Set(prev);
      next.has(rowId) ? next.delete(rowId) : next.add(rowId);
      return next;
    });
  };

  const toggleBulkSelAll = () => {
    const selectable = bulkRows.filter(r => !r._error).map(r => r._row);
    setBulkCreateSel(prev =>
      selectable.every(id => prev.has(id)) ? new Set() : new Set(selectable)
    );
  };

  const toggleSelectId = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (pageRecords) => {
    const ids = pageRecords.map(r => r.id);
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      const next = new Set(prev);
      ids.forEach(id => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const closeDeleteModal = () => {
    setDeleteConfirm(false);
    setDeleteResults(null);
    setDeleteConfirmText("");
    setDeleteSnapshot({});
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    const ids = Array.from(selectedIds);
    setDeleteSnapshot(Object.fromEntries(records.filter(r => selectedIds.has(r.id)).map(r => [r.id, r])));
    try {
      const { data } = await api.post("/students/bulk-delete", { student_ids: ids });
      setDeleteResults(data.results);
      const deletedIds = new Set(data.results.filter(r => r.ok).map(r => r.id));
      if (deletedIds.size > 0) {
        setRecords(prev => prev.filter(r => !deletedIds.has(r.id)));
        setSelectedIds(prev => {
          const next = new Set(prev);
          deletedIds.forEach(id => next.delete(id));
          return next;
        });
      }
    } catch (err) {
      setDeleteResults(
        Array.from(selectedIds).map(id => ({ id, ok: false, message: err.response?.data?.detail || err.message || "Failed" }))
      );
    } finally {
      setDeleting(false);
    }
  };

  const closeBulkModal = () => {
    setBulkRows(null);
    setBulkResults(null);
    setBulkProgress({ done: 0, total: 0 });
    setBulkCreateSel(new Set());
  };

  const BULK_CONCURRENCY = 5;

  const handleBulkConfirm = async () => {
    const toSubmit = bulkRows.filter(r => bulkCreateSel.has(r._row));
    if (toSubmit.length === 0) return;

    setBulkUploading(true);
    const results = new Array(toSubmit.length);
    setBulkProgress({ done: 0, total: toSubmit.length });
    let doneCount = 0;

    const submitRow = async (row) => {
      try {
        const { _row, _error, ...payload } = row;
        await api.post("/students", payload);
        return { row, ok: true };
      } catch (err) {
        return { row, ok: false, message: err.response?.data?.detail || err.message || "Failed" };
      }
    };

    let nextIndex = 0;
    const worker = async () => {
      while (nextIndex < toSubmit.length) {
        const i = nextIndex++;
        results[i] = await submitRow(toSubmit[i]);
        doneCount++;
        setBulkProgress({ done: doneCount, total: toSubmit.length });
      }
    };
    await Promise.all(Array.from({ length: Math.min(BULK_CONCURRENCY, toSubmit.length) }, worker));

    setBulkResults(results);
    setBulkUploading(false);
    if (results.some(r => r.ok)) {
      await fetchStudents();
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* <Sidebar /> - Assuming Dashboard is rendered inside a layout or Sidebar is handled upstream */}

      <main className="p-8 max-w-[1600px] mx-auto">
        <AddStudentDialog
          isOpen={addaction}
          onClose={handleCloseModal}
          onSubmit={handleStudentSaved}
          initialData={editingStudent}
        />

        {bulkRows && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900">
                  {bulkResults ? "Bulk Upload Results" : `Review ${bulkRows.length} Student${bulkRows.length === 1 ? "" : "s"}`}
                </h2>
                <button onClick={closeBulkModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 flex-1">
                {!bulkResults && (
                  <p className="text-sm text-slate-500 mb-4">
                    Each row will create a new student account and send an activation email.
                    Rows with errors will be skipped.
                  </p>
                )}
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-bold text-slate-500 uppercase">
                      {!bulkResults && (
                        <th className="py-2 pr-3 w-8">
                          <input
                            type="checkbox"
                            checked={bulkRows.filter(r => !r._error).length > 0 && bulkRows.filter(r => !r._error).every(r => bulkCreateSel.has(r._row))}
                            onChange={toggleBulkSelAll}
                          />
                        </th>
                      )}
                      <th className="py-2 pr-3">Row</th>
                      <th className="py-2 pr-3">Name</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Course</th>
                      <th className="py-2 pr-3">Center</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(bulkResults || bulkRows.map(row => ({ row, ok: null }))).map(({ row, ok, message }) => (
                      <tr key={row._row}>
                        {!bulkResults && (
                          <td className="py-2 pr-3">
                            <input
                              type="checkbox"
                              disabled={!!row._error}
                              checked={bulkCreateSel.has(row._row)}
                              onChange={() => toggleBulkRowSel(row._row)}
                            />
                          </td>
                        )}
                        <td className="py-2 pr-3 text-slate-400">{row._row}</td>
                        <td className="py-2 pr-3">{row.first_name} {row.last_name}</td>
                        <td className="py-2 pr-3">{row.email || "—"}</td>
                        <td className="py-2 pr-3">{row.desired_course || "—"}</td>
                        <td className="py-2 pr-3">{row.nearest_vama_center || "—"}</td>
                        <td className="py-2 pr-3">
                          {ok === null ? (
                            row._error
                              ? <span className="text-red-600 flex items-center gap-1"><XCircle size={14} />{row._error}</span>
                              : <span className="text-slate-400">Ready</span>
                          ) : ok ? (
                            <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={14} />Created</span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1"><XCircle size={14} />{message}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                {bulkResults ? (
                  <button
                    onClick={closeBulkModal}
                    className="px-4 py-2 rounded-xl bg-[#463a7a] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={closeBulkModal}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkConfirm}
                      disabled={bulkUploading || bulkCreateSel.size === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#463a7a] text-white text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {bulkUploading && <Loader2 size={15} className="animate-spin" />}
                      {bulkUploading
                        ? `Creating ${bulkProgress.done} of ${bulkProgress.total}...`
                        : `Create ${bulkCreateSel.size} Selected`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-600" />
                  {deleteResults ? "Delete Results" : "Permanently Delete Students?"}
                </h2>
                <button onClick={closeDeleteModal} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-4 flex-1">
                {deleteResults ? (
                  <ul className="divide-y divide-slate-100 text-sm">
                    {deleteResults.map(r => {
                      const rec = deleteSnapshot[r.id];
                      return (
                        <li key={r.id} className="py-2 flex items-center justify-between gap-3">
                          <span>{rec ? `${rec["First Name"]} ${rec["Last Name"]}` : `#${r.id}`}</span>
                          {r.ok ? (
                            <span className="text-emerald-600 flex items-center gap-1 flex-shrink-0"><CheckCircle2 size={14} />Deleted</span>
                          ) : (
                            <span className="text-red-600 flex items-center gap-1 flex-shrink-0"><XCircle size={14} />{r.message}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <>
                    <p className="text-sm text-slate-600 mb-3">
                      This will <strong>permanently delete {selectedIds.size} student{selectedIds.size === 1 ? "" : "s"}</strong> and
                      all of their invoices, payments, packages, attendance, and class enrollment history. This cannot be undone.
                    </p>
                    <ul className="max-h-40 overflow-y-auto text-sm text-slate-700 mb-4 border border-slate-100 rounded-lg divide-y divide-slate-100">
                      {records.filter(r => selectedIds.has(r.id)).map(r => (
                        <li key={r.id} className="px-3 py-1.5">{r["First Name"]} {r["Last Name"]} — {r["Email"]}</li>
                      ))}
                    </ul>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Type <span className="font-mono font-bold">DELETE</span> to confirm
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      placeholder="DELETE"
                    />
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                {deleteResults ? (
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 rounded-xl bg-[#463a7a] text-white text-sm font-semibold hover:shadow-lg transition-all"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={closeDeleteModal}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmDelete}
                      disabled={deleting || deleteConfirmText !== "DELETE"}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleting && <Loader2 size={15} className="animate-spin" />}
                      {deleting ? "Deleting..." : `Delete ${selectedIds.size} Permanently`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">Students Dashboard</h1>
            <p className="mt-2 text-slate-500">Manage, track, and update student information.</p>
          </div>

          <button
            onClick={() => { setEditingStudent(null); setAddAction(true); }}
            className="inline-flex items-center gap-2 bg-[#463a7a] text-white px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            + Add New Student
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r shadow-sm">
            <p className="text-red-700 font-medium">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#463a7a]/10 flex items-center justify-center flex-shrink-0">
              <Users size={20} className="text-[#463a7a]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stats.total}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Total</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <UserCheck size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stats.active}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">Active</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <UserPlus size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stats.newToday}</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">New Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50/50">
            <div className="relative w-full lg:w-64 flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 flex-1">
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive (Break/Dropped)</option>
              </select>

              <select
                value={teacherFilter}
                onChange={(e) => { setTeacherFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] bg-white"
              >
                <option value="all">All Teachers</option>
                {staffList.map(t => (
                  <option key={t.id} value={String(t.id)}>{t.name}</option>
                ))}
              </select>

              <select
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] bg-white"
              >
                <option value="all">All Subjects</option>
                {subjectOptions.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {selectedIds.size > 0 && (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  <Trash2 size={15} /> Delete Selected ({selectedIds.size})
                </button>
              )}
              <input
                ref={bulkFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleBulkFileChange}
                className="hidden"
              />
              <button
                onClick={() => bulkFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
              >
                <Upload size={15} /> Bulk Upload
              </button>
              <button
                onClick={handleDownloadTemplate}
                className="text-xs text-slate-400 hover:text-[#463a7a] underline underline-offset-2 transition-colors"
              >
                Template
              </button>
              <button
                onClick={handleDownloadExcel}
                disabled={sortedRecords.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={15} /> Download Excel
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-4 w-8">
                    <input
                      type="checkbox"
                      checked={paginatedRecords.length > 0 && paginatedRecords.every(r => selectedIds.has(r.id))}
                      onChange={() => toggleSelectAllOnPage(paginatedRecords)}
                    />
                  </th>
                  <th className="px-6 py-4 w-12">#</th>
                  {Object.keys(columnConfig).map((key) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key)}
                      className="px-6 py-4 cursor-pointer hover:text-[#463a7a] transition-colors select-none"
                    >
                      <div className="flex items-center gap-1">
                        {columnConfig[key]}
                        {sortConfig.key === key && (
                          <span className="text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={Object.keys(columnConfig).length + 3} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(columnConfig).length + 3} className="px-6 py-12 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className="group hover:bg-slate-50 transition-colors even:bg-slate-50/30"
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(record.id)}
                          onChange={() => toggleSelectId(record.id)}
                        />
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {((currentPage - 1) * rowsPerPage) + idx + 1}
                      </td>
                      {Object.keys(columnConfig).map((key) => (
                        <td key={key} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {key === 'First Name' || key === 'Last Name' ? (
                            <span className="flex items-center gap-1.5">
                              <button
                                onClick={() => navigate(`/students/${record.id}`)}
                                className="font-medium text-[#463a7a] hover:underline text-left"
                              >
                                {record[key] || "—"}
                              </button>
                              {record.enrollment_status === 'on_break' && (
                                <span title="On Break" className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                              )}
                              {record.enrollment_status === 'dropped' && (
                                <span title="Dropped" className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
                              )}
                            </span>
                          ) : (
                            record[key] || "—"
                          )}
                        </td>
                      ))}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(record)}
                          className="p-2 text-slate-400 hover:text-[#463a7a] hover:bg-[#463a7a]/10 rounded-full transition-all"
                          title="Edit Student"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && filteredRecords.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border-slate-300 rounded-lg text-sm focus:ring-[#463a7a] focus:border-[#463a7a]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="hidden sm:inline text-slate-400">|</span>
                <span className="text-slate-500">
                  Showing {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, filteredRecords.length)} of {filteredRecords.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(currentPage - p) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && <span className="text-slate-400 px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${currentPage === p
                            ? 'bg-[#463a7a] text-white shadow-md shadow-indigo-500/20'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
