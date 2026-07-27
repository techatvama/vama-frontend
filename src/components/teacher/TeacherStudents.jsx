import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../lib/api';
import { useAppData } from '../../context/AppDataContext';
import StudentProgressEditor from '../StudentProgressEditor';
import {
    Search,
    Filter,
    ArrowUpDown,
    GraduationCap,
    BookOpen,
    Award,
    ChevronRight,
    User,
    Plus,
    Loader2,
    Calendar,
    Zap,
    CheckCircle2,
    X,
    LayoutGrid,
    Table2,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const AVATAR_COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#3b82f6', '#ef4444', '#14b8a6'];
const aColor = (id) => AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length];
const initials = (f, l) => `${(f || '?')[0]}${(l || '')[0] || ''}`.toUpperCase();

function SortIcon({ col, sortConfig }) {
    if (sortConfig.key !== col) return <ChevronsUpDown size={12} className="text-slate-300" />;
    return sortConfig.dir === 'asc'
        ? <ChevronUp size={12} className="text-[#463a7a]" />
        : <ChevronDown size={12} className="text-[#463a7a]" />;
}

function ProgressBar({ pct }) {
    const p = Math.min(100, Math.max(0, pct || 0));
    const color = p >= 75 ? 'from-emerald-500 to-emerald-400' : p >= 40 ? 'from-amber-500 to-amber-400' : 'from-rose-500 to-rose-400';
    return (
        <div className="flex items-center gap-2 min-w-[90px]">
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: `${p}%` }} />
            </div>
            <span className="text-xs font-black text-slate-700 w-8 text-right">{p}%</span>
        </div>
    );
}

