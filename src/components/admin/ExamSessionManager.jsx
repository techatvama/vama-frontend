import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    FileText,
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Loader2,
    CheckCircle2,
    Calendar,
    DollarSign,
    Users,
    Save,
    AlertCircle,
    Info
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';

export default function ExamSessionManager() {
    const [sessions, setSessions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        exam_board: 'Trinity',
        grade_id: '',
        subject_id: '',
        exam_date: '',
        registration_deadline: '',
        fee_amount: 0,
        max_students: 20,
        is_active: true,
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sessionRes, subjectRes, gradeRes] = await Promise.all([
                api.get('/admin/exam-sessions'),
                api.get('/admin/subjects'),
                api.get('/admin/grades')
            ]);
            setSessions(sessionRes.data);
            setSubjects(subjectRes.data);
            setGrades(gradeRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const payload = {
                ...formData,
                grade_id: parseInt(formData.grade_id),
                subject_id: parseInt(formData.subject_id),
                fee_amount: parseFloat(formData.fee_amount),
                max_students: parseInt(formData.max_students)
            };

            if (editingSession) {
                await api.put(`/admin/exam-sessions/${editingSession.id}`, payload);
            } else {
                await api.post('/admin/exam-sessions', payload);
            }

            fetchData();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to save exam session');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (session) => {
        setEditingSession(session);
        setFormData({
            name: session.name,
            exam_board: session.exam_board,
            grade_id: session.grade_id,
            subject_id: session.subject_id,
            exam_date: session.exam_date || '',
            registration_deadline: session.registration_deadline || '',
            fee_amount: session.fee_amount,
            max_students: session.max_students,
            is_active: session.is_active,
            notes: session.notes || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this exam session?')) return;

        try {
            await api.delete(`/admin/exam-sessions/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete exam session');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            exam_board: 'Trinity',
            grade_id: '',
            subject_id: '',
            exam_date: '',
            registration_deadline: '',
            fee_amount: 0,
            max_students: 20,
            is_active: true,
            notes: ''
        });
        setEditingSession(null);
        setShowForm(false);
    };

    const filteredSessions = sessions.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.exam_board.toLowerCase().includes(search.toLowerCase())
    );

    const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || 'Unknown';
    const getGradeName = (id) => grades.find(g => g.id === id)?.name || 'Unknown';

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                    <FileText className="w-64 h-64 text-white" />
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
                            Exam Sessions
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-lg">
                            Manage international music exams (Trinity, RSL, ABRSM)
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-4 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        New Session
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#463a7a] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search exam sessions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all shadow-sm"
                />
            </div>

            {/* sessions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => (
                    <div
                        key={session.id}
                        className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group overflow-hidden relative"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center group-hover:bg-[#463a7a] transition-colors">
                                <FileText className="text-orange-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${session.is_active
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                                }`}>
                                {session.is_active ? 'Active' : 'Closed'}
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-2 truncate">
                            {session.name}
                        </h3>
                        <p className="text-xs font-black text-[#463a7a] uppercase tracking-widest mb-6">
                            {session.exam_board} • {getSubjectName(session.subject_id)} • {getGradeName(session.grade_id)}
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                                <Calendar size={16} className="text-slate-300" />
                                <span>Exam: {session.exam_date ? format(new Date(session.exam_date), 'MMM d, yyyy') : 'TBD'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                                <Users size={16} className="text-slate-300" />
                                <span>{session.enrollment_count} / {session.max_students} Enrolled</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-500 font-bold">
                                <DollarSign size={16} className="text-slate-300" />
                                <span>Fee: ₹{session.fee_amount.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => handleEdit(session)}
                                className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-x uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(session.id)}
                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-x uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredSessions.length === 0 && (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <FileText className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">
                        No exam sessions found
                    </h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
                        Create a session to start tracking exam enrollments
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl"
                    >
                        Create Session
                    </button>
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 my-8">
                        <div className="p-10 bg-[#463a7a] text-white rounded-t-[50px]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    {editingSession ? 'Edit Exam' : 'New Exam Session'}
                                </h3>
                                <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-2xl">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Session Name *</label>
                                    <input
                                        type="text" required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Winter 2024 Theory"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Exam Board *</label>
                                    <select
                                        required
                                        value={formData.exam_board}
                                        onChange={(e) => setFormData({ ...formData, exam_board: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium appearance-none"
                                    >
                                        <option value="Trinity">Trinity College London</option>
                                        <option value="RSL">RSL Awards (Rockschool)</option>
                                        <option value="ABRSM">ABRSM</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Subject *</label>
                                    <select
                                        required
                                        value={formData.subject_id}
                                        onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium appearance-none"
                                    >
                                        <option value="">Choose Subject...</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Grade *</label>
                                    <select
                                        required
                                        value={formData.grade_id}
                                        onChange={(e) => setFormData({ ...formData, grade_id: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium appearance-none"
                                    >
                                        <option value="">Choose Grade...</option>
                                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Exam Date</label>
                                    <input
                                        type="date"
                                        value={formData.exam_date}
                                        onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Reg. Deadline</label>
                                    <input
                                        type="date"
                                        value={formData.registration_deadline}
                                        onChange={(e) => setFormData({ ...formData, registration_deadline: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Fee Amount (₹)</label>
                                    <input
                                        type="number" required
                                        value={formData.fee_amount}
                                        onChange={(e) => setFormData({ ...formData, fee_amount: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Max Students</label>
                                    <input
                                        type="number" required
                                        value={formData.max_students}
                                        onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Any additional information..."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <input
                                    type="checkbox" id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-[#463a7a]"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">Open for Registration</label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={resetForm} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-[#463a7a] text-white rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    {editingSession ? 'Update' : 'Create'} Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
