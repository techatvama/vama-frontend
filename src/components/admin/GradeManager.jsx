import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    Award,
    Plus,
    Edit2,
    Trash2,
    Search,
    X,
    Loader2,
    Save,
    TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function GradeManager() {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingGrade, setEditingGrade] = useState(null);
    const [search, setSearch] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        level: 0,
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/grades');
            setGrades(res.data);
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
            if (editingGrade) {
                await api.put(`/admin/grades/${editingGrade.id}`, formData);
            } else {
                await api.post('/admin/grades', formData);
            }

            fetchGrades();
            resetForm();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.detail || 'Failed to save grade');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (grade) => {
        setEditingGrade(grade);
        setFormData({
            name: grade.name,
            level: grade.level,
            description: grade.description || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this grade?')) return;

        try {
            await api.delete(`/admin/grades/${id}`);
            fetchGrades();
        } catch (err) {
            console.error(err);
            alert('Failed to delete grade');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', level: 0, description: '' });
        setEditingGrade(null);
        setShowForm(false);
    };

    const filteredGrades = grades.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        g.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5">
                    <Award className="w-64 h-64 text-white" />
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
                            Grade Manager
                        </h1>
                        <p className="text-emerald-100/60 font-medium text-lg">
                            Manage grade levels and progression paths
                        </p>
                    </div>

                    <button
                        onClick={() => setShowForm(true)}
                        className="px-8 py-4 bg-white text-emerald-700 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} />
                        Add Grade
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors" size={20} />
                <input
                    type="text"
                    placeholder="Search grades..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all shadow-sm"
                />
            </div>

            {/* Grades List */}
            <div className="space-y-4">
                {filteredGrades.map((grade, index) => (
                    <div
                        key={grade.id}
                        className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-emerald-600 transition-all group"
                    >
                        <div className="flex items-center gap-6">
                            {/* Level Badge */}
                            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                                <span className="text-2xl font-black leading-none">{grade.level}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest opacity-80">Level</span>
                            </div>

                            {/* Grade Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                                        {grade.name}
                                    </h3>
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black uppercase tracking-widest">
                                        #{index + 1}
                                    </div>
                                </div>
                                {grade.description && (
                                    <p className="text-sm text-slate-500 font-medium">
                                        {grade.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 flex-shrink-0">
                                <button
                                    onClick={() => handleEdit(grade)}
                                    className="p-4 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all"
                                    title="Edit"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(grade.id)}
                                    className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all"
                                    title="Delete"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredGrades.length === 0 && (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <Award className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3">
                        {search ? 'No grades found' : 'No grades yet'}
                    </h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
                        {search ? 'Try a different search term' : 'Create your first grade level to get started'}
                    </p>
                    {!search && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-4 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
                        >
                            <Plus size={20} className="inline mr-2" />
                            Add Grade
                        </button>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-10 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-t-[50px]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-black tracking-tighter uppercase">
                                    {editingGrade ? 'Edit Grade' : 'New Grade'}
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
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Grade Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Debut, Grade 1"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                        Level Number *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                                        placeholder="0"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of this grade level..."
                                    rows={4}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600/10 transition-all resize-none"
                                />
                            </div>

                            <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-100">
                                <div className="flex items-start gap-3">
                                    <TrendingUp className="text-emerald-600 flex-shrink-0 mt-1" size={20} />
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 uppercase tracking-wide mb-1">
                                            Tip
                                        </p>
                                        <p className="text-sm text-emerald-700 font-medium">
                                            Level numbers determine the order. Lower numbers appear first (e.g., Debut = 0, Grade 1 = 1).
                                        </p>
                                    </div>
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
                                    disabled={submitting}
                                    className="flex-1 py-4 bg-emerald-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingGrade ? 'Update' : 'Create'} Grade
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
