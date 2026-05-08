import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    BookOpen,
    Plus,
    Edit2,
    Trash2,
    Settings,
    ChevronDown,
    ChevronUp,
    GripVertical,
    Save,
    X,
    Loader2,
    CheckCircle2,
    Music,
    Layers,
    FileText,
    Target,
    Zap
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function SyllabusBuilder() {
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedGrade, setSelectedGrade] = useState('');
    const [currentSyllabus, setCurrentSyllabus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingSyllabus, setFetchingSyllabus] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});

    const [showModuleForm, setShowModuleForm] = useState(false);
    const [editingModule, setEditingModule] = useState(null);
    const [moduleFormData, setModuleFormData] = useState({ name: '', weight: 0 });

    const [showContentForm, setShowContentForm] = useState(false);
    const [editingContent, setEditingContent] = useState(null);
    const [activeModuleId, setActiveModuleId] = useState(null);
    const [contentFormData, setContentFormData] = useState({ name: '', content_type: 'song', weight: 1 });

    const navigate = useNavigate();

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        if (selectedSubject && selectedGrade) {
            fetchSyllabus();
        } else {
            setCurrentSyllabus(null);
        }
    }, [selectedSubject, selectedGrade]);

    const fetchMetadata = async () => {
        setLoading(true);
        try {
            const [sbjRes, grdRes] = await Promise.all([
                api.get('/admin/subjects'),
                api.get('/admin/grades')
            ]);
            setSubjects(sbjRes.data.filter(s => s.is_active));
            setGrades(grdRes.data.sort((a, b) => a.level - b.level));

            if (sbjRes.data.length > 0) setSelectedSubject(sbjRes.data[0].id);
            if (grdRes.data.length > 0) setSelectedGrade(grdRes.data[0].id);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSyllabus = async () => {
        setFetchingSyllabus(true);
        try {
            const res = await api.get('/admin/syllabi', {
                params: { subject_id: selectedSubject, grade_id: selectedGrade }
            });
            if (res.data.length > 0) {
                // Get full details with modules/contents
                const detailRes = await api.get(`/admin/syllabi/${res.data[0].id}`);
                setCurrentSyllabus(detailRes.data);
            } else {
                setCurrentSyllabus(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setFetchingSyllabus(false);
        }
    };

    const handleCreateSyllabus = async () => {
        try {
            const subjectName = subjects.find(s => s.id === parseInt(selectedSubject))?.name;
            const gradeName = grades.find(g => g.id === parseInt(selectedGrade))?.name;

            const res = await api.post('/admin/syllabi', {
                name: `${subjectName} - ${gradeName} Syllabus`,
                subject_id: parseInt(selectedSubject),
                grade_id: parseInt(selectedGrade)
            });
            setCurrentSyllabus({ ...res.data, modules: [] });
        } catch (err) {
            alert("Failed to create syllabus");
        }
    };

    const handleSaveModule = async (e) => {
        e.preventDefault();
        try {
            if (editingModule) {
                await api.put(`/admin/modules/${editingModule.id}`, moduleFormData);
            } else {
                await api.post('/admin/modules', {
                    ...moduleFormData,
                    syllabus_id: currentSyllabus.id
                });
            }
            fetchSyllabus();
            setShowModuleForm(false);
            setEditingModule(null);
            setModuleFormData({ name: '', weight: 0 });
        } catch (err) {
            alert("Failed to save module");
        }
    };

    const handleDeleteModule = async (id) => {
        if (!confirm("Delete module and all its content?")) return;
        try {
            await api.delete(`/admin/modules/${id}`);
            fetchSyllabus();
        } catch (err) {
            alert("Failed to delete module");
        }
    };

    const handleSaveContent = async (e) => {
        e.preventDefault();
        try {
            if (editingContent) {
                await api.put(`/admin/contents/${editingContent.id}`, contentFormData);
            } else {
                await api.post('/admin/contents', {
                    ...contentFormData,
                    module_id: activeModuleId
                });
            }
            fetchSyllabus();
            setShowContentForm(false);
            setEditingContent(null);
            setContentFormData({ name: '', content_type: 'song', weight: 1 });
        } catch (err) {
            alert("Failed to save content");
        }
    };

    const handleDeleteContent = async (id) => {
        if (!confirm("Delete this content item?")) return;
        try {
            await api.delete(`/admin/contents/${id}`);
            fetchSyllabus();
        } catch (err) {
            alert("Failed to delete content");
        }
    };

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-8 pb-32">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-12 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-150">
                    <Target className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10">
                    <button
                        onClick={() => navigate('/admin/curriculum')}
                        className="mb-4 text-white/60 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                    <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter leading-none mb-4 uppercase">
                        Syllabus Builder
                    </h1>
                    <p className="text-indigo-100/60 font-medium text-lg max-w-2xl">
                        Define modules and content items for each instrument and grade level
                    </p>
                </div>
            </div>

            {/* Selectors */}
            <div className="grid md:grid-cols-2 gap-6 bg-white p-8 rounded-[40px] shadow-xl border border-slate-100">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Subject</label>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black appearance-none"
                    >
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Grade Level</label>
                    <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black appearance-none"
                    >
                        {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Builder Area */}
            {fetchingSyllabus ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="w-12 h-12 text-[#463a7a] animate-spin" />
                </div>
            ) : currentSyllabus ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3">
                            <Layers className="text-[#463a7a]" />
                            Modules
                        </h2>
                        <button
                            onClick={() => {
                                setEditingModule(null);
                                setModuleFormData({ name: '', weight: 0 });
                                setShowModuleForm(true);
                            }}
                            className="bg-[#463a7a] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <Plus size={16} /> Add Module
                        </button>
                    </div>

                    <div className="space-y-4">
                        {currentSyllabus.modules.sort((a, b) => a.order - b.order).map((module, idx) => (
                            <div key={module.id} className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden group">
                                <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => toggleModule(module.id)}>
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#463a7a] font-black group-hover:bg-[#463a7a] group-hover:text-white transition-all shadow-sm">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Module {idx + 1}</p>
                                            <h3 className="text-xl font-black text-slate-900">{module.name}</h3>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="hidden md:flex flex-col items-end mr-6">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weight</p>
                                            <p className="text-lg font-black text-slate-900">{module.weight}%</p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingModule(module);
                                                setModuleFormData({ name: module.name, weight: module.weight });
                                                setShowModuleForm(true);
                                            }}
                                            className="p-3 text-slate-400 hover:text-[#463a7a] hover:bg-indigo-50 rounded-xl transition-all"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteModule(module.id);
                                            }}
                                            className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                        <div className="ml-2 text-slate-300">
                                            {expandedModules[module.id] ? <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </div>
                                </div>

                                {expandedModules[module.id] && (
                                    <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                                        <div className="flex items-center justify-between mb-6">
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contents</h4>
                                            <button
                                                onClick={() => {
                                                    setActiveModuleId(module.id);
                                                    setEditingContent(null);
                                                    setContentFormData({ name: '', content_type: 'song', weight: 1 });
                                                    setShowContentForm(true);
                                                }}
                                                className="text-[#463a7a] text-[10px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
                                            >
                                                <Plus size={12} /> Add Item
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {module.contents.map((item) => (
                                                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-2 rounded-lg ${item.content_type === 'song' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'}`}>
                                                            {item.content_type === 'song' ? <Music size={16} /> : <BookOpen size={16} />}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-700">{item.name}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.content_type}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setEditingContent(item);
                                                                setContentFormData({ name: item.name, content_type: item.content_type, weight: item.weight });
                                                                setActiveModuleId(module.id);
                                                                setShowContentForm(true);
                                                            }}
                                                            className="p-2 text-slate-300 hover:text-[#463a7a] transition-colors"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteContent(item.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {module.contents.length === 0 && (
                                                <p className="text-center py-6 text-slate-300 text-xs font-bold uppercase tracking-widest">No content items yet</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                    <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                        <BookOpen className="text-slate-300" size={48} />
                    </div>
                    <h3 className="text-3xl font-black text-slate-300 tracking-tighter mb-3 uppercase">No Syllabus Yet</h3>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-8">
                        Design the curriculum for this combination of instrument and grade
                    </p>
                    <button
                        onClick={handleCreateSyllabus}
                        className="px-10 py-5 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-3 mx-auto"
                    >
                        <Plus size={20} /> Create Syllabus
                    </button>
                </div>
            )}

            {/* Module Form Modal */}
            {showModuleForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-[#463a7a] text-white rounded-t-[50px] flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">{editingModule ? 'Edit Module' : 'New Module'}</h3>
                            <button onClick={() => setShowModuleForm(false)} className="hover:bg-white/10 p-2 rounded-xl"><X /></button>
                        </div>
                        <form onSubmit={handleSaveModule} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Module Name</label>
                                <input
                                    type="text" required
                                    value={moduleFormData.name}
                                    onChange={(e) => setModuleFormData({ ...moduleFormData, name: e.target.value })}
                                    placeholder="e.g., Songs & Pieces"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Weight Percentage (%)</label>
                                <input
                                    type="number" required
                                    value={moduleFormData.weight}
                                    onChange={(e) => setModuleFormData({ ...moduleFormData, weight: parseInt(e.target.value) })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#463a7a] text-white rounded-2xl font-black uppercase shadow-xl">
                                {editingModule ? 'Update Module' : 'Add Module'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Content Form Modal */}
            {showContentForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                    <div className="bg-white rounded-[50px] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8 bg-indigo-600 text-white rounded-t-[50px] flex justify-between items-center">
                            <h3 className="text-2xl font-black uppercase tracking-tighter">Content Item</h3>
                            <button onClick={() => setShowContentForm(false)} className="hover:bg-white/10 p-2 rounded-xl"><X /></button>
                        </div>
                        <form onSubmit={handleSaveContent} className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Item Name</label>
                                <input
                                    type="text" required
                                    value={contentFormData.name}
                                    onChange={(e) => setContentFormData({ ...contentFormData, name: e.target.value })}
                                    placeholder="e.g., Fur Elise"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Type</label>
                                <select
                                    value={contentFormData.content_type}
                                    onChange={(e) => setContentFormData({ ...contentFormData, content_type: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-slate-900 font-black appearance-none"
                                >
                                    <option value="song">Song / Piece</option>
                                    <option value="exercise">Technical Exercise</option>
                                    <option value="theory">Theory / Test</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase shadow-xl">
                                Save Item
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
