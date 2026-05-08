import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    TrendingUp,
    CheckCircle2,
    BookOpen,
    Award,
    Music,
    Zap,
    Star,
    ChevronRight,
    ChevronDown,
    Loader2,
    Clock,
    Target
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

export default function StudentProgress() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedModules, setExpandedModules] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('student'));
        if (student) {
            fetchProgress(student.id);
        } else {
            navigate('/student-login');
        }
    }, [navigate]);

    const fetchProgress = async (studentId) => {
        try {
            const res = await api.get(`/students/${studentId}/progress`);
            setData(res.data);
            // Expand first module by default
            if (res.data.syllabus?.modules?.length > 0) {
                setExpandedModules({ [res.data.syllabus.modules[0].id]: true });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleModule = (id) => {
        setExpandedModules(prev => ({ ...prev, [id]: !prev[id] }));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    if (!data?.syllabus) return (
        <div className="p-20 text-center">
            <Music size={48} className="mx-auto text-slate-200 mb-6" />
            <h2 className="text-2xl font-black text-slate-300 tracking-tighter uppercase">No Curriculum Assigned</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest mt-2">Talk to your teacher to start your syllabus journey!</p>
        </div>
    );

    const calculateModuleProgress = (module) => {
        const total = module.contents.length;
        const done = module.contents.filter(c => c.progress?.status === 'done').length;
        return Math.round((done / total) * 100) || 0;
    };

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header Profile */}
            <div className="relative bg-[#463a7a] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                    <TrendingUp className="w-96 h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[22px] flex items-center justify-center border border-white/10">
                                <Target className="text-orange-400" size={32} />
                            </div>
                            <div>
                                <p className="text-indigo-200/40 text-[10px] font-black uppercase tracking-widest leading-none mb-2">Curriculum Focus</p>
                                <h2 className="text-3xl font-black text-white tracking-tighter leading-none">{data.student.instrument}</h2>
                            </div>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-8">
                            Your Musical<br />
                            <span className="text-indigo-300">Milestones.</span>
                        </h1>
                    </div>

                    <div className="grid grid-cols-2 gap-6 pb-2">
                        <div className="bg-white rounded-[40px] p-8 shadow-2xl">
                            <Award className="text-yellow-400 mb-4 fill-current" size={32} />
                            <p className="text-3xl font-black text-slate-900 leading-none">{data.student.grade}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Current Grade</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md border border-white/5 rounded-[40px] p-8">
                            <CheckCircle2 className="text-emerald-400 mb-4" size={32} />
                            <p className="text-3xl font-black text-white leading-none">
                                {data.syllabus.modules.reduce((acc, m) => acc + m.contents.filter(c => c.progress?.status === 'done').length, 0)}
                            </p>
                            <p className="text-indigo-200/40 text-[10px] font-black uppercase tracking-widest mt-2">Items Completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Curriculum List */}
            <div className="space-y-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter px-4 flex items-center gap-4">
                    <BookOpen className="text-[#463a7a]" />
                    SYLLABUS MODULES
                </h2>

                <div className="space-y-6">
                    {data.syllabus.modules.map(module => {
                        const isOpen = expandedModules[module.id];
                        const progressPct = calculateModuleProgress(module);

                        return (
                            <div key={module.id} className={`bg-white rounded-[40px] border transition-all duration-500 overflow-hidden ${isOpen ? 'border-[#463a7a] shadow-2xl shadow-indigo-900/10' : 'border-slate-100 shadow-xl shadow-slate-200/50'}`}>
                                <button
                                    onClick={() => toggleModule(module.id)}
                                    className="w-full text-left p-8 lg:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 group"
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#463a7a] text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-[#463a7a]/5 group-hover:text-[#463a7a]'}`}>
                                            <Zap size={28} className={isOpen ? 'fill-current' : ''} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Module {module.order}</p>
                                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none group-hover:text-[#463a7a] transition-colors">{module.name}</h3>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8 lg:gap-12">
                                        <div className="flex flex-col items-end">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
                                                <span className="text-sm font-black text-[#463a7a]">{progressPct}%</span>
                                            </div>
                                            <div className="w-48 h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out" style={{ width: `${progressPct}%` }} />
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={20} />
                                        </div>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-10 pb-10 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-500">
                                        {module.contents.map(content => (
                                            <div key={content.id} className={`p-6 rounded-[32px] border transition-all flex items-center gap-5 ${content.progress?.status === 'done' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${content.progress?.status === 'done' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white text-slate-200'}`}>
                                                    {content.progress?.status === 'done' ? <CheckCircle2 size={20} /> : <Music size={20} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-black truncate ${content.progress?.status === 'done' ? 'text-emerald-900' : 'text-slate-400'}`}>{content.name}</p>
                                                    <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-1">{content.content_type}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
