import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    FileText,
    Search,
    Download,
    ExternalLink,
    Music,
    Video,
    FileImage,
    Filter,
    ArrowUpRight,
    Loader2,
    Lock,
    Zap,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

export default function StudentMaterials() {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('student'));
        if (student) {
            fetchMaterials(student.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchMaterials = async (studentId) => {
        try {
            const res = await api.get(`/students/${studentId}/materials`);
            setMaterials(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'pdf': return <FileText size={24} />;
            case 'video': return <Video size={24} />;
            case 'image': return <FileImage size={24} />;
            case 'audio': return <Music size={24} />;
            default: return <FileText size={24} />;
        }
    };

    const filtered = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(search.toLowerCase());
        const matchesFilter = filter === 'all' || m.file_type === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-12 max-w-7xl mx-auto space-y-8 lg:space-y-12 pb-24">
            {/* Header Profile */}
            <div className="relative bg-[#463a7a] rounded-[28px] sm:rounded-[36px] lg:rounded-[50px] p-5 sm:p-8 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125 hidden sm:block">
                    <Music className="w-96 h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-12">
                    <div>
                        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight lg:tracking-tighter leading-[0.95] lg:leading-[0.85] mb-2 lg:mb-6">
                            Learning<br />
                            <span className="text-indigo-300">Resources.</span>
                        </h1>
                        <p className="text-indigo-100/60 font-medium text-sm sm:text-lg max-w-sm">
                            Access sheet music, recordings, and lessons shared by your teachers.
                        </p>
                    </div>

                    <div className="flex flex-col items-stretch gap-2 sm:gap-3 bg-white/10 backdrop-blur-md rounded-[24px] sm:rounded-[32px] p-2 border border-white/5 shadow-xl w-full lg:w-auto">
                        <div className="relative w-full lg:w-80 group">
                            <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-white transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search resources…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 sm:py-4 pl-11 sm:pl-14 pr-4 text-white text-sm sm:text-base font-bold placeholder:text-white/20 focus:outline-none focus:bg-white/10 transition-all shadow-inner"
                            />
                        </div>
                        <div className="grid grid-cols-4 gap-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                            {['all', 'pdf', 'video', 'audio'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t)}
                                    className={`px-2 py-2.5 rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest transition-all whitespace-nowrap ${filter === t ? 'bg-white text-[#463a7a] shadow-lg' : 'text-white/40 hover:text-white'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Materials List */}
            <div className="space-y-6">
                {filtered.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">  
                        {filtered.map(m => (
                            <div key={m.id} className="bg-white rounded-[40px] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col group hover:border-[#463a7a] transition-all duration-500">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-[#463a7a] shadow-sm transform group-hover:bg-[#463a7a] group-hover:text-white group-hover:rotate-12 transition-all">
                                        {getIcon(m.file_type)}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Shared On</p>
                                        <p className="text-sm font-black text-slate-900">{format(new Date(m.created_at), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-10 flex-1">
                                    <span className="px-3 py-1 bg-indigo-50 text-[#463a7a] text-[10px] font-black uppercase tracking-widest rounded-lg">{m.file_type}</span>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight group-hover:text-[#463a7a] transition-colors">{m.title}</h3>
                                </div>

                                <div className="pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                                    <a
                                        href={`${api.defaults.baseURL}${m.file_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-100 transition-all border border-slate-200/50"
                                    >
                                        <ExternalLink size={14} /> VIEW
                                    </a>
                                    <a
                                        href={`${api.defaults.baseURL}${m.file_url}`}
                                        download
                                        className="py-4 bg-[#463a7a] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/10 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <Download size={14} /> DOWNLOAD
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[50px] p-24 text-center border-2 border-dashed border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-200 shadow-inner">
                            <Lock size={40} />
                        </div>
                        <h3 className="text-3xl font-black text-slate-300 tracking-tighter">No materials found</h3>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-3 px-8 max-w-sm mx-auto">Your teachers haven't shared anything with you yet, or try adjusting your filters</p>
                    </div>
                )}
            </div>

            {/* Material Request Tip */}
            <div className="bg-slate-50 rounded-[40px] p-8 border border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-lg text-orange-500">
                        <Zap size={24} className="fill-current" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none uppercase">Need something specific?</h4>
                        <p className="text-slate-400 text-sm font-medium mt-1">Request specialized sheet music or practice materials from your teacher.</p>
                    </div>
                </div>
                <button className="px-8 py-4 bg-white border border-slate-200 text-[#463a7a] font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-sm hover:bg-[#463a7a] hover:text-white hover:border-[#463a7a] transition-all">
                    MESSAGE TEACHER
                </button>
            </div>
        </div>
    );
}
