import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    Users,
    Plus,
    Trash2,
    Search,
    X,
    Loader2,
    CheckCircle2,
    BookOpen,
    Save,
    UserCircle,
    ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function TeacherAssignmentManager() {
    const [assignments, setAssignments] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        teacher_id: '',
        subject_id: '',
        can_edit_curriculum: true
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [assignRes, teacherRes, subjectRes] = await Promise.all([
                api.get('/admin/teacher-assignments'),
                api.get('/staff'),
                api.get('/admin/subjects')
            ]);
            setAssignments(assignRes.data);
            // Only show staff with Teacher role
            setTeachers(teacherRes.data.filter(s => s.role === 'Teacher'));
            setSubjects(subjectRes.data.filter(s => s.is_active));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.teacher_id || !formData.subject_id) return;

        setSubmitting(true);
        try {
            await api.post('/admin/teacher-assignments', {
                teacher_id: parseInt(formData.teacher_id),
                subject_id: parseInt(formData.subject_id),
                can_edit_curriculum: formData.can_edit_curriculum
            });
            fetchData();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to create assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to remove this assignment?')) return;

        try {
            await api.delete(`/admin/teacher-assignments/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete assignment');
        }
    };

    const resetForm = () => {
        setFormData({ teacher_id: '', subject_id: '', can_edit_curriculum: true });
        setShowForm(false);
    };

    const getTeacherName = (id) => {
        const t = teachers.find(t => t.id === id);
        return t ? t.name : 'Unknown Teacher';
    };

    const getSubjectName = (id) => {
        const s = subjects.find(s => s.id === id);
        return s ? s.name : 'Unknown Subject';
    };

    const filteredAssignments = assignments.filter(a => {
        const tName = getTeacherName(a.teacher_id).toLowerCase();
        const sName = getSubjectName(a.subject_id).toLowerCase();
        const s = search.toLowerCase();
        return tName.includes(s) || sName.includes(s);
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Users className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <button
                            onClick={() => navigate('/admin/curriculum')}
                            className="mb-4 text-white/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            ← Back to Dashboard
                        </button>
                        <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-4">
                            Teacher Assignments
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-lg">
                            Link teachers to the subjects they are qualified to teach
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-4 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Assignment
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#463a7a] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search by teacher or subject..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all shadow-sm"
                />
            </div>

            {/* Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAssignments.map((assignment) => (
                    <div
                        key={assignment.id}
                        className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                <UserCircle className="text-[#463a7a]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    {getTeacherName(assignment.teacher_id)}
                                </h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Teacher</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-4 border-t border-slate-50">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <BookOpen className="text-emerald-600" size={20} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-black text-slate-700">{getSubjectName(assignment.subject_id)}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Subject</p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${assignment.can_edit_curriculum ? 'bg-indigo-50 text-[#463a7a]' : 'bg-slate-50 text-slate-400'}`}>
                                {assignment.can_edit_curriculum ? 'Curriculum Access' : 'Teaching Only'}
                            </div>
                            <button
                                onClick={() => handleDelete(assignment.id)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* Decoration */}
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50/50 rounded-full blur-2xl group-hover:bg-[#463a7a]/5 transition-colors" />
                    </div>
                ))}
            </div>

            {filteredAssignments.length === 0 && (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <Users className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">
                        {search ? 'No assignments found' : 'No teacher assignments yet'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
                        {search ? 'Try a different search term' : 'Assign your first teacher to a subject to get started'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                        >
                            <Plus size={20} className="inline mr-2" />
                            New Assignment
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
                        <div className="p-10 bg-[#463a7a] text-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    New Assignment
                                </h3>
                                <button
                                    onClick={resetForm}
                                    className="p-2 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Select Teacher *
                                    </label>
                                    <select
                                        required
                                        value={formData.teacher_id}
                                        onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                    >
                                        <option value="">Choose a teacher...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex justify-center text-slate-300">
                                    <ArrowRight size={24} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Select Subject *
                                    </label>
                                    <select
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                    >
                                        <option value="">Choose a subject...</option>
                                        {subjects.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-6 bg-slate-50 rounded-[30px] border border-slate-100">
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-[#463a7a] focus:ring-offset-2">
                                    <input
                                        type="checkbox"
                                        id="curriculum_access"
                                        checked={formData.can_edit_curriculum}
                                        onChange={(e) => setFormData({ ...formData, can_edit_curriculum: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-[#463a7a] focus:ring-[#463a7a]"
                                    />
                                    <label htmlFor="curriculum_access" className="ml-3 text-sm font-bold text-slate-700">
                                        Allow teacher to edit curriculum for this subject
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || teachers.length === 0 || subjects.length === 0}
                                    className="flex-1 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Assign Teacher
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
