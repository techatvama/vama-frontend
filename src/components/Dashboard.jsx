import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { api } from "../lib/api";
import Sidebar from "./Sidebar";
import AddStudentDialog from "./AddStudentDialog";
import { Search, ChevronLeft, ChevronRight, Edit, Loader2 } from "lucide-react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const navigate = useNavigate();

  // State management
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [addaction, setAddAction] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

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
    "Desired Course": s.desired_course || "—",
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
      const response = await api.get("/students");
      setRecords((response.data || []).map(mapStudent));
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.detail || err.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

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

  // Filtering & Sorting
  const filteredRecords = useMemo(() => {
    return records.filter(record =>
      Object.entries(record).some(([key, value]) =>
        key !== 'id' && String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [records, searchTerm]);

  const sortedRecords = useMemo(() => {
    if (!sortConfig.key) return filteredRecords;
    return [...filteredRecords].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === bValue) return 0;
      return (aValue > bValue ? 1 : -1) * (sortConfig.direction === 'asc' ? 1 : -1);
    });
  }, [filteredRecords, sortConfig]);

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

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Toolbar */}
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Search students..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
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
                    <td colSpan={Object.keys(columnConfig).length + 2} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading data...
                      </div>
                    </td>
                  </tr>
                ) : paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={Object.keys(columnConfig).length + 2} className="px-6 py-12 text-center text-slate-500">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((record, idx) => (
                    <tr
                      key={record.id}
                      className="group hover:bg-slate-50 transition-colors even:bg-slate-50/30"
                    >
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {((currentPage - 1) * rowsPerPage) + idx + 1}
                      </td>
                      {Object.keys(columnConfig).map((key) => (
                        <td key={key} className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">
                          {key === 'First Name' || key === 'Last Name' ? (
                            <button
                              onClick={() => navigate(`/students/${record.id}`)}
                              className="font-medium text-[#463a7a] hover:underline text-left"
                            >
                              {record[key] || "—"}
                            </button>
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
