import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useAppData } from '../../context/AppDataContext';
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
    X
} from 'lucide-react';
import { useNavigate } from 'react-router';

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

            {/* Students List */}
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
                            {/* Badge for Exam Student */}
                            {student.is_exam_student && (
                                <div className="absolute top-4 right-4 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    Exam
                                </div>
                            )}

                            <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-2xl font-black text-[#463a7a] mb-4 group-hover:scale-110 transition-transform">
                                {student.first_name[0]}{student.last_name[0]}
                            </div>

                            <h3 className="text-xl font-black text-slate-900 leading-tight">
                                {student.first_name} {student.last_name}
                            </h3>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                                {student.desired_course || 'Music Student'}
                            </p>

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
                                        <Calendar className="w-3.4 h-3.5 text-indigo-400" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs font-black text-[#463a7a]">
                                    VIEW PROFILE
                                    <ChevronRight className="w-4 h-4" />
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
        </div>
    );
}
