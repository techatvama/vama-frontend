import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { api } from '../../lib/api';
import {
    ArrowLeft, ChevronRight, Loader2, Mail, Phone, Calendar,
    Users, BookOpen, TrendingUp, Clock, Activity, Award,
    BarChart2, Layers, CheckCircle, Target, Zap, Star
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val) => {
    if (!val) return null;
    try { return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return val; }
};

const fmtShort = (val) => {
    if (!val) return null;
    try { return new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    catch { return val; }
};

const SUBJECT_COLORS = {
    Guitar: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    Piano: { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
    Drums: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    Vocals: { bg: 'bg-pink-100', text: 'text-pink-800', dot: 'bg-pink-500' },
    Violin: { bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
    Keyboard: { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
};
const subjectColor = (s) => SUBJECT_COLORS[s] || { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400' };

// ─── Sub-components ───────────────────────────────────────────────────────────

const KpiCard = ({ icon: Icon, label, value, sub, accent = 'purple' }) => {
    const palettes = {
        purple: 'from-[#463a7a] to-[#5e4fa2] shadow-[#463a7a]/20',
        green: 'from-emerald-500 to-teal-500 shadow-emerald-500/20',
        orange: 'from-orange-400 to-rose-400 shadow-orange-400/20',
        blue: 'from-blue-500 to-cyan-500 shadow-blue-500/20',
        pink: 'from-pink-500 to-fuchsia-500 shadow-pink-500/20',
    };
    return (
        <div className={`bg-gradient-to-br ${palettes[accent]} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/20 rounded-xl">
                    <Icon size={18} />
                </div>
            </div>
            <div className="text-3xl font-black mb-0.5">{value}</div>
            <div className="text-sm font-semibold opacity-90">{label}</div>
            {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
        </div>
    );
};

const OccupancyRing = ({ pct }) => {
    const r = 36, circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1';
    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="-rotate-90" width="96" height="96">
                <circle cx="48" cy="48" r={r} strokeWidth="8" className="stroke-slate-100" fill="none" />
                <circle cx="48" cy="48" r={r} strokeWidth="8" fill="none"
                    stroke={color} strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="absolute text-center">
                <div className="text-lg font-black text-slate-800">{pct}%</div>
                <div className="text-[9px] text-slate-500 uppercase tracking-wide">Full</div>
            </div>
        </div>
    );
};

const MiniBar = ({ value, max, color = 'bg-[#463a7a]' }) => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`${color} h-full rounded-full`} style={{ width: `${pct}%`, transition: 'width 0.8s ease' }} />
        </div>
    );
};

const TabBtn = ({ id, label, icon: Icon, active, onClick }) => (
    <button onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-all
            ${active ? 'border-[#463a7a] text-[#463a7a] bg-[#463a7a]/5' : 'border-transparent text-slate-500 hover:text-[#463a7a] hover:bg-slate-50'}`}>
        <Icon size={15} /> {label}
    </button>
);

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffProfilePage() {
    const { staffId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        setLoading(true);
        api.get(`/admin/staff/${staffId}/profile`)
            .then(r => setData(r.data))
            .catch(() => setError('Profile not found'))
            .finally(() => setLoading(false));
    }, [staffId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#463a7a] mx-auto mb-3" />
                <p className="text-slate-400 text-sm">Loading profile…</p>
            </div>
        </div>
    );

    if (error || !data) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <p className="text-slate-500">{error || 'Not found'}</p>
            <button onClick={() => navigate('/teacher')} className="flex items-center gap-2 px-4 py-2 bg-[#463a7a] text-white rounded-lg text-sm font-medium">
                <ArrowLeft size={15} /> Back to Staff
            </button>
        </div>
    );

    const { analytics, batches, upcoming_sessions } = data;
    const initials = data.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';

    // Build weekly schedule map
    const weekSchedule = {};
    DAY_ORDER.forEach(d => weekSchedule[d] = []);
    batches.forEach(b => {
        let days = [];
        try { days = JSON.parse(b.days_of_week || '[]'); } catch { days = []; }
        days.forEach(day => {
            if (weekSchedule[day]) weekSchedule[day].push(b);
        });
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'schedule', label: 'Weekly Schedule', icon: Calendar },
        { id: 'classes', label: `Classes (${batches.length})`, icon: BookOpen },
        { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    ];

    const maxStudentsPerBatch = Math.max(...batches.map(b => b.enrolled), 1);

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm sticky top-0 z-20 shadow-sm">
                <button onClick={() => navigate('/teacher')}
                    className="flex items-center gap-1.5 text-slate-500 hover:text-[#463a7a] font-medium transition-colors">
                    <ArrowLeft size={15} /> Staff
                </button>
                <ChevronRight size={14} className="text-slate-300" />
                <span className="text-slate-800 font-semibold">{data.name}</span>
                <span className="ml-2 px-2 py-0.5 bg-[#463a7a]/10 text-[#463a7a] rounded-full text-xs font-semibold">{data.role}</span>
            </div>

            <div className="max-w-5xl mx-auto px-5 py-6 space-y-5">

                {/* ── HERO ── */}
                <div className="bg-gradient-to-br from-[#463a7a] via-[#3d3370] to-[#2d2550] rounded-2xl overflow-hidden shadow-xl relative">
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{ backgroundImage: 'radial-gradient(ellipse at 90% 10%, #fff 0%, transparent 55%), radial-gradient(ellipse at 10% 90%, #5e4fa2 0%, transparent 60%)' }} />

                    <div className="relative p-7">
                        <div className="flex items-start gap-5 flex-wrap">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
                                {initials}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-[200px]">
                                <div className="flex items-center gap-3 flex-wrap mb-1">
                                    <h1 className="text-2xl font-black text-white">{data.name}</h1>
                                    <span className="px-2.5 py-1 bg-white/20 text-white/90 text-xs font-bold rounded-full border border-white/20">
                                        {data.role}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3">
                                    {data.email && (
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <Mail size={13} /><span className="truncate">{data.email}</span>
                                        </div>
                                    )}
                                    {data.phone && data.phone !== '—' && (
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <Phone size={13} /><span>{data.phone}</span>
                                        </div>
                                    )}
                                    {data.joined_date && (
                                        <div className="flex items-center gap-2 text-white/70 text-sm">
                                            <Calendar size={13} /><span>Joined {fmt(data.joined_date)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Occupancy ring */}
                            <div className="flex-shrink-0 bg-white/10 rounded-2xl p-4 flex flex-col items-center gap-1 border border-white/15">
                                <OccupancyRing pct={analytics.occupancy_pct} />
                                <div className="text-xs text-white/60 mt-1">Occupancy</div>
                                <div className="text-xs text-white/80 font-semibold">{analytics.active_students}/{analytics.total_capacity} seats</div>
                            </div>
                        </div>

                        {/* KPI strip */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                            {[
                                { label: 'Active Students', value: analytics.active_students, icon: Users },
                                { label: 'Batches', value: analytics.total_batches, icon: Layers },
                                { label: 'Sessions Taught', value: analytics.total_sessions_taught, icon: CheckCircle },
                                { label: 'Avg. Attendance', value: `${analytics.overall_attendance_rate}%`, icon: TrendingUp },
                            ].map(k => (
                                <div key={k.label} className="bg-white/10 border border-white/10 rounded-xl p-3.5 backdrop-blur">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <k.icon size={13} className="text-white/60" />
                                        <span className="text-[10px] text-white/60 uppercase tracking-wide font-semibold">{k.label}</span>
                                    </div>
                                    <div className="text-2xl font-black text-white">{k.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── TAB PANEL ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-slate-200">
                        {tabs.map(t => <TabBtn key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
                    </div>

                    <div className="p-6">

                        {/* ── OVERVIEW ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* KPI Cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <KpiCard icon={Users} label="Active Students" value={analytics.active_students} sub={`of ${analytics.total_capacity} capacity`} accent="purple" />
                                    <KpiCard icon={Target} label="Occupancy" value={`${analytics.occupancy_pct}%`} sub="seats filled" accent={analytics.occupancy_pct >= 70 ? 'green' : 'orange'} />
                                    <KpiCard icon={Zap} label="This Month" value={analytics.sessions_this_month} sub="classes taught" accent="blue" />
                                    <KpiCard icon={TrendingUp} label="Attendance Rate" value={`${analytics.overall_attendance_rate}%`} sub="avg across classes" accent={analytics.overall_attendance_rate >= 75 ? 'green' : 'orange'} />
                                </div>

                                {/* Subject breakdown */}
                                {Object.keys(analytics.subject_breakdown).length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Subjects Taught</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(analytics.subject_breakdown).map(([subj, count]) => {
                                                const c = subjectColor(subj);
                                                return (
                                                    <div key={subj} className={`flex items-center gap-2 px-3 py-2 ${c.bg} rounded-xl`}>
                                                        <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                                        <span className={`text-sm font-semibold ${c.text}`}>{subj}</span>
                                                        <span className={`text-xs ${c.text} opacity-70`}>{count} batch{count > 1 ? 'es' : ''}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Upcoming sessions */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Classes</h3>
                                    {upcoming_sessions.length === 0 ? (
                                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                                            <Clock size={28} className="mx-auto mb-2 opacity-40" />
                                            <p className="text-sm">No upcoming classes</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {upcoming_sessions.slice(0, 5).map(s => {
                                                const c = subjectColor(s.subject);
                                                const occ = s.capacity > 0 ? Math.round(s.enrolled / s.capacity * 100) : 0;
                                                return (
                                                    <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-[#463a7a]/30 hover:bg-slate-50 transition-all">
                                                        {s.color_tag ? (
                                                            <div className="w-2 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: s.color_tag }} />
                                                        ) : (
                                                            <div className={`w-2 self-stretch rounded-full flex-shrink-0 ${c.dot}`} />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>{s.subject}</span>
                                                                {s.batch_name && <span className="text-xs text-slate-400">{s.batch_name}</span>}
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                                <span className="flex items-center gap-1"><Clock size={11} />{s.start_time} – {s.end_time}</span>
                                                                <span className="flex items-center gap-1"><Users size={11} />{s.enrolled}/{s.capacity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <div className="text-sm font-semibold text-slate-700">{fmtShort(s.date)}</div>
                                                            <div className={`text-xs font-medium mt-0.5 ${occ >= 80 ? 'text-orange-500' : 'text-emerald-600'}`}>{occ}% full</div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── WEEKLY SCHEDULE ── */}
                        {activeTab === 'schedule' && (
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500">Recurring weekly schedule based on batch assignments.</p>
                                <div className="grid grid-cols-7 gap-2">
                                    {DAY_ORDER.map(day => (
                                        <div key={day} className="min-h-[120px]">
                                            <div className={`text-center text-xs font-bold uppercase tracking-wide py-2 mb-2 rounded-lg
                                                ${weekSchedule[day].length > 0 ? 'bg-[#463a7a] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {day}
                                            </div>
                                            <div className="space-y-1.5">
                                                {weekSchedule[day].length === 0 ? (
                                                    <div className="text-center text-xs text-slate-300 py-4">—</div>
                                                ) : (
                                                    weekSchedule[day].map(b => {
                                                        const c = subjectColor(b.subject);
                                                        return (
                                                            <div key={b.id}
                                                                className={`rounded-lg p-2 text-center border ${c.bg} border-transparent`}
                                                                style={b.color_tag ? { borderColor: b.color_tag + '60', backgroundColor: b.color_tag + '18' } : {}}>
                                                                <div className={`text-[10px] font-bold ${c.text} truncate`}>{b.subject}</div>
                                                                <div className="text-[9px] text-slate-500 mt-0.5">{b.start_time}</div>
                                                                <div className="text-[9px] text-slate-400">{b.enrolled}/{b.capacity}</div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Day summary */}
                                <div className="mt-4 grid grid-cols-7 gap-2">
                                    {DAY_ORDER.map(day => (
                                        <div key={day} className="text-center">
                                            <div className="text-lg font-black text-slate-700">{weekSchedule[day].length}</div>
                                            <div className="text-[10px] text-slate-400">class{weekSchedule[day].length !== 1 ? 'es' : ''}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── CLASSES / BATCHES ── */}
                        {activeTab === 'classes' && (
                            <div className="space-y-3">
                                {batches.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>No batches assigned yet</p>
                                    </div>
                                ) : (
                                    batches.map(b => {
                                        const c = subjectColor(b.subject);
                                        const occColor = b.occupancy_pct >= 80 ? 'text-orange-500' : b.occupancy_pct >= 50 ? 'text-yellow-600' : 'text-emerald-600';
                                        const barColor = b.occupancy_pct >= 80 ? 'bg-orange-400' : b.occupancy_pct >= 50 ? 'bg-yellow-400' : 'bg-emerald-500';
                                        return (
                                            <div key={b.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-[#463a7a]/30 hover:shadow-sm transition-all">
                                                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        {b.color_tag && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: b.color_tag }} />}
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>{b.subject}</span>
                                                        {b.name && <span className="text-sm font-medium text-slate-600">{b.name}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-slate-400">{b.start_time} – {b.end_time}</span>
                                                        <span className={`text-sm font-bold ${occColor}`}>{b.occupancy_pct}% full</span>
                                                    </div>
                                                </div>
                                                <div className="px-5 py-4">
                                                    <div className="grid grid-cols-4 gap-4 mb-3">
                                                        {[
                                                            { label: 'Students', value: b.enrolled, icon: Users },
                                                            { label: 'Capacity', value: b.capacity, icon: Target },
                                                            { label: 'Sessions', value: b.total_sessions, icon: Calendar },
                                                            { label: 'Attendance', value: `${b.avg_attendance_rate}%`, icon: TrendingUp },
                                                        ].map(s => (
                                                            <div key={s.label} className="text-center">
                                                                <div className="text-xl font-black text-slate-800">{s.value}</div>
                                                                <div className="text-xs text-slate-400 mt-0.5 flex items-center justify-center gap-1">
                                                                    <s.icon size={10} />{s.label}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                                        <div className={`${barColor} h-full rounded-full transition-all`}
                                                            style={{ width: `${b.occupancy_pct}%` }} />
                                                    </div>
                                                    <div className="flex justify-between mt-1.5 text-xs text-slate-400">
                                                        <span>{b.enrolled} enrolled</span>
                                                        <span>{b.capacity - b.enrolled} seats left</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {/* ── ANALYTICS ── */}
                        {activeTab === 'analytics' && (
                            <div className="space-y-6">
                                {/* Overview metrics */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <KpiCard icon={Users} label="Total Students" value={analytics.active_students} accent="purple" />
                                    <KpiCard icon={CheckCircle} label="Total Sessions" value={analytics.total_sessions_taught} accent="blue" />
                                    <KpiCard icon={Award} label="Avg Attendance" value={`${analytics.overall_attendance_rate}%`} accent={analytics.overall_attendance_rate >= 75 ? 'green' : 'orange'} />
                                </div>

                                {/* Occupancy by batch – horizontal bar chart */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Student Load by Batch</h3>
                                    <div className="space-y-3">
                                        {batches.sort((a, b) => b.enrolled - a.enrolled).map(b => {
                                            const c = subjectColor(b.subject);
                                            return (
                                                <div key={b.id}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                                            <span className="text-sm font-medium text-slate-700">{b.subject}{b.name ? ` – ${b.name}` : ''}</span>
                                                        </div>
                                                        <span className="text-sm font-black text-slate-800">{b.enrolled} / {b.capacity}</span>
                                                    </div>
                                                    <MiniBar value={b.enrolled} max={b.capacity}
                                                        color={b.occupancy_pct >= 80 ? 'bg-orange-400' : b.occupancy_pct >= 50 ? 'bg-yellow-400' : 'bg-emerald-500'} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Attendance by batch */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Attendance Rate by Batch</h3>
                                    <div className="space-y-3">
                                        {batches.sort((a, b) => b.avg_attendance_rate - a.avg_attendance_rate).map(b => {
                                            const c = subjectColor(b.subject);
                                            const attColor = b.avg_attendance_rate >= 80 ? 'bg-emerald-500' : b.avg_attendance_rate >= 60 ? 'bg-yellow-400' : 'bg-red-400';
                                            return (
                                                <div key={b.id}>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${c.dot}`} />
                                                            <span className="text-sm font-medium text-slate-700">{b.subject}{b.name ? ` – ${b.name}` : ''}</span>
                                                        </div>
                                                        <span className={`text-sm font-black
                                                            ${b.avg_attendance_rate >= 80 ? 'text-emerald-600' : b.avg_attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                                                            {b.avg_attendance_rate}%
                                                        </span>
                                                    </div>
                                                    <MiniBar value={b.avg_attendance_rate} max={100} color={attColor} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Summary insight cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Star size={16} className="text-yellow-500" />
                                            <span className="text-sm font-bold text-slate-700">Best Performing Batch</span>
                                        </div>
                                        {batches.length > 0 ? (() => {
                                            const best = [...batches].sort((a, b) => b.avg_attendance_rate - a.avg_attendance_rate)[0];
                                            const c = subjectColor(best.subject);
                                            return (
                                                <div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>{best.subject}</span>
                                                    <div className="text-2xl font-black text-slate-800 mt-2">{best.avg_attendance_rate}%</div>
                                                    <div className="text-xs text-slate-500">{best.enrolled} students · {best.total_sessions} sessions</div>
                                                </div>
                                            );
                                        })() : <p className="text-slate-400 text-sm">No data</p>}
                                    </div>
                                    <div className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Users size={16} className="text-blue-500" />
                                            <span className="text-sm font-bold text-slate-700">Largest Batch</span>
                                        </div>
                                        {batches.length > 0 ? (() => {
                                            const largest = [...batches].sort((a, b) => b.enrolled - a.enrolled)[0];
                                            const c = subjectColor(largest.subject);
                                            return (
                                                <div>
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${c.bg} ${c.text}`}>{largest.subject}</span>
                                                    <div className="text-2xl font-black text-slate-800 mt-2">{largest.enrolled} students</div>
                                                    <div className="text-xs text-slate-500">{largest.occupancy_pct}% of {largest.capacity} capacity</div>
                                                </div>
                                            );
                                        })() : <p className="text-slate-400 text-sm">No data</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
