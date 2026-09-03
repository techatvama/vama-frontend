import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
} from 'date-fns';
import { api } from '../../lib/api';
import AddStudentDialog from '../AddStudentDialog';
import {
    Mail, Phone, MapPin, Calendar, CreditCard, BookOpen,
    TrendingUp, Clock, CheckCircle, XCircle, AlertCircle,
    ArrowLeft, Loader2, GraduationCap, DollarSign,
    Star, ChevronRight, ChevronLeft, Activity, Users, Pencil, Pause, UserX, RotateCcw,
    CalendarDays, ExternalLink,
} from 'lucide-react';

const formatDate = (val) => {
    if (!val) return null;
    try {
        const d = new Date(val);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return val; }
};

const StatCard = ({ label, value, sub, color = 'purple' }) => {
    const colors = {
        purple: 'from-[#463a7a] to-[#5e4fa2] text-white',
        green: 'from-emerald-500 to-teal-500 text-white',
        orange: 'from-orange-400 to-orange-500 text-white',
        blue: 'from-blue-500 to-blue-600 text-white',
    };
    return (
        <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-5 shadow-md`}>
            <div className="text-3xl font-black mb-1">{value}</div>
            <div className="text-sm font-semibold opacity-90">{label}</div>
            {sub && <div className="text-xs opacity-70 mt-0.5">{sub}</div>}
        </div>
    );
};

const Tab = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
            ${active ? 'border-[#463a7a] text-[#463a7a] bg-[#463a7a]/5' : 'border-transparent text-slate-500 hover:text-[#463a7a] hover:bg-slate-50'}`}
    >
        <Icon size={15} />
        {label}
    </button>
);

const AttendanceBar = ({ rate }) => {
    const color = rate >= 80 ? 'from-emerald-400 to-teal-500' : rate >= 60 ? 'from-yellow-400 to-orange-400' : 'from-red-400 to-rose-500';
    return (
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className={`bg-gradient-to-r ${color} h-full rounded-full transition-all`} style={{ width: `${rate}%` }} />
        </div>
    );
};

