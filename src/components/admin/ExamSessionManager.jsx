import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    FileText, Plus, Edit2, Trash2, Search, X, Loader2, Save
} from 'lucide-react';
import { useNavigate } from 'react-router';

const EXAM_BOARDS = [
    { value: 'Trinity', label: 'Trinity College London' },
    { value: 'RSL',     label: 'RSL Awards (Rockschool)' },
    { value: 'ABRSM',   label: 'ABRSM' },
    { value: 'Other',   label: 'Other' },
];

const BOARD_COLORS = {
    Trinity: 'bg-blue-50 text-blue-700 border-blue-200',
    RSL:     'bg-orange-50 text-orange-700 border-orange-200',
    ABRSM:   'bg-emerald-50 text-emerald-700 border-emerald-200',
    Other:   'bg-slate-50 text-slate-600 border-slate-200',
};

export default function ExamSessionManager() {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSession, setEditingSession] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({ name: '', exam_board: 'Trinity' });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/exam-sessions');
            setSessions(res.data);
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
            if (editingSession) {
                await api.put(`/admin/exam-sessions/${editingSession.id}`, formData);
            } else {
                await api.post('/admin/exam-sessions', { ...formData, is_active: true });
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
        setFormData({ name: session.name, exam_board: session.exam_board });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this exam session?')) return;
        try {
            await api.delete(`/admin/exam-sessions/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete exam session');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', exam_board: 'Trinity' });
        setEditingSession(null);
        setShowForm(false);
    };

    const filteredSessions = sessions.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.exam_board.toLowerCase().includes(search.toLowerCase())
    );

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

            {/* Sessions Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSessions.map((session) => {
                    const boardColor = BOARD_COLORS[session.exam_board] || BOARD_COLORS.Other;
                    return (
                        <div
                            key={session.id}
                            className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="w-14 h-14 bg-indigo-50 rounded-3xl flex items-center justify-center group-hover:bg-[#463a7a] transition-colors">
                                    <FileText className="text-[#463a7a] group-hover:text-white transition-colors" size={26} />
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${boardColor}`}>
                                    {session.exam_board}
                                </span>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-2 truncate">{session.name}</h3>
                            <p className="text-xs font-bold text-slate-400 mb-6">
                                {session.is_active ? '✅ Open for registration' : '🔒 Closed'}
                            </p>

                            <div className="flex gap-3 pt-6 border-t border-slate-50">
                                <button
                                    onClick={() => handleEdit(session)}
                                    className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(session.id)}
                                    className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={14} /> Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredSessions.length === 0 && (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <FileText className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">No exam sessions yet</h3>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-[#463a7a] text-white rounded-t-[40px] flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tighter uppercase">
                                {editingSession ? 'Edit Session' : 'New Exam Session'}
                            </h3>
                            <button onClick={resetForm} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Session Name *</label>
                                <input
                                    type="text" required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Winter 2025 Trinity"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-semibold focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Exam Board *</label>
                                <select
                                    required
                                    value={formData.exam_board}
                                    onChange={(e) => setFormData({ ...formData, exam_board: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-semibold focus:outline-none focus:border-[#463a7a] focus:ring-2 focus:ring-[#463a7a]/10 transition-all appearance-none"
                                >
                                    {EXAM_BOARDS.map(b => (
                                        <option key={b.value} value={b.value}>{b.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={resetForm}
                                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting}
                                    className="flex-1 py-3 bg-[#463a7a] text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-md hover:bg-[#342a5b] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                                    {submitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    {editingSession ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
