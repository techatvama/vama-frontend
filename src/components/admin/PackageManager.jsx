import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    Package, Plus, Search, X, Loader2, Edit2, Copy, Archive,
    Eye, ToggleLeft, ToggleRight, LayoutGrid, List, Filter,
    Users, DollarSign, Calendar, BookOpen, Star, CheckCircle2,
    ChevronLeft, AlertCircle, Layers, Clock, TrendingUp, Tag
} from 'lucide-react';

const GRADES = ['Debut', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'];
const COURSES = ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums', 'Keyboard', 'Flute', 'Tabla'];
const VALIDITY_OPTIONS = [
    { label: '1 Month', days: 30 },
    { label: '2 Months', days: 60 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 },
    { label: 'Custom', days: 0 },
];

function generateMockPackages() {
    return [
        { id: 1, name: 'Debut Starter', applicable_grades: ['Debut'], applicable_courses: ['Piano', 'Guitar'], validity_days: 30, total_sessions: 8, makeup_sessions: 1, prorate_enabled: false, price: 4500, tax_percentage: 18, is_published: true, is_archived: false, active_students: 12, revenue_generated: 54000, description: 'Perfect for beginners exploring music' },
        { id: 2, name: 'Monthly Pro', applicable_grades: ['Grade 1', 'Grade 2', 'Grade 3'], applicable_courses: ['Piano', 'Guitar', 'Violin'], validity_days: 30, total_sessions: 12, makeup_sessions: 2, prorate_enabled: true, price: 6500, tax_percentage: 18, is_published: true, is_archived: false, active_students: 28, revenue_generated: 182000, description: 'Most popular plan for active learners' },
        { id: 3, name: 'Quarterly Elite', applicable_grades: ['Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'], applicable_courses: ['Piano', 'Violin', 'Vocals'], validity_days: 90, total_sessions: 36, makeup_sessions: 4, prorate_enabled: true, price: 17500, tax_percentage: 18, is_published: true, is_archived: false, active_students: 15, revenue_generated: 262500, description: 'Best value for serious students' },
        { id: 4, name: 'Half-Year Premium', applicable_grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'], applicable_courses: ['Piano', 'Violin', 'Guitar', 'Vocals'], validity_days: 180, total_sessions: 72, makeup_sessions: 6, prorate_enabled: true, price: 32000, tax_percentage: 18, is_published: true, is_archived: false, active_students: 8, revenue_generated: 256000, description: 'Comprehensive plan for dedicated learners' },
        { id: 5, name: 'Annual Gold', applicable_grades: ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'], applicable_courses: ['Piano', 'Violin', 'Guitar', 'Vocals', 'Drums'], validity_days: 365, total_sessions: 144, makeup_sessions: 12, prorate_enabled: true, price: 58000, tax_percentage: 18, is_published: true, is_archived: false, active_students: 5, revenue_generated: 290000, description: 'Full year commitment with maximum benefits' },
        { id: 6, name: 'Exam Prep Pack', applicable_grades: ['Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'], applicable_courses: ['Piano', 'Violin', 'Guitar'], validity_days: 60, total_sessions: 20, makeup_sessions: 3, prorate_enabled: false, price: 12000, tax_percentage: 18, is_published: false, is_archived: false, active_students: 0, revenue_generated: 0, description: 'Intensive exam preparation sessions' },
        { id: 7, name: 'Beginner Trial', applicable_grades: ['Debut'], applicable_courses: ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums', 'Keyboard', 'Flute', 'Tabla'], validity_days: 14, total_sessions: 4, makeup_sessions: 0, prorate_enabled: false, price: 1500, tax_percentage: 0, is_published: true, is_archived: false, active_students: 6, revenue_generated: 9000, description: 'Trial pack for new students' },
        { id: 8, name: 'Advanced Master', applicable_grades: ['Grade 7', 'Grade 8'], applicable_courses: ['Piano', 'Violin'], validity_days: 90, total_sessions: 40, makeup_sessions: 6, prorate_enabled: true, price: 28000, tax_percentage: 18, is_published: false, is_archived: true, active_students: 0, revenue_generated: 84000, description: 'Masterclass level for advanced students' },
    ];
}

const EMPTY_FORM = {
    name: '', applicable_grades: [], applicable_courses: [], validity_days: 30,
    total_sessions: 8, makeup_sessions: 0, prorate_enabled: false,
    price: '', tax_percentage: 18, is_published: false, description: '',
    customValidity: '',
};

function GradeChip({ label, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all border ${selected ? 'bg-[#463a7a] text-white border-[#463a7a] shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-[#463a7a]/40 hover:bg-violet-50'}`}
        >
            {label}
        </button>
    );
}

function PackageCard({ pkg, onEdit, onDuplicate, onArchive, onTogglePublish }) {
    const tax = pkg.price * (pkg.tax_percentage / 100);
    const total = pkg.price + tax;
    const statusColor = pkg.is_archived ? 'bg-slate-100 text-slate-500' : pkg.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100';
    const statusLabel = pkg.is_archived ? 'Archived' : pkg.is_published ? 'Published' : 'Draft';

    return (
        <div className={`bg-white rounded-[32px] border shadow-lg hover:shadow-xl transition-all group overflow-hidden flex flex-col ${pkg.is_archived ? 'opacity-60 border-slate-100' : 'border-slate-100 hover:border-[#463a7a]/20'}`}>
            {/* Card header */}
            <div className="relative bg-gradient-to-br from-[#463a7a]/5 to-[#463a7a]/10 p-6 pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>{statusLabel}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 leading-tight truncate">{pkg.name}</h3>
                        {pkg.description && <p className="text-xs font-medium text-slate-400 mt-1 line-clamp-1">{pkg.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-black text-[#463a7a] leading-none">₹{pkg.price.toLocaleString('en-IN')}</p>
                        {pkg.tax_percentage > 0 && <p className="text-[10px] font-bold text-slate-400 mt-0.5">+{pkg.tax_percentage}% GST</p>}
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="p-6 pt-4 flex-1 space-y-4">
                {/* Grades */}
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Applicable Grades</p>
                    <div className="flex flex-wrap gap-1.5">
                        {(pkg.applicable_grades || []).slice(0, 4).map(g => (
                            <span key={g} className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-xl text-[10px] font-black">{g}</span>
                        ))}
                        {(pkg.applicable_grades || []).length > 4 && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black">+{pkg.applicable_grades.length - 4} more</span>
                        )}
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-base font-black text-slate-900">{pkg.total_sessions}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Sessions</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-base font-black text-slate-900">{Math.floor(pkg.validity_days / 30)}m</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Duration</p>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3 text-center">
                        <p className="text-base font-black text-slate-900">{pkg.active_students}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-0.5">Active</p>
                    </div>
                </div>

                {/* Revenue */}
                {pkg.revenue_generated > 0 && (
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400">Revenue Generated</span>
                        <span className="text-sm font-black text-emerald-600">₹{pkg.revenue_generated.toLocaleString('en-IN')}</span>
                    </div>
                )}

                {/* Makeup & prorate */}
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    {pkg.makeup_sessions > 0 && <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-xl">{pkg.makeup_sessions} makeup</span>}
                    {pkg.prorate_enabled && <span className="px-2 py-1 bg-teal-50 text-teal-600 rounded-xl">Prorate enabled</span>}
                </div>
            </div>

            {/* Actions */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-50 flex items-center gap-2">
                <button onClick={() => onEdit(pkg)} className="flex-1 py-2.5 bg-slate-100 hover:bg-[#463a7a] hover:text-white text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5">
                    <Edit2 size={12} /> Edit
                </button>
                <button onClick={() => onDuplicate(pkg)} className="p-2.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-500 rounded-2xl transition-all" title="Duplicate">
                    <Copy size={14} />
                </button>
                <button onClick={() => onTogglePublish(pkg)} className={`p-2.5 rounded-2xl transition-all ${pkg.is_published ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`} title={pkg.is_published ? 'Unpublish' : 'Publish'}>
                    {pkg.is_published ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                </button>
                <button onClick={() => onArchive(pkg)} className="p-2.5 bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-2xl transition-all" title={pkg.is_archived ? 'Unarchive' : 'Archive'}>
                    <Archive size={14} />
                </button>
            </div>
        </div>
    );
}

export default function PackageManager() {
    const navigate = useNavigate();
    const [packages, setPackages] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('grid');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [customValidity, setCustomValidity] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => { loadPackages(); }, []);
    useEffect(() => { applyFilters(); }, [packages, search, filterStatus, showArchived]);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/packages');
            setPackages(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Failed to load packages:', err);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let list = packages.filter(p => showArchived ? true : !p.is_archived);
        if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));
        if (filterStatus === 'published') list = list.filter(p => p.is_published && !p.is_archived);
        if (filterStatus === 'draft') list = list.filter(p => !p.is_published && !p.is_archived);
        setFiltered(list);
    };

    const openCreate = () => {
        setEditingPkg(null);
        setFormData(EMPTY_FORM);
        setCustomValidity(false);
        setFormError('');
        setShowForm(true);
    };

    const openEdit = (pkg) => {
        setEditingPkg(pkg);
        setFormError('');
        setFormData({
            name: pkg.name, applicable_grades: pkg.applicable_grades || [],
            applicable_courses: pkg.applicable_courses || [],
            validity_days: pkg.validity_days, total_sessions: pkg.total_sessions,
            makeup_sessions: pkg.makeup_sessions, prorate_enabled: pkg.prorate_enabled,
            price: pkg.price, tax_percentage: pkg.tax_percentage,
            is_published: pkg.is_published, description: pkg.description || '',
            customValidity: '',
        });
        setCustomValidity(!VALIDITY_OPTIONS.slice(0, -1).some(o => o.days === pkg.validity_days));
        setShowForm(true);
    };

    const handleDuplicate = (pkg) => {
        const dup = { ...pkg, id: Date.now(), name: `${pkg.name} (Copy)`, is_published: false, active_students: 0, revenue_generated: 0 };
        setPackages(prev => [dup, ...prev]);
    };

    const handleArchive = (pkg) => {
        setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, is_archived: !p.is_archived } : p));
    };

    const handleTogglePublish = (pkg) => {
        setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, is_published: !p.is_published } : p));
    };

    const toggleGrade = (g) => {
        setFormData(f => ({
            ...f,
            applicable_grades: f.applicable_grades.includes(g)
                ? f.applicable_grades.filter(x => x !== g)
                : [...f.applicable_grades, g]
        }));
    };

    const toggleCourse = (c) => {
        setFormData(f => ({
            ...f,
            applicable_courses: f.applicable_courses.includes(c)
                ? f.applicable_courses.filter(x => x !== c)
                : [...f.applicable_courses, c]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError('');
        const payload = { ...formData, validity_days: customValidity ? parseInt(formData.customValidity) : formData.validity_days };
        try {
            if (editingPkg) {
                await api.put(`/admin/packages/${editingPkg.id}`, payload);
            } else {
                await api.post('/admin/packages', payload);
            }
            await loadPackages();
            setShowForm(false);
        } catch (err) {
            setFormError(err?.response?.data?.detail || 'Failed to save package. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const totalRevenue = filtered.reduce((s, p) => s + (p.revenue_generated || 0), 0);
    const totalStudents = filtered.reduce((s, p) => s + (p.active_students || 0), 0);
    const publishedCount = filtered.filter(p => p.is_published).length;

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <div className="w-10 h-10 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12 lg:pt-10 overflow-hidden">
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative z-10 max-w-[1600px] mx-auto">
                    <button onClick={() => navigate('/admin/payments')} className="mb-4 text-white/50 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                        ← Payment Hub
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-2">Package Manager</h1>
                            <p className="text-white/50 text-sm font-medium">Create grade-restricted fee packages with session tracking</p>
                        </div>
                        <button onClick={openCreate} className="px-6 py-3.5 bg-white text-[#463a7a] rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all flex items-center gap-2 self-start lg:self-auto">
                            <Plus size={18} /> New Package
                        </button>
                    </div>

                    {/* Summary pills */}
                    <div className="flex items-center gap-3 mt-6 flex-wrap">
                        {[
                            { label: 'Total Packages', val: filtered.length, color: 'bg-white/10' },
                            { label: 'Published', val: publishedCount, color: 'bg-emerald-500/20' },
                            { label: 'Active Students', val: totalStudents, color: 'bg-blue-500/20' },
                            { label: 'Revenue', val: `₹${(totalRevenue / 100000).toFixed(1)}L`, color: 'bg-amber-500/20' },
                        ].map((item, i) => (
                            <div key={i} className={`${item.color} rounded-2xl px-4 py-2 text-white`}>
                                <span className="text-xs font-black uppercase tracking-widest opacity-70">{item.label}: </span>
                                <span className="text-sm font-black">{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 lg:px-12 py-8 space-y-6 pb-24">
                {/* Filters */}
                <div className="bg-white rounded-[32px] p-5 shadow-xl border border-slate-100 flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full sm:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text" placeholder="Search packages..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 pl-11 pr-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        {['all', 'published', 'draft'].map(s => (
                            <button key={s} onClick={() => setFilterStatus(s)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filterStatus === s ? 'bg-[#463a7a] text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                {s}
                            </button>
                        ))}
                        <button onClick={() => setShowArchived(v => !v)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${showArchived ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                            {showArchived ? 'Hide' : 'Show'} Archived
                        </button>
                        <div className="flex items-center rounded-2xl overflow-hidden border border-slate-200">
                            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                                <LayoutGrid size={16} />
                            </button>
                            <button onClick={() => setViewMode('list')} className={`p-2.5 transition-all ${viewMode === 'list' ? 'bg-[#463a7a] text-white' : 'bg-white text-slate-400 hover:bg-slate-50'}`}>
                                <List size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Package grid / list */}
                {filtered.length === 0 ? (
                    <div className="text-center py-24">
                        <Package size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-xl font-black text-slate-300">No packages found</p>
                        <button onClick={openCreate} className="mt-6 px-6 py-3 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest">Create First Package</button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filtered.map(pkg => (
                            <PackageCard key={pkg.id} pkg={pkg} onEdit={openEdit} onDuplicate={handleDuplicate} onArchive={handleArchive} onTogglePublish={handleTogglePublish} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50">
                                    {['Package', 'Grades', 'Sessions', 'Price', 'Students', 'Revenue', 'Status', 'Actions'].map(h => (
                                        <th key={h} className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((pkg, i) => (
                                    <tr key={pkg.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-black text-slate-900">{pkg.name}</p>
                                            <p className="text-xs text-slate-400">{pkg.validity_days}d validity</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {(pkg.applicable_grades || []).slice(0, 2).map(g => <span key={g} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-lg text-[10px] font-black">{g}</span>)}
                                                {(pkg.applicable_grades || []).length > 2 && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black">+{pkg.applicable_grades.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-sm font-black text-slate-900">{pkg.total_sessions}</span></td>
                                        <td className="px-6 py-4"><span className="text-sm font-black text-[#463a7a]">₹{pkg.price.toLocaleString('en-IN')}</span></td>
                                        <td className="px-6 py-4"><span className="text-sm font-bold text-slate-700">{pkg.active_students}</span></td>
                                        <td className="px-6 py-4"><span className="text-sm font-black text-emerald-600">₹{(pkg.revenue_generated || 0).toLocaleString('en-IN')}</span></td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${pkg.is_archived ? 'bg-slate-100 text-slate-500 border-slate-200' : pkg.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {pkg.is_archived ? 'Archived' : pkg.is_published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(pkg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#463a7a] transition-all"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDuplicate(pkg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-500 transition-all"><Copy size={14} /></button>
                                                <button onClick={() => handleTogglePublish(pkg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-emerald-500 transition-all">{pkg.is_published ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}</button>
                                                <button onClick={() => handleArchive(pkg)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-red-500 transition-all"><Archive size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Modal ──────────────────────────────────── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl my-4">
                        {/* Modal header */}
                        <div className="p-8 bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-t-[40px]">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-1">{editingPkg ? 'Edit Package' : 'New Package'}</p>
                                    <h3 className="text-2xl font-black text-white tracking-tight">{editingPkg ? editingPkg.name : 'Create Package'}</h3>
                                </div>
                                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-white/10 rounded-2xl transition-all text-white"><X size={22} /></button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Package Name */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Package Name *</label>
                                <input required type="text" value={formData.name} onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Monthly Pro, Quarterly Elite..."
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 transition-all" />
                            </div>

                            {/* Applicable Grades */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Applicable Grades</label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setFormData(f => ({ ...f, applicable_grades: f.applicable_grades.length === GRADES.length ? [] : [...GRADES] }))}
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all border ${formData.applicable_grades.length === GRADES.length ? 'bg-[#463a7a] text-white border-[#463a7a]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>All Grades</button>
                                    {GRADES.map(g => <GradeChip key={g} label={g} selected={formData.applicable_grades.includes(g)} onClick={() => toggleGrade(g)} />)}
                                </div>
                            </div>

                            {/* Applicable Courses */}
                            <div className="space-y-3">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Applicable Courses</label>
                                <div className="flex flex-wrap gap-2">
                                    <button type="button" onClick={() => setFormData(f => ({ ...f, applicable_courses: f.applicable_courses.length === COURSES.length ? [] : [...COURSES] }))}
                                        className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all border ${formData.applicable_courses.length === COURSES.length ? 'bg-[#463a7a] text-white border-[#463a7a]' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>All Courses</button>
                                    {COURSES.map(c => <GradeChip key={c} label={c} selected={formData.applicable_courses.includes(c)} onClick={() => toggleCourse(c)} />)}
                                </div>
                            </div>

                            {/* Validity & Sessions */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Validity</label>
                                    <select value={customValidity ? 0 : formData.validity_days}
                                        onChange={e => {
                                            const v = parseInt(e.target.value);
                                            if (v === 0) { setCustomValidity(true); }
                                            else { setCustomValidity(false); setFormData(f => ({ ...f, validity_days: v })); }
                                        }}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 appearance-none">
                                        {VALIDITY_OPTIONS.map(o => <option key={o.days} value={o.days}>{o.label}</option>)}
                                    </select>
                                    {customValidity && (
                                        <input type="number" min="1" placeholder="Days" value={formData.customValidity}
                                            onChange={e => setFormData(f => ({ ...f, customValidity: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sessions *</label>
                                    <input required type="number" min="1" value={formData.total_sessions} onChange={e => setFormData(f => ({ ...f, total_sessions: parseInt(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                            </div>

                            {/* Makeup & Prorate */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Makeup Sessions</label>
                                    <input type="number" min="0" value={formData.makeup_sessions} onChange={e => setFormData(f => ({ ...f, makeup_sessions: parseInt(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Prorate Option</label>
                                    <button type="button" onClick={() => setFormData(f => ({ ...f, prorate_enabled: !f.prorate_enabled }))}
                                        className={`w-full p-4 rounded-3xl text-sm font-black uppercase tracking-widest border transition-all flex items-center gap-2 ${formData.prorate_enabled ? 'bg-[#463a7a] text-white border-[#463a7a]' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                        {formData.prorate_enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                        {formData.prorate_enabled ? 'Enabled' : 'Disabled'}
                                    </button>
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Price (₹) *</label>
                                    <input required type="number" min="0" step="0.01" value={formData.price} onChange={e => setFormData(f => ({ ...f, price: parseFloat(e.target.value) }))}
                                        placeholder="0.00"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tax %</label>
                                    <input type="number" min="0" max="100" step="0.01" value={formData.tax_percentage} onChange={e => setFormData(f => ({ ...f, tax_percentage: parseFloat(e.target.value) }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10" />
                                </div>
                            </div>

                            {/* Live Pricing Preview */}
                            {formData.price > 0 && (
                                <div className="bg-gradient-to-br from-[#463a7a]/5 to-[#463a7a]/10 rounded-3xl p-5 border border-[#463a7a]/10">
                                    <p className="text-xs font-black text-[#463a7a] uppercase tracking-widest mb-3">Live Pricing Preview</p>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400">Base Price</p>
                                            <p className="text-lg font-black text-slate-900">₹{parseFloat(formData.price || 0).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400">Tax ({formData.tax_percentage}%)</p>
                                            <p className="text-lg font-black text-amber-600">₹{(parseFloat(formData.price || 0) * formData.tax_percentage / 100).toLocaleString('en-IN')}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400">Total</p>
                                            <p className="text-lg font-black text-[#463a7a]">₹{(parseFloat(formData.price || 0) * (1 + formData.tax_percentage / 100)).toLocaleString('en-IN')}</p>
                                        </div>
                                    </div>
                                    {formData.total_sessions > 0 && (
                                        <p className="text-xs font-bold text-slate-400 mt-3">
                                            ₹{Math.round(parseFloat(formData.price || 0) / formData.total_sessions).toLocaleString('en-IN')} per session
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Description</label>
                                <textarea value={formData.description} onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                                    placeholder="Brief description of this package..." rows={2}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-900 font-medium placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/10 resize-none" />
                            </div>

                            {/* Publish toggle */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-3xl">
                                <div>
                                    <p className="text-sm font-black text-slate-900">Publish Online</p>
                                    <p className="text-xs font-medium text-slate-400">Students can see and enroll in this package</p>
                                </div>
                                <button type="button" onClick={() => setFormData(f => ({ ...f, is_published: !f.is_published }))}
                                    className={`w-12 h-6 rounded-full transition-all relative ${formData.is_published ? 'bg-[#463a7a]' : 'bg-slate-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.is_published ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            {formError && (
                                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl p-4">
                                    <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-600">{formError}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-2">
                                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                                <button type="submit" disabled={submitting} className="flex-1 py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                                    {editingPkg ? 'Save Changes' : 'Create Package'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FAB */}
            <div className="fixed bottom-6 right-6 z-50">
                <button onClick={openCreate} className="w-14 h-14 bg-gradient-to-br from-[#463a7a] to-[#2d2550] text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                    <Plus size={24} />
                </button>
            </div>
        </div>
    );
}