const MiniScheduleCalendar = ({ studentId }) => {
    const navigate = useNavigate();
    const [month, setMonth] = useState(startOfMonth(new Date()));
    const [selectedDay, setSelectedDay] = useState(new Date());
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const start = format(startOfWeek(month, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const end = format(endOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        api.get('/scheduling/calendar', { params: { student_id: studentId, start, end } })
            .then(res => setSessions(res.data?.occurrences || []))
            .catch(() => setSessions([]))
            .finally(() => setLoading(false));
    }, [studentId, month]);

    const byDate = sessions.reduce((acc, s) => {
        (acc[s.date] = acc[s.date] || []).push(s);
        return acc;
    }, {});

    const days = eachDayOfInterval({
        start: startOfWeek(month, { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
    });

    const selectedKey = format(selectedDay, 'yyyy-MM-dd');
    const dayClasses = (byDate[selectedKey] || []).slice().sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-br from-[#463a7a]/5 to-transparent">
                <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <CalendarDays size={15} className="text-[#463a7a]" /> Class Schedule
                </h3>
                <button onClick={() => navigate('/schedule')}
                    className="flex items-center gap-1 text-xs font-semibold text-[#463a7a] hover:underline">
                    Scheduler <ExternalLink size={11} />
                </button>
            </div>

            <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => setMonth(m => subMonths(m, 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-sm font-bold text-slate-800">{format(month, 'MMMM yyyy')}</span>
                    <button onClick={() => setMonth(m => addMonths(m, 1))}
                        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                <div className="grid grid-cols-7 mb-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-1">
                    {days.map(day => {
                        const key = format(day, 'yyyy-MM-dd');
                        const inMonth = isSameMonth(day, month);
                        const isToday = isSameDay(day, new Date());
                        const isSel = isSameDay(day, selectedDay);
                        const dayEvents = byDate[key] || [];
                        const hasClass = dayEvents.length > 0;
                        const hasCancelled = dayEvents.length > 0 && dayEvents.every(e => e.status === 'cancelled');
                        return (
                            <button
                                key={key}
                                onClick={() => setSelectedDay(day)}
                                className={`mx-auto w-8 h-8 relative flex items-center justify-center rounded-full text-xs font-semibold transition-colors
                                    ${!inMonth ? 'text-slate-300 hover:bg-slate-50' : 'text-slate-700'}
                                    ${isSel ? 'bg-[#463a7a] text-white shadow-sm' : isToday ? 'bg-[#463a7a]/10 text-[#463a7a] ring-1 ring-[#463a7a]/30' : inMonth ? 'hover:bg-slate-100' : ''}`}
                            >
                                {format(day, 'd')}
                                {hasClass && (
                                    <span className={`absolute bottom-0.5 w-1 h-1 rounded-full
                                        ${isSel ? 'bg-white' : hasCancelled ? 'bg-red-400' : 'bg-emerald-500'}`} />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {format(selectedDay, 'EEEE, d MMM')}
                        </span>
                        {!isSameDay(selectedDay, new Date()) && (
                            <button onClick={() => setSelectedDay(new Date())}
                                className="text-[11px] font-semibold text-[#463a7a] hover:underline">Today</button>
                        )}
                    </div>

                    {loading ? (
                        <div className="text-xs text-slate-400 py-4 text-center">Loading…</div>
                    ) : dayClasses.length === 0 ? (
                        <div className="text-xs text-slate-400 py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                            No classes this day
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {dayClasses.map(cls => (
                                <div key={cls.id}
                                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs
                                        ${cls.status === 'cancelled' ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="min-w-0">
                                        <div className={`font-semibold truncate ${cls.status === 'cancelled' ? 'text-red-500 line-through' : 'text-slate-800'}`}>
                                            {cls.name || cls.course || 'Class'}
                                        </div>
                                        <div className="text-slate-500 truncate">{cls.teacher_name || '—'}</div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-2">
                                        <div className="font-semibold text-slate-700">{cls.start_time}–{cls.end_time}</div>
                                        {cls.is_makeup && <div className="text-[10px] text-orange-500 font-bold uppercase">Makeup</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function StudentProfilePage() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [editOpen, setEditOpen] = useState(false);
    const [statusSaving, setStatusSaving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);
        return api.get(`/admin/student/${studentId}/complete-profile`)
            .then(res => setStudent(res.data))
            .catch(err => {
                // Try basic fallback
                return api.get(`/students/${studentId}`)
                    .then(r => setStudent({
                        ...r.data,
                        financial: { total_fees: 0, fees_paid: 0, outstanding: 0, payment_history: [] },
                        enrollments: [], upcoming_classes: [],
                        performance: { overall_grade: '—', attendance_percentage: 0, skills_progress: [], recent_feedback: [] }
                    }))
                    .catch(() => setError('Student not found'));
            })
            .finally(() => setLoading(false));
    }, [studentId]);

    useEffect(() => { load(); }, [load]);

    const STATUS_CONFIRM = {
        on_break: 'Mark this student as On Break?\n\nThey\'ll be removed from all class booking rosters immediately, their active package will be paused (session/expiry countdown stops), and payment reminders will be hidden until they\'re added back. All history and data stays intact — adding them into any class slot later automatically marks them Active again.',
        dropped: 'Mark this student as Dropped?\n\nThey\'ll be removed from all class booking rosters immediately and payment reminders will be hidden. Nothing is deleted — all attendance/payment history stays visible, and adding them into any class slot later automatically marks them Active again.',
        active: 'Mark this student as Active again?\n\nIf they were On Break, their package validity will be extended by however long they were paused, so they don\'t lose sessions they weren\'t using. (Note: adding them into a class slot does this automatically — you only need this button to reactivate without booking a class yet.)',
    };

    const changeEnrollmentStatus = (status) => {
        if (statusSaving || status === (student?.enrollment_status || 'active')) return;
        if (!confirm(STATUS_CONFIRM[status])) return;
        setStatusSaving(true);
        api.put(`/students/${studentId}/enrollment-status`, { status })
            .then(() => load())
            .catch(err => alert(err.response?.data?.detail || 'Failed to update status'))
            .finally(() => setStatusSaving(false));
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#463a7a] mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading profile...</p>
            </div>
        </div>
    );

    if (error || !student) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                <Users size={32} className="text-slate-400" />
            </div>
            <p className="text-slate-500 text-lg font-medium">{error || 'Student not found'}</p>
            <button onClick={() => navigate('/students')}
                className="flex items-center gap-2 px-4 py-2 bg-[#463a7a] text-white rounded-lg font-medium hover:bg-[#342a5b] transition-colors">
                <ArrowLeft size={16} /> Back to Students
            </button>
        </div>
    );

    const initials = `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}`.toUpperCase();
    const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
    const attendancePct = student.performance?.attendance_percentage ?? 0;
    const totalEnrollments = student.enrollments?.length ?? 0;
    const outstanding = student.financial?.outstanding ?? 0;

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Activity },
        { id: 'classes', label: `Classes (${totalEnrollments})`, icon: BookOpen },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'performance', label: 'Performance', icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Breadcrumb bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-2 text-sm sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate('/students')}
                        className="flex items-center gap-1.5 text-slate-500 hover:text-[#463a7a] font-medium transition-colors">
                        <ArrowLeft size={15} /> Students
                    </button>
                    <ChevronRight size={14} className="text-slate-300" />
                    <span className="text-slate-800 font-semibold">{fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                    {(student.enrollment_status || 'active') !== 'dropped' && (
                        <>
                            {(student.enrollment_status || 'active') === 'active' ? (
                                <button onClick={() => changeEnrollmentStatus('on_break')} disabled={statusSaving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-xs font-bold hover:bg-yellow-100 transition-colors disabled:opacity-50">
                                    <Pause size={13} /> Mark On Break
                                </button>
                            ) : (
                                <button onClick={() => changeEnrollmentStatus('active')} disabled={statusSaving}
                                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                    <RotateCcw size={13} /> Mark Active
                                </button>
                            )}
                            <button onClick={() => changeEnrollmentStatus('dropped')} disabled={statusSaving}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50">
                                <UserX size={13} /> Mark Dropped
                            </button>
                        </>
                    )}
                    {student.enrollment_status === 'dropped' && (
                        <button onClick={() => changeEnrollmentStatus('active')} disabled={statusSaving}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50">
                            <RotateCcw size={13} /> Reactivate
                        </button>
                    )}
                    <button onClick={() => setEditOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#463a7a] text-white rounded-lg text-xs font-bold hover:bg-[#342a5b] transition-colors">
                        <Pencil size={13} /> Edit Details
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-5 py-6 space-y-5">
                {/* ── Hero Card ── */}
                <div className="bg-gradient-to-br from-[#463a7a] via-[#3a2f6b] to-[#2d2550] rounded-2xl overflow-hidden shadow-xl">
                    {/* subtle pattern */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0px, transparent 60%)' }} />

                    <div className="p-7 relative">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg">
                                {initials || <GraduationCap size={32} />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h1 className="text-2xl font-black text-white">{fullName || 'Unknown Student'}</h1>
                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border
                                        ${student.enrollment_status === 'dropped'
                                            ? 'bg-red-400/20 text-red-200 border-red-400/30'
                                            : student.enrollment_status === 'on_break'
                                            ? 'bg-yellow-400/20 text-yellow-200 border-yellow-400/30'
                                            : 'bg-emerald-400/20 text-emerald-200 border-emerald-400/30'}`}>
                                        {student.enrollment_status === 'dropped' ? 'Dropped'
                                            : student.enrollment_status === 'on_break' ? 'On Break' : 'Active'}
                                    </span>
                                    {outstanding > 0 && (
                                        <span className="px-2.5 py-1 bg-orange-400/20 text-orange-200 text-xs font-semibold rounded-full border border-orange-400/30 flex items-center gap-1">
                                            <AlertCircle size={11} /> ₹{outstanding.toLocaleString()} Due
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 mt-3">
                                    {student.email && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Mail size={13} className="flex-shrink-0" />
                                            <span className="truncate">{student.email}</span>
                                        </div>
                                    )}
                                    {student.primary_phone_number && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Phone size={13} />
                                            <span>{student.primary_phone_number}</span>
                                        </div>
                                    )}
                                    {student.nearest_vama_center && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <MapPin size={13} />
                                            <span>{student.nearest_vama_center}</span>
                                        </div>
                                    )}
                                    {(student.enrollment_date || student.created_at) && (
                                        <div className="flex items-center gap-2 text-white/75 text-sm">
                                            <Calendar size={13} />
                                            <span>Joined {formatDate(student.enrollment_date || student.created_at)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-4 gap-3 mt-6">
                            {[
                                { label: 'Attendance', value: `${attendancePct}%`, color: attendancePct >= 80 ? 'text-emerald-300' : attendancePct >= 60 ? 'text-yellow-300' : 'text-red-300' },
                                { label: 'Classes', value: totalEnrollments, color: 'text-blue-300' },
                                { label: 'Upcoming', value: student.upcoming_classes?.length ?? 0, color: 'text-purple-300' },
                                { label: 'Outstanding', value: outstanding > 0 ? `₹${outstanding.toLocaleString()}` : 'Nil', color: outstanding > 0 ? 'text-orange-300' : 'text-emerald-300' },
                            ].map(s => (
                                <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-3 text-center border border-white/10">
                                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                                    <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Tab Panel ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="flex overflow-x-auto border-b border-slate-200">
                        {tabs.map(t => <Tab key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} />)}
                    </div>

                    <div className="p-6">
                        {/* ─ Overview ─ */}
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Personal details grid */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Personal Details</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Email', value: student.email, icon: Mail },
                                            { label: 'Phone', value: student.primary_phone_number, icon: Phone },
                                            { label: 'Center', value: student.nearest_vama_center, icon: MapPin },
                                            { label: 'Desired Course', value: student.desired_course, icon: BookOpen },
                                            { label: 'Gender', value: student.gender, icon: Users },
                                            { label: 'Date of Birth', value: formatDate(student.date_of_birth), icon: Calendar },
                                            { label: 'Guardian Email', value: student.guardian_email, icon: Mail },
                                            { label: 'Emergency Contact', value: student.emergency_contact, icon: Phone },
                                            { label: 'Parent Name', value: student.parent_name, icon: Users },
                                            { label: 'City', value: student.city, icon: MapPin },
                                            { label: 'State', value: student.state, icon: MapPin },
                                            { label: 'Class Frequency', value: student.class_frequency, icon: Calendar },
                                            { label: 'Preferred Contact', value: student.preferred_mode_of_contact, icon: Phone },
                                            { label: 'Blood Group', value: student.blood_group, icon: AlertCircle },
                                            { label: 'Allergies', value: student.allergies, icon: AlertCircle },
                                            { label: 'Referrer', value: student.referrer, icon: Users },
                                        ].filter(f => f.value).map(field => (
                                            <div key={field.label} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                <div className="p-2 bg-[#463a7a]/10 rounded-lg flex-shrink-0">
                                                    <field.icon size={14} className="text-[#463a7a]" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs text-slate-400 mb-0.5">{field.label}</div>
                                                    <div className="text-sm font-semibold text-slate-800 truncate">{field.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Attendance summary */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Attendance Overview</h3>
                                    <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-semibold text-slate-700">Overall Attendance</span>
                                            <span className={`text-2xl font-black ${attendancePct >= 80 ? 'text-emerald-600' : attendancePct >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
                                                {attendancePct}%
                                            </span>
                                        </div>
                                        <AttendanceBar rate={attendancePct} />
                                        <div className="mt-2 text-xs text-slate-400">
                                            {attendancePct >= 80 ? 'Excellent attendance — keep it up!' :
                                             attendancePct >= 60 ? 'Attendance needs improvement.' :
                                             'Critical: attendance is below 60%.'}
                                        </div>
                                    </div>
                                </div>

                                {/* Upcoming classes */}
                                {student.upcoming_classes?.length > 0 ? (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Upcoming Classes</h3>
                                        <div className="space-y-2">
                                            {student.upcoming_classes.map(cls => (
                                                <div key={cls.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-500 rounded-lg">
                                                            <Clock className="text-white" size={15} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm">{cls.subject}</div>
                                                            <div className="text-xs text-slate-500">{cls.teacher}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold text-slate-700 text-sm">{formatDate(cls.date)}</div>
                                                        <div className="text-xs text-slate-500">{cls.time}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Clock size={28} className="mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No upcoming classes scheduled</p>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar: mini schedule calendar */}
                            <div className="lg:col-span-1">
                                <MiniScheduleCalendar studentId={studentId} />
                            </div>
                            </div>
                        )}

                        {/* ─ Classes ─ */}
                        {activeTab === 'classes' && (
                            <div className="space-y-4">
                                {student.enrollments?.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>No class enrollments yet</p>
                                    </div>
                                ) : (
                                    student.enrollments.map((en, idx) => (
                                        <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden hover:border-[#463a7a]/30 transition-colors">
                                            <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-200">
                                                <div>
                                                    <h3 className="font-bold text-slate-900">{en.subject}</h3>
                                                    <p className="text-sm text-slate-500 mt-0.5">{en.teacher} · {en.batch}</p>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                        ${en.attendance_rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                          en.attendance_rate >= 60 ? 'bg-yellow-100 text-yellow-700' :
                                                          'bg-red-100 text-red-700'}`}>
                                                        {en.attendance_rate}% attendance
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <div className="grid grid-cols-3 gap-4 mb-4">
                                                    <div className="text-center p-3 bg-slate-50 rounded-lg">
                                                        <div className="text-xl font-black text-slate-800">{en.total_classes}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">Total</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                                        <div className="text-xl font-black text-emerald-600 flex items-center justify-center gap-1">
                                                            <CheckCircle size={16} />{en.attended}
                                                        </div>
                                                        <div className="text-xs text-emerald-600 mt-0.5">Attended</div>
                                                    </div>
                                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                                        <div className="text-xl font-black text-red-500 flex items-center justify-center gap-1">
                                                            <XCircle size={16} />{en.missed}
                                                        </div>
                                                        <div className="text-xs text-red-500 mt-0.5">Missed</div>
                                                    </div>
                                                </div>
                                                <AttendanceBar rate={en.attendance_rate} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ─ Payments ─ */}
                        {activeTab === 'payments' && (
                            <div className="space-y-5">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard label="Total Billed" value={`₹${(student.financial?.total_fees ?? 0).toLocaleString()}`} color="blue" />
                                    <StatCard label="Paid" value={`₹${(student.financial?.fees_paid ?? 0).toLocaleString()}`} color="green" />
                                    <StatCard label="Outstanding" value={`₹${outstanding.toLocaleString()}`} color={outstanding > 0 ? 'orange' : 'green'} />
                                </div>

                                {student.financial?.next_due_date && outstanding > 0 && (
                                    <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                        <AlertCircle className="text-orange-500 flex-shrink-0" size={20} />
                                        <div>
                                            <span className="font-semibold text-orange-900 text-sm">Next payment due: </span>
                                            <span className="text-orange-700 text-sm">{formatDate(student.financial.next_due_date)}</span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">Payment History</h3>
                                    {!student.financial?.payment_history?.length ? (
                                        <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                            <CreditCard size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No payment records found</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {student.financial.payment_history.map(p => (
                                                <div key={p.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-[#463a7a]/40 hover:bg-slate-50 transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${p.status === 'paid' ? 'bg-emerald-100' : p.status === 'overdue' ? 'bg-red-100' : 'bg-orange-100'}`}>
                                                            <CreditCard size={15} className={p.status === 'paid' ? 'text-emerald-600' : p.status === 'overdue' ? 'text-red-600' : 'text-orange-600'} />
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-800 text-sm">{p.type}</div>
                                                            <div className="text-xs text-slate-400">{formatDate(p.date)}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-black text-slate-900">₹{p.amount?.toLocaleString()}</span>
                                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold
                                                            ${p.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                                                              p.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                                              'bg-orange-100 text-orange-700'}`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ─ Performance ─ */}
                        {activeTab === 'performance' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-4">
                                    <StatCard label="Overall Grade" value={student.performance?.overall_grade ?? '—'} color="purple" />
                                    <StatCard label="Attendance" value={`${attendancePct}%`} color={attendancePct >= 80 ? 'green' : 'orange'} />
                                    <StatCard label="Enrolled In" value={`${totalEnrollments} class${totalEnrollments !== 1 ? 'es' : ''}`} color="blue" />
                                </div>

                                {student.performance?.skills_progress?.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Skills Progress</h3>
                                        <div className="space-y-4">
                                            {student.performance.skills_progress.map(skill => (
                                                <div key={skill.skill}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-sm font-semibold text-slate-700">{skill.skill}</span>
                                                        <span className="text-sm font-black text-[#463a7a]">{skill.level}%</span>
                                                    </div>
                                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                                        <div className="bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] h-full rounded-full"
                                                            style={{ width: `${skill.level}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {student.performance?.recent_feedback?.length > 0 ? (
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Recent Feedback</h3>
                                        <div className="space-y-3">
                                            {student.performance.recent_feedback.map((fb, idx) => (
                                                <div key={idx} className="border border-slate-200 rounded-xl p-5 hover:border-[#463a7a]/30 transition-colors">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <div className="font-semibold text-slate-900 text-sm">{fb.subject}</div>
                                                            <div className="text-xs text-slate-500 mt-0.5">{fb.teacher} · {formatDate(fb.date)}</div>
                                                        </div>
                                                        <div className="flex gap-0.5">
                                                            {[1,2,3,4,5].map(n => (
                                                                <Star key={n} size={14}
                                                                    className={n <= (fb.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200 fill-slate-200'} />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-600 text-sm leading-relaxed">{fb.feedback}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                        <Star size={32} className="mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No feedback recorded yet</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <AddStudentDialog
                isOpen={editOpen}
                onClose={() => setEditOpen(false)}
                initialData={student}
                onSubmit={async () => { await load(); }}
            />
        </div>
    );
}
