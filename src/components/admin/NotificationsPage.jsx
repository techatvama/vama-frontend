import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Bell, CheckCheck, Trash2, Filter, Circle } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_STYLES = {
    payment:    { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-500',  label: 'Payments'   },
    student:    { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Students'  },
    staff:      { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500',    label: 'Staff'      },
    schedule:   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500',   label: 'Schedule'   },
    curriculum: { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500',    label: 'Curriculum' },
    exam:       { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500',     label: 'Exams'      },
    attendance: { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500',    label: 'Attendance' },
};

const FILTERS = [
    { key: 'all',        label: 'All' },
    { key: 'payment',    label: 'Payments' },
    { key: 'student',    label: 'Students' },
    { key: 'staff',      label: 'Staff' },
    { key: 'schedule',   label: 'Schedule' },
    { key: 'curriculum', label: 'Curriculum' },
    { key: 'attendance', label: 'Attendance' },
];

function relativeTime(iso) {
    try {
        return formatDistanceToNow(new Date(iso), { addSuffix: true });
    } catch {
        return '';
    }
}

function NotificationRow({ n, onRead }) {
    const style = CATEGORY_STYLES[n.category] || CATEGORY_STYLES.schedule;
    return (
        <div
            onClick={() => onRead(n.id)}
            className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-slate-50 border-b border-slate-50 last:border-0 ${!n.read ? 'bg-violet-50/30' : ''}`}
        >
            {/* Icon bubble */}
            <div className={`w-10 h-10 rounded-2xl ${style.bg} flex items-center justify-center text-lg flex-shrink-0 mt-0.5`}>
                {n.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!n.read ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                    </p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{relativeTime(n.timestamp)}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-[#463a7a] flex-shrink-0" />}
                    </div>
                </div>
                {n.message && (
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>
                )}
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${style.bg} ${style.text}`}>
                    {style.label}
                </span>
            </div>
        </div>
    );
}

export default function NotificationsPage() {
    const navigate = useNavigate();
    const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications();
    const [activeFilter, setActiveFilter] = useState('all');

    const today = new Date().toDateString();
    const todayCount = notifications.filter(n => new Date(n.timestamp).toDateString() === today).length;

    const visible = activeFilter === 'all'
        ? notifications
        : notifications.filter(n => n.category === activeFilter);

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-8 pb-8 lg:px-12 overflow-hidden relative">
                <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/5 rounded-full pointer-events-none" />
                <div className="relative z-10 max-w-[900px] mx-auto">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold text-white tracking-tight leading-none mb-1">Notifications</h1>
                            <p className="text-white/50 text-sm">Every change made across the platform</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all border border-white/10"
                                >
                                    <CheckCheck size={14} /> Mark all read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAll}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-xl text-xs font-semibold transition-all border border-red-500/20"
                                >
                                    <Trash2 size={14} /> Clear all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-6 flex-wrap">
                        {[
                            { label: 'Total',  val: notifications.length },
                            { label: 'Unread', val: unreadCount },
                            { label: 'Today',  val: todayCount },
                        ].map(s => (
                            <div key={s.label} className="bg-white/10 rounded-2xl px-4 py-2">
                                <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">{s.label}: </span>
                                <span className="text-sm font-bold text-white">{s.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[900px] mx-auto px-4 lg:px-6 py-6 space-y-4 pb-20">

                {/* Category filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {FILTERS.map(f => {
                        const count = f.key === 'all' ? notifications.length : notifications.filter(n => n.category === f.key).length;
                        return (
                            <button
                                key={f.key}
                                onClick={() => setActiveFilter(f.key)}
                                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-semibold transition-all ${activeFilter === f.key ? 'bg-[#463a7a] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#463a7a]/30'}`}
                            >
                                {f.label}
                                <span className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold ${activeFilter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Notifications list */}
                {visible.length === 0 ? (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 py-24 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                            <Bell size={28} className="text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-semibold">No notifications yet</p>
                        <p className="text-slate-300 text-sm mt-1">Changes you make will appear here</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        {visible.map(n => (
                            <NotificationRow key={n.id} n={n} onRead={markRead} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
