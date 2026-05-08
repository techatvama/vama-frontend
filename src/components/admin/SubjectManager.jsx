import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Loader2,
    CheckCircle2,
    XCircle,
    Save
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function SubjectManager() {
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        is_active: true
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data);
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
            if (editingSubject) {
                await api.put(`/admin/subjects/${editingSubject.id}`, formData);
            } else {
                await api.post('/admin/subjects', formData);
            }

            fetchSubjects();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to save subject');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (subject) => {
        setEditingSubject(subject);
        setFormData({
            name: subject.name,
            description: subject.description || '',
            is_active: subject.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this subject?')) return;

        try {
            await api.delete(`/admin/subjects/${id}`);
            fetchSubjects();
        } catch (err) {
            console.error(err);
            alert('Failed to delete subject');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', is_active: true });
        setEditingSubject(null);
        setShowForm(false);
    };

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase())
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
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <BookOpen className="w-64 h-64 text-white" />
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
                            Subject Manager
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-lg">
                            Manage all subjects taught at your academy
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-4 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Subject
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#463a7a] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search subjects..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all shadow-sm"
                />
            </div>

            {/* Subjects Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubjects.map((subject) => (
                    <div
                        key={subject.id}
                        className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-14 h-14 bg-indigo-100 rounded-3xl flex items-center justify-center group-hover:bg-[#463a7a] transition-colors">
                                <BookOpen className="text-[#463a7a] group-hover:text-white transition-colors" size={28} />
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${subject.is_active
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-red-50 text-red-700'
                                }`}>
                                {subject.is_active ? 'Active' : 'Inactive'}
                            </div>
                        </div>

                        <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-[#463a7a] transition-colors">
                            {subject.name}
                        </h3>

                        {subject.description && (
                            <p className="text-sm text-slate-500 font-medium mb-6 line-clamp-2">
                                {subject.description}
                            </p>
                        )}

                        <div className="flex gap-3 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => handleEdit(subject)}
                                className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Edit2 size={14} />
                                Edit
                            </button>
                            <button
                                onClick={() => handleDelete(subject.id)}
                                className="flex-1 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredSubjects.length === 0 && (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <BookOpen className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">
                        {search ? 'No subjects found' : 'No subjects yet'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
                        {search ? 'Try a different search term' : 'Create your first subject to get started'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                        >
                            <Plus size={20} className="inline mr-2" />
                            Add Subject
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-10 bg-[#463a7a] text-white rounded-t-[50px]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    {editingSubject ? 'Edit Subject' : 'New Subject'}
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
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                    Subject Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Piano, Guitar, Vocals"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the subject..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all resize-none"
                                />
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded border-slate-300 text-[#463a7a] focus:ring-[#463a7a]"
                                />
                                <label htmlFor="is_active" className="text-sm font-bold text-slate-700">
                                    Active (subject is available for assignment)
                                </label>
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
                                    disabled={submitting}
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
                                            {editingSubject ? 'Update' : 'Create'} Subject
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
