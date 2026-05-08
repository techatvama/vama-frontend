import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    ArrowLeft,
    Award,
    BookOpen,
    TrendingUp,
    User,
    Mail,
    Phone,
    Calendar,
    Save,
    Loader2,
    CheckCircle2,
    Zap,
    Music,
    ChevronRight,
    Search,
    MapPin,
    Target
} from 'lucide-react';
import StudentProgressEditor from '../StudentProgressEditor';

export default function TeacherStudentDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    // Editable Fields
    const [grade, setGrade] = useState('');
    const [syllabus, setSyllabus] = useState('');
    const [isExam, setIsExam] = useState(false);
    const [examDate, setExamDate] = useState('');
    const [selectedExamSession, setSelectedExamSession] = useState('');
    const [availableExamSessions, setAvailableExamSessions] = useState([]);

    const [availableGrades, setAvailableGrades] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);

    useEffect(() => {
        fetchStudentDetails();
        fetchMetadata();
    }, [studentId]);

    const fetchMetadata = async () => {
        try {
            const [gradeRes, subjectRes, examRes] = await Promise.all([
                api.get('/admin/grades'),
                api.get('/admin/subjects'),
                api.get('/admin/exam-sessions')
            ]);
            setAvailableGrades(gradeRes.data);
            setAvailableSubjects(subjectRes.data.filter(s => s.is_active));
            setAvailableExamSessions(examRes.data.filter(e => e.is_active));
        } catch (err) {
            console.error(err);
        }
    };

    const fetchStudentDetails = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/students/${studentId}/progress`);
            const data = response.data.student;
            setStudent(data);
            setGrade(data.current_grade || 'Debut');
            setSyllabus(data.syllabus_type || 'Trinity');
            setIsExam(data.is_exam_student || false);
            setExamDate(data.exam_date || '');
            // Simple logic: if student has an exam date, try to find a session or just show date
            // For now, we'll let teacher assign a session explicitly
        } catch (error) {
            console.error("Failed to fetch student details", error);
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
                exam_date: examDate || null,
                exam_session_id: selectedExamSession ? parseInt(selectedExamSession) : null
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };



    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 relative pb-20">
            {/* Header Banner */}
            <div className="bg-[#463a7a] lg:rounded-b-[60px] p-8 lg:p-12 pb-32">
                <div className="max-w-7xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-2xl text-white mb-8 hover:bg-white/20 transition-all border border-white/5 shadow-inner"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>

                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-900/20">
                                    ACTIVE ARTIST
                                </div>
                                <span className="text-indigo-200/60 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                                    <Target size={14} />
                                    {student.desired_course}
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85]">
                                {student.first_name}<br />
                                <span className="text-indigo-300">{student.last_name}</span>
                            </h1>
                        </div>

                        <div className="flex items-center gap-6 bg-white/5 p-6 rounded-[40px] border border-white/5 backdrop-blur-xl">
                            <div className="w-20 h-20 bg-white rounded-[28px] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                                <span className="text-3xl font-black text-[#463a7a] z-10">{student.first_name[0]}</span>
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div>
                                <p className="text-indigo-100/40 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Student ID</p>
                                <p className="text-2xl font-black text-white tracking-tighter">#ST-{student.id.toString().padStart(4, '0')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 -mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Control Panel */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-900/10 border border-slate-100 p-8 lg:p-10">
                            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Zap className="text-yellow-400 fill-current" />
                                STUDENT PARAMETERS
                            </h3>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Performance Grade</label>
                                    <div className="relative">
                                        <select
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full pl-5 pr-10 py-5 bg-slate-50 border-2 border-slate-50 rounded-[28px] focus:outline-none focus:border-[#463a7a] transition-all font-black text-slate-700 appearance-none shadow-inner"
                                        >
                                            <option value="">Select Grade...</option>
                                            {availableGrades.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                        </select>
                                        <Award className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Syllabus Track</label>
                                    <div className="relative">
                                        <select
                                            value={syllabus}
                                            onChange={(e) => setSyllabus(e.target.value)}
                                            className="w-full pl-5 pr-10 py-5 bg-slate-50 border-2 border-slate-50 rounded-[28px] focus:outline-none focus:border-[#463a7a] transition-all font-black text-slate-700 appearance-none shadow-inner"
                                        >
                                            <option value="Trinity">Trinity</option>
                                            <option value="RSL">RSL</option>
                                            <option value="ABRSM">ABRSM</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        <BookOpen className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 pointer-events-none" />
                                    </div>
                                </div>

                                <div className={`p-6 rounded-[32px] border-2 transition-all cursor-pointer ${isExam ? 'bg-indigo-50 border-[#463a7a]/20' : 'bg-slate-50 border-slate-50'}`}
                                    onClick={() => setIsExam(!isExam)}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isExam ? 'bg-[#463a7a] text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-300'}`}>
                                                <Award size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 leading-none">Exam Track</p>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Awaiting certification?</p>
                                            </div>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isExam ? 'bg-[#463a7a] border-[#463a7a]' : 'border-slate-200 bg-white'}`}>
                                            {isExam && <CheckCircle2 size={12} className="text-white" />}
                                        </div>
                                    </div>

                                    {isExam && (
                                        <div className="mt-6 pt-6 border-t border-indigo-100 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-300">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#463a7a] uppercase tracking-widest leading-none">Select Exam Session</label>
                                                <select
                                                    value={selectedExamSession}
                                                    onChange={(e) => setSelectedExamSession(e.target.value)}
                                                    className="w-full pl-5 pr-10 py-4 bg-white border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-[#463a7a] transition-all font-bold text-slate-700 shadow-sm appearance-none"
                                                >
                                                    <option value="">Choose a session...</option>
                                                    {availableExamSessions.map(e => (
                                                        <option key={e.id} value={e.id}>{e.name} ({e.exam_board})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-[#463a7a] uppercase tracking-widest leading-none">Custom Target Date (Optional)</label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        value={examDate}
                                                        onChange={(e) => setExamDate(e.target.value)}
                                                        className="w-full pl-5 pr-10 py-4 bg-white border-2 border-indigo-100 rounded-2xl focus:outline-none focus:border-[#463a7a] transition-all font-bold text-slate-700 shadow-sm"
                                                    />
                                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#463a7a]/40 pointer-events-none" />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleUpdate}
                                    disabled={saving}
                                    className="w-full py-6 bg-[#463a7a] text-white rounded-[32px] font-black shadow-2xl shadow-indigo-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : success ? <CheckCircle2 /> : <Save />}
                                    {saving ? 'UPDATING...' : success ? 'PROFILE UPDATED!' : 'SAVE PARAMETERS'}
                                </button>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-[#463a7a] rounded-[40px] p-8 text-white relative overflow-hidden group shadow-2xl">
                            <h3 className="text-lg font-black mb-6 tracking-tighter opacity-60">CONTACT DATA</h3>
                            <div className="space-y-6 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                                        <Mail className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <p className="text-sm font-bold opacity-80 truncate">{student.email}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                                        <Phone className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <p className="text-sm font-bold opacity-80">{student.primary_phone_number}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/5">
                                        <MapPin className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <p className="text-sm font-bold opacity-80 italic">{student.nearest_vama_center || 'Online / Remote'}</p>
                                </div>
                            </div>
                            <Music className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    </div>

                    {/* Progress Tracker */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[50px] shadow-2xl shadow-indigo-900/10 border border-slate-100 overflow-hidden flex flex-col h-full min-h-[800px]">
                            <div className="p-8 lg:p-12 border-b border-slate-50 flex items-baseline justify-between">
                                <h3 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
                                    <TrendingUp className="w-8 h-8 text-[#463a7a]" />
                                    CURRICULUM TRACKER
                                </h3>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Live Progress</p>
                            </div>
                            <div className="flex-1 p-4 lg:p-8">
                                <StudentProgressEditor studentIdFromProps={studentId} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