export default function TeacherStudents() {
    const { gradeNames } = useAppData();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('All');
    const [filterSyllabus, setFilterSyllabus] = useState('All');
    const [filterExamStatus, setFilterExamStatus] = useState('All');
    const [filterExamDate, setFilterExamDate] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [view, setView] = useState('cards'); // 'cards' | 'table'
    const [tableSortConfig, setTableSortConfig] = useState({ key: 'first_name', dir: 'asc' });
    const [progressFor, setProgressFor] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const teacher = JSON.parse(localStorage.getItem('teacher'));
        if (!teacher) {
            navigate('/teacher-login');
            return;
        }
        fetchStudents(teacher.id);
    }, []);

    const fetchStudents = async (teacherId) => {
        setLoading(true);
        try {
            const response = await api.get(`/teacher/${teacherId}/students`);
            setStudents(response.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedStudents = [...students].sort((a, b) => {
        const valA = a[sortConfig.key]?.toString().toLowerCase() || '';
        const valB = b[sortConfig.key]?.toString().toLowerCase() || '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredStudents = sortedStudents.filter(s => {
        const matchesSearch = `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = filterGrade === 'All' || s.current_grade === filterGrade;
        const matchesSyllabus = filterSyllabus === 'All' || s.syllabus_type === filterSyllabus;
        const matchesExam = filterExamStatus === 'All' ||
            (filterExamStatus === 'Exam' && s.is_exam_student) ||
            (filterExamStatus === 'Regular' && !s.is_exam_student);

        // Exam date match (e.g., filter by month or year)
        let matchesExamDate = true;
        if (filterExamDate !== 'All' && s.exam_date) {
            matchesExamDate = s.exam_date.includes(filterExamDate);
        }

        return matchesSearch && matchesGrade && matchesSyllabus && matchesExam && matchesExamDate;
    });

    const grades = gradeNames;
    const syllabuses = ['Trinity', 'RSL', 'ABRSM'];

    const tableSort = (key) => setTableSortConfig(c => ({ key, dir: c.key === key && c.dir === 'asc' ? 'desc' : 'asc' }));
    const tableSorted = useMemo(() => {
        const key = tableSortConfig.key;
        return [...filteredStudents].sort((a, b) => {
            let va = key === 'name' ? `${a.first_name} ${a.last_name}` : (a[key] ?? '');
            let vb = key === 'name' ? `${b.first_name} ${b.last_name}` : (b[key] ?? '');
            if (typeof va === 'number') return tableSortConfig.dir === 'asc' ? va - vb : vb - va;
            return tableSortConfig.dir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
    }, [filteredStudents, tableSortConfig]);

    const thClass = "px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap cursor-pointer select-none hover:text-[#463a7a] transition-colors";

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden bg-[#463a7a] rounded-[40px] p-8 lg:p-12 shadow-2xl shadow-indigo-900/20">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Zap className="w-64 h-64 text-white fill-current translate-x-32 -translate-y-32" />
                </div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter">My Students</h1>
                        <p className="text-indigo-100/60 font-medium mt-2 text-lg">Managing {filteredStudents.length} active artists</p>
                    </div>
                    <button
                        onClick={() => navigate('/schedule')}
                        className="flex items-center gap-2 bg-white text-[#463a7a] px-6 py-4 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all w-fit"
                    >
                        <Plus className="w-5 h-5" />
                        ASSIGN TO BATCH
                    </button>
                </div>
            </div>

            {/* Filters Area */}
            <div className="bg-white rounded-[32px] p-6 lg:p-8 shadow-xl shadow-slate-200 border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative md:col-span-2 lg:col-span-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a] transition-all font-medium text-slate-700"
                        />
                    </div>

                    {/* Grade Filter */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterGrade}
                            onChange={(e) => setFilterGrade(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a] transition-all font-bold text-slate-700 appearance-none"
                        >
                            <option value="All">All Grades</option>
                            {grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    {/* Syllabus Filter */}
                    <div className="relative">
                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterSyllabus}
                            onChange={(e) => setFilterSyllabus(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a] transition-all font-bold text-slate-700 appearance-none"
                        >
                            <option value="All">All Syllabuses</option>
                            {syllabuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* Exam Status Filter */}
                    <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterExamStatus}
                            onChange={(e) => setFilterExamStatus(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a] transition-all font-bold text-slate-700 appearance-none"
                        >
                            <option value="All">All Tracks</option>
                            <option value="Exam">Exam Track</option>
                            <option value="Regular">Regular Track</option>
                        </select>
                    </div>

                    {/* Exam Date Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={filterExamDate}
                            onChange={(e) => setFilterExamDate(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 focus:border-[#463a7a] transition-all font-bold text-slate-700 appearance-none"
                        >
                            <option value="All">Any Exam Date</option>
                            <option value="2026-03">March 2026</option>
                            <option value="2026-06">June 2026</option>
                            <option value="2026-12">Dec 2026</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* View toggle */}
            <div className="flex items-center justify-between">
                <p className="text-sm font-black text-slate-500">{filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}</p>
                <div className="flex gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setView('cards')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'cards' ? 'bg-[#463a7a] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <LayoutGrid size={13} /> Cards
                    </button>
                    <button onClick={() => setView('table')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${view === 'table' ? 'bg-[#463a7a] text-white' : 'text-slate-500 hover:bg-slate-50'}`}>
                        <Table2 size={13} /> Table
                    </button>
                </div>
            </div>

            {/* Cards View */}
            {view === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="bg-white rounded-[32px] p-6 h-48 animate-pulse border border-slate-100" />
                        ))
                    ) : filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                            <div
                                key={student.id}
                                onClick={() => navigate(`/teacher-portal/students/${student.id}`)}
                                className="group bg-white rounded-[40px] p-6 shadow-lg shadow-slate-200 border border-slate-100 hover:border-[#463a7a] hover:shadow-2xl hover:shadow-indigo-100 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center"
                            >
                                {student.is_exam_student && (
                                    <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                                        <Award className="w-3 h-3" /> Exam
                                    </div>
                                )}
                                <div className="w-20 h-20 rounded-[28px] flex items-center justify-center text-2xl font-black text-white mb-4 group-hover:scale-110 transition-transform"
                                    style={{ backgroundColor: aColor(student.id) }}>
                                    {initials(student.first_name, student.last_name)}
                                </div>
                                <h3 className="text-xl font-black text-slate-900 leading-tight">{student.first_name} {student.last_name}</h3>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">{student.desired_course || 'Music Student'}</p>
                                <div className="grid grid-cols-2 gap-3 w-full mt-6">
                                    <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade</span>
                                        <span className="text-sm font-black text-[#463a7a]">{student.current_grade || 'Debut'}</span>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syllabus</span>
                                        <span className="text-sm font-black text-[#463a7a]">{student.syllabus_type || 'N/A'}</span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-50 w-full flex items-center justify-between group-hover:px-2 transition-all">
                                    <div className="flex -space-x-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-black text-[#463a7a]">
                                        VIEW PROFILE <ChevronRight className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white rounded-[40px] p-20 text-center border-2 border-dashed border-slate-100">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User className="w-10 h-10 text-slate-200" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-300">No students found</h3>
                            <p className="text-slate-400 font-medium">Try adjusting your filters or search terms</p>
                        </div>
                    )}
                </div>
            )}

            {/* Table View */}
            {view === 'table' && (
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-lg overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#463a7a]" size={32} /></div>
                    ) : tableSorted.length === 0 ? (
                        <div className="py-20 text-center">
                            <p className="text-xl font-black text-slate-200">No students found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className={thClass} onClick={() => tableSort('name')}>
                                            <span className="flex items-center gap-1">Student <SortIcon col="name" sortConfig={tableSortConfig} /></span>
                                        </th>
                                        <th className={thClass} onClick={() => tableSort('desired_course')}>
                                            <span className="flex items-center gap-1">Course <SortIcon col="desired_course" sortConfig={tableSortConfig} /></span>
                                        </th>
                                        <th className={thClass} onClick={() => tableSort('current_grade')}>
                                            <span className="flex items-center gap-1">Grade <SortIcon col="current_grade" sortConfig={tableSortConfig} /></span>
                                        </th>
                                        <th className={thClass} onClick={() => tableSort('syllabus_type')}>
                                            <span className="flex items-center gap-1">Syllabus <SortIcon col="syllabus_type" sortConfig={tableSortConfig} /></span>
                                        </th>
                                        <th className={thClass} onClick={() => tableSort('progress_pct')}>
                                            <span className="flex items-center gap-1">Progress <SortIcon col="progress_pct" sortConfig={tableSortConfig} /></span>
                                        </th>
                                        <th className={thClass}>Exam</th>
                                        <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tableSorted.map(s => (
                                        <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
                                                        style={{ backgroundColor: aColor(s.id) }}>
                                                        {initials(s.first_name, s.last_name)}
                                                    </div>
                                                    <p className="text-sm font-black text-slate-900 group-hover:text-[#463a7a] transition-colors">
                                                        {s.first_name} {s.last_name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm font-bold text-slate-700">{s.desired_course || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-[#463a7a] text-[11px] font-black rounded-lg">
                                                    <GraduationCap size={10} /> {s.current_grade || 'Debut'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.syllabus_type ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 text-[11px] font-black rounded-lg">
                                                        <BookOpen size={10} /> {s.syllabus_type}
                                                    </span>
                                                ) : <span className="text-slate-300 text-xs font-bold">—</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.progress_total > 0 ? (
                                                    <div>
                                                        <ProgressBar pct={s.progress_pct} />
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.progress_done}/{s.progress_total} topics</p>
                                                    </div>
                                                ) : <span className="text-slate-300 text-xs font-bold">No syllabus</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                {s.is_exam_student ? (
                                                    <div>
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg">
                                                            <Award size={9} /> Exam
                                                        </span>
                                                        {s.exam_date && <p className="text-[10px] text-slate-400 font-bold mt-0.5">{s.exam_date}</p>}
                                                    </div>
                                                ) : <span className="text-[10px] text-slate-400 font-bold">Regular</span>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/teacher-portal/students/${s.id}`)}
                                                        className="text-[11px] font-black text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1">
                                                        <User size={11} /> Profile
                                                    </button>
                                                    <button
                                                        onClick={() => setProgressFor(s)}
                                                        className="text-[11px] font-black text-[#463a7a] bg-indigo-50 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                                                        Progress
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="px-4 py-3 border-t border-slate-50 text-[11px] font-bold text-slate-400">
                                {tableSorted.length} student{tableSorted.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Progress Modal */}
            {progressFor && (
                <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center p-0 lg:p-4">
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setProgressFor(null)} />
                    <div className="relative bg-white rounded-t-[32px] lg:rounded-[32px] w-full lg:max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between p-5 border-b border-slate-100">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tighter">Progress Tracker</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                    {progressFor.first_name} {progressFor.last_name}
                                    {progressFor.desired_course ? ` · ${progressFor.desired_course}` : ''}
                                    {progressFor.current_grade ? ` · ${progressFor.current_grade}` : ''}
                                </p>
                            </div>
                            <button onClick={() => setProgressFor(null)}
                                className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                            <StudentProgressEditor studentIdFromProps={progressFor.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
