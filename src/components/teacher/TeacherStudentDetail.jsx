import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    ArrowLeft, Award, BookOpen, TrendingUp,
    Mail, Phone, Save, Loader2, CheckCircle2, Zap,
    Music, MapPin, GraduationCap
} from 'lucide-react';
import StudentProgressEditor from '../StudentProgressEditor';

const FALLBACK_GRADES = [
    'Debut', 'Grade 1', 'Grade 2', 'Grade 3',
    'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'
];

export default function TeacherStudentDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [grade, setGrade] = useState('');
    const [syllabus, setSyllabus] = useState('Trinity');
    const [isExam, setIsExam] = useState(false);
    const [selectedExamSession, setSelectedExamSession] = useState('');
    const [availableExamSessions, setAvailableExamSessions] = useState([]);
    const [availableGrades, setAvailableGrades] = useState([]);
    const [progressKey, setProgressKey] = useState(0);

    useEffect(() => {
        fetchStudentDetails();
        fetchMetadata();
    }, [studentId]);

    const fetchMetadata = async () => {
        try {
            const [gradeRes, examRes] = await Promise.all([
                api.get('/admin/grades'),
                api.get('/admin/exam-sessions')
            ]);
            setAvailableGrades(gradeRes.data.length > 0 ? gradeRes.data.map(g => g.name) : FALLBACK_GRADES);
            setAvailableExamSessions(examRes.data.filter(e => e.is_active));
        } catch {
            setAvailableGrades(FALLBACK_GRADES);
        }
    };

    const fetchStudentDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students/${studentId}/progress`);
            const data = res.data.student;
            setStudent(data);
            setGrade(data.current_grade || 'Debut');
            setSyllabus(data.syllabus_type || 'Trinity');
            setIsExam(data.is_exam_student || false);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setSaving(true);
        try {
            await api.put(`/students/${studentId}`, {
                current_grade: grade,
                syllabus_type: syllabus,
                is_exam_student: isExam,
            });
            setSuccess(true);
            setProgressKey(k => k + 1);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
            console.error(e);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Loader2 className="w-8 h-8 text-[#463a7a] animate-spin" />
        </div>
    );

    if (!student) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <p className="text-slate-400 font-semibold">Student not found.</p>
        </div>
    );

    const initials = `${student.first_name?.[0] ?? ''}${student.last_name?.[0] ?? ''}`.toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50">

            {/* ── Top Header ── */}
            <div className="bg-[#463a7a] px-4 sm:px-8 pt-6 pb-8">
                <div className="max-w-6xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-indigo-300 hover:text-white transition-colors mb-6 text-sm font-semibold"
                    >
                        <ArrowLeft size={16} /> Back to Students
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                            <span className="text-2xl sm:text-3xl font-black text-[#463a7a]">{initials}</span>
                        </div>

                        {/* Name + badges */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                                    Active Artist
                                </span>
                                {student.desired_course && (
                                    <span className="px-3 py-1 bg-white/15 text-indigo-200 text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                                        <Music size={10} /> {student.desired_course}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
                                {student.first_name} {student.last_name}
                            </h1>
                            <p className="text-indigo-300 text-sm font-semibold mt-0.5">
                                #ST-{String(student.id).padStart(4, '0')}
                            </p>
                        </div>

                        {/* Contact chips */}
                        <div className="flex flex-col gap-2 sm:items-end">
                            {student.email && (
                                <a href={`mailto:${student.email}`}
                                    className="flex items-center gap-2 text-indigo-200/70 hover:text-white text-xs font-semibold transition-colors truncate max-w-[200px]">
                                    <Mail size={12} /> {student.email}
                                </a>
                            )}
                            {student.primary_phone_number && (
                                <span className="flex items-center gap-2 text-indigo-200/70 text-xs font-semibold">
                                    <Phone size={12} /> {student.primary_phone_number}
                                </span>
                            )}
                            {student.nearest_vama_center && (
                                <span className="flex items-center gap-2 text-indigo-200/70 text-xs font-semibold">
                                    <MapPin size={12} /> {student.nearest_vama_center}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Student Parameters ── */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Card header */}
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                                <Zap size={16} className="text-[#463a7a]" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Student Parameters</h3>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Grade */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        Performance Grade
                                    </label>
                                    <div className="relative">
                                        <GraduationCap size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <select
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                        >
                                            <option value="">Select grade...</option>
                                            {availableGrades.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Syllabus Track */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        Syllabus Track
                                    </label>
                                    <div className="relative">
                                        <BookOpen size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <select
                                            value={syllabus}
                                            onChange={(e) => setSyllabus(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                        >
                                            <option value="Trinity">Trinity</option>
                                            <option value="RSL">RSL</option>
                                            <option value="ABRSM">ABRSM</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Exam Track toggle */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                        Exam Track
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsExam(v => !v)}
                                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all ${
                                            isExam
                                                ? 'bg-[#463a7a]/5 border-[#463a7a]/30 text-[#463a7a]'
                                                : 'bg-slate-50 border-slate-200 text-slate-500'
                                        }`}
                                    >
                                        <span className="flex items-center gap-2 text-sm font-bold">
                                            <Award size={15} />
                                            {isExam ? 'Exam Track Active' : 'Enable Exam Track'}
                                        </span>
                                        <div className={`w-9 h-5 rounded-full transition-all relative flex-shrink-0 ${isExam ? 'bg-[#463a7a]' : 'bg-slate-200'}`}>
                                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isExam ? 'left-4' : 'left-0.5'}`} />
                                        </div>
                                    </button>

                                    {isExam && (
                                        <div className="mt-3 p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                                            <label className="block text-[10px] font-bold text-[#463a7a] uppercase tracking-widest mb-1.5">
                                                Exam Session
                                            </label>
                                            <select
                                                value={selectedExamSession}
                                                onChange={(e) => setSelectedExamSession(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-lg text-sm font-semibold text-slate-700 focus:outline-none focus:border-[#463a7a] transition-all appearance-none"
                                            >
                                                <option value="">Choose a session...</option>
                                                {availableExamSessions.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.exam_board})</option>
                                                ))}
                                            </select>
                                            {availableExamSessions.length === 0 && (
                                                <p className="text-[10px] text-indigo-400 mt-1.5">No active exam sessions. Add one from Curriculum → Exams.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Save button */}
                                <button
                                    onClick={handleUpdate}
                                    disabled={saving}
                                    className={`w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                        success
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-[#463a7a] hover:bg-[#342a5b] text-white shadow-md hover:shadow-lg active:scale-[0.98]'
                                    } disabled:opacity-50`}
                                >
                                    {saving ? (
                                        <><Loader2 size={16} className="animate-spin" /> Saving...</>
                                    ) : success ? (
                                        <><CheckCircle2 size={16} /> Saved!</>
                                    ) : (
                                        <><Save size={16} /> Save Parameters</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Quick stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Grade</p>
                                <p className="text-lg font-black text-[#463a7a]">{grade || '—'}</p>
                            </div>
                            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Track</p>
                                <p className="text-lg font-black text-[#463a7a]">{syllabus || '—'}</p>
                            </div>
                            {isExam && (
                                <div className="col-span-2 bg-[#463a7a]/5 rounded-2xl p-4 border border-[#463a7a]/20 text-center">
                                    <p className="text-xs font-bold text-[#463a7a] uppercase tracking-widest mb-1">Exam Track</p>
                                    <p className="text-sm font-black text-[#463a7a]">Active</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Right: Curriculum Tracker ── */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} className="text-[#463a7a]" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Curriculum Tracker</h3>
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Progress</span>
                            </div>
                            <div className="p-4 sm:p-6">
                                <StudentProgressEditor key={progressKey} studentIdFromProps={studentId} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
