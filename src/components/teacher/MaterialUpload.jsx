import React, { useState, useEffect, useRef } from 'react';
import { api, API_BASE } from '../../lib/api';
import {
    FileUp,
    FileText,
    Image as ImageIcon,
    Music as AudioIcon,
    Video as VideoIcon,
    CheckCircle2,
    Loader2,
    X,
    Plus,
    ArrowLeft,
    Search,
    User,
    ChevronDown,
    Users
} from 'lucide-react';
import { useNavigate } from 'react-router';

// Searchable multi-select for students
function StudentMultiSelect({ students, selected, onChange }) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = students.filter(s =>
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(query.toLowerCase())
    );

    const toggle = (id) => {
        onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
    };

    const removeChip = (id) => onChange(selected.filter(x => x !== id));

    return (
        <div ref={ref} className="relative">
            {/* Selected chips */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {selected.map(id => {
                        const s = students.find(st => st.id === id);
                        if (!s) return null;
                        return (
                            <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                {s.first_name} {s.last_name}
                                <button type="button" onClick={() => removeChip(id)} className="hover:text-indigo-900">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold text-slate-700 focus:outline-none"
            >
                <span className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4" />
                    {selected.length === 0
                        ? 'All Students'
                        : `${selected.length} student${selected.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search students..."
                                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-xl focus:outline-none border border-slate-100"
                            />
                        </div>
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                        {filtered.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 text-center italic">No students found</p>
                        ) : (
                            filtered.map(s => {
                                const checked = selected.includes(s.id);
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => toggle(s.id)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50 transition-colors ${checked ? 'bg-indigo-50' : ''}`}
                                    >
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                                            {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-slate-800">{s.first_name} {s.last_name}</span>
                                        {s.instrument && <span className="ml-auto text-xs text-slate-400">{s.instrument}</span>}
                                    </button>
                                );
                            })
                        )}
                    </div>
                    {selected.length > 0 && (
                        <div className="p-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => { onChange([]); setOpen(false); }}
                                className="w-full text-xs text-red-500 hover:text-red-700 font-semibold py-1"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MaterialUpload() {
    const [teacher, setTeacher] = useState(null);
    const [students, setStudents] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) {
            setTeacher(JSON.parse(stored));
        } else {
            navigate('/teacher-login');
        }
    }, [navigate]);

    useEffect(() => {
        if (teacher) fetchData();
    }, [teacher]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentsRes, materialsRes] = await Promise.all([
                api.get(`/teacher/${teacher.id}/students`),
                api.get(`/teacher/${teacher.id}/materials`)
            ]);
            setStudents(studentsRes.data);
            setMaterials(materialsRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title) return;

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('teacher_id', teacher.id);
        formData.append('title', title);
        formData.append('student_ids', selectedStudents.join(','));

        try {
            await api.post('/teacher/upload-material', formData);
            setSuccess(true);
            setTitle('');
            setSelectedStudents([]);
            setFile(null);
            fetchData();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError('Failed to upload material. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (type) => {
        switch ((type || '').toLowerCase()) {
            case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
            case 'image': return <ImageIcon className="w-5 h-5 text-blue-500" />;
            case 'audio': return <AudioIcon className="w-5 h-5 text-purple-500" />;
            case 'video': return <VideoIcon className="w-5 h-5 text-orange-500" />;
            default: return <FileText className="w-5 h-5 text-slate-400" />;
        }
    };

    const filteredMaterials = materials.filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const student = students.find(s => s.id === m.student_id);
        const studentName = student
            ? `${student.first_name} ${student.last_name}`.toLowerCase()
            : 'all students';
        return m.title?.toLowerCase().includes(q) || studentName.includes(q);
    });

    if (!teacher) return null;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-slate-400 hover:text-indigo-600 transition-all hover:shadow-lg hover:shadow-indigo-100/50"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Materials Hub</h1>
                    <p className="text-slate-500 font-medium">Share resources, recordings, and assignments with your students</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200 border border-slate-100 p-8 sticky top-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-indigo-600" />
                            Upload New
                        </h2>

                        <form onSubmit={handleUpload} className="space-y-6">
                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 text-sm font-medium rounded-2xl border border-red-100">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="p-4 bg-green-50 text-green-600 text-sm font-bold rounded-2xl border border-green-100 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Material uploaded successfully!
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Piano Sheet - Für Elise"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">
                                    Assign to Students (Optional)
                                </label>
                                <StudentMultiSelect
                                    students={students}
                                    selected={selectedStudents}
                                    onChange={setSelectedStudents}
                                />
                                <p className="text-[10px] text-slate-400 mt-1.5 px-1">
                                    Leave empty to share with all students
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">File</label>
                                <label className="group block w-full border-2 border-dashed border-slate-200 rounded-[32px] p-8 text-center hover:border-indigo-500 hover:bg-indigo-50/10 transition-all cursor-pointer relative overflow-hidden">
                                    <input
                                        type="file"
                                        onChange={(e) => setFile(e.target.files[0])}
                                        className="hidden"
                                    />
                                    {file ? (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-3">
                                                <FileText className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900 truncate max-w-full px-4">{file.name}</p>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.preventDefault(); setFile(null); }}
                                                className="mt-2 text-xs font-bold text-red-500 hover:text-red-600"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4 group-hover:scale-110 transition-transform">
                                                <FileUp className="w-8 h-8" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-900">Choose a file or drop it here</p>
                                            <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-tight">PDF, Image, Audio, or Video</p>
                                        </div>
                                    )}
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file || !title}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <FileUp className="w-5 h-5" />
                                        Share Material
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Materials List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[40px] shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden min-h-[600px]">
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                                <FileText className="w-6 h-6 text-indigo-600" />
                                Shared Resources
                            </h2>
                            <div className="relative w-64">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by student or title..."
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none text-sm"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 space-y-4">
                                {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl" />)}
                            </div>
                        ) : filteredMaterials.length > 0 ? (
                            <div className="p-4 grid grid-cols-1 gap-4">
                                {filteredMaterials.map((m) => {
                                    const student = students.find(s => s.id === m.student_id);
                                    return (
                                        <div
                                            key={m.id}
                                            className="group p-4 rounded-[28px] border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-100/30 transition-all flex items-center gap-6"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                                                {getFileIcon(m.file_type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">{m.title}</h3>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-tight">
                                                        <User className="w-3 h-3" />
                                                        {student ? `${student.first_name} ${student.last_name}` : 'All Students'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                        Uploaded {new Date(m.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <a
                                                href={`${API_BASE}${m.file_url}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm"
                                            >
                                                <FileUp className="w-5 h-5" />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : materials.length > 0 ? (
                            <div className="flex flex-col items-center justify-center py-32 opacity-40">
                                <Search className="w-16 h-16 mb-4" />
                                <p className="font-bold text-lg">No results for "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 opacity-30">
                                <FileText className="w-20 h-20 mb-4" />
                                <p className="font-bold text-xl">No materials shared yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
