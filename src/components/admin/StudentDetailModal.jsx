import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    User, Mail, Phone, MapPin, Calendar, CreditCard, BookOpen,
    TrendingUp, Award, Clock, CheckCircle, XCircle, AlertCircle,
    Download, Edit2, X, DollarSign, Users, FileText, RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function StudentDetailModal({ studentId, onClose }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchStudentDetails();
    }, [studentId]);

    const fetchStudentDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(`/admin/student/${studentId}/complete-profile`);
            setStudent(res.data);
        } catch (err) {
            console.error(err);
            setError('Could not load student profile. Please check the backend connection.');
        } finally {
            setLoading(false);
        }
    };

    // ── placeholder to satisfy remaining references in old mock ──────────────
    const generateMockStudentData_UNUSED = () => {
        return {
            id: studentId,
            first_name: 'Sarah',
            last_name: 'Johnson',
            email: 'sarah.johnson@email.com',
            primary_phone_number: '+91 98765 43210',
            address: '123 Music Street, Harmony Colony',
            city: 'Mumbai',
            state: 'Maharashtra',
            date_of_birth: '2010-05-15',
            enrollment_date: '2024-01-15',
            status: 'active',
            financial: {
                total_fees: 48000,
                fees_paid: 36000,
                outstanding: 12000,
                next_due_date: '2026-02-15',
                payment_history: [
                    { id: 1, date: '2026-01-15', amount: 12000, type: 'Monthly Tuition', status: 'paid' },
                    { id: 2, date: '2025-12-15', amount: 12000, type: 'Monthly Tuition', status: 'paid' },
                    { id: 3, date: '2025-11-15', amount: 12000, type: 'Monthly Tuition', status: 'paid' },
                    { id: 4, date: '2026-02-15', amount: 12000, type: 'Monthly Tuition', status: 'pending' }
                ]
            },
            enrollments: [
                {
                    id: 1,
                    subject: 'Piano - Advanced',
                    teacher: 'Michael Chen',
                    batch: 'Evening Batch A',
                    start_date: '2024-01-15',
                    status: 'active',
                    attendance_rate: 92,
                    total_classes: 48,
                    attended: 44,
                    missed: 4
                },
                {
                    id: 2,
                    subject: 'Music Theory',
                    teacher: 'Sarah Williams',
                    batch: 'Theory Group B',
                    start_date: '2024-03-01',
                    status: 'active',
                    attendance_rate: 88,
                    total_classes: 32,
                    attended: 28,
                    missed: 4
                }
            ],

            // Upcoming Classes
            upcoming_classes: [
                {
                    id: 1,
                    subject: 'Piano - Advanced',
                    date: '2026-02-08',
                    time: '16:00 - 17:00',
                    teacher: 'Michael Chen',
                    location: 'Room 101'
                },
                {
                    id: 2,
                    subject: 'Music Theory',
                    date: '2026-02-10',
                    time: '14:00 - 15:00',
                    teacher: 'Sarah Williams',
                    location: 'Room 205'
                }
            ],

            // Performance Data
            performance: {
                overall_grade: 'A',
                attendance_percentage: 91,
                progression_rate: 'Excellent',
                recent_feedback: [
                    {
                        date: '2026-02-01',
                        teacher: 'Michael Chen',
                        subject: 'Piano - Advanced',
                        feedback: 'Excellent progress on Chopin Nocturne. Working on dynamics and expression.',
                        rating: 5
                    },
                    {
                        date: '2026-01-28',
                        teacher: 'Sarah Williams',
                        subject: 'Music Theory',
                        feedback: 'Strong understanding of chord progressions. Needs more practice on key signatures.',
                        rating: 4
                    }
                ],
                skills_progress: [
                    { skill: 'Technical Skills', level: 85 },
                    { skill: 'Sight Reading', level: 78 },
                    { skill: 'Music Theory', level: 82 },
                    { skill: 'Performance', level: 88 }
                ]
            }
        };
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                <div className="bg-white rounded-3xl max-w-sm w-full p-8 text-center shadow-2xl">
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={24} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Profile Unavailable</h3>
                    <p className="text-sm text-slate-500 mb-6">{error || 'Student data could not be loaded.'}</p>
                    <div className="flex gap-3">
                        <button onClick={fetchStudentDetails} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#463a7a] text-white rounded-xl text-sm font-semibold hover:bg-[#3a3068] transition-colors">
                            <RefreshCw size={14} /> Retry
                        </button>
                        <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
            <div className="bg-white rounded-[40px] max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl my-4">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-8 relative overflow-hidden">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 text-white/80 hover:text-white transition-colors z-10"
                    >
                        <X size={24} />
                    </button>

                    <div className="flex items-start gap-6">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-black text-3xl border-4 border-white/30">
                            {student.first_name[0]}{student.last_name[0]}
                        </div>

                        {/* Student Info */}
                        <div className="flex-1">
                            <h1 className="text-4xl font-black text-white mb-2">
                                {student.first_name} {student.last_name}
                            </h1>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div className="flex items-center gap-2 text-white/90">
                                    <Mail size={16} />
                                    <span className="text-sm">{student.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/90">
                                    <Phone size={16} />
                                    <span className="text-sm">{student.primary_phone_number}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/90">
                                    <Calendar size={16} />
                                    <span className="text-sm">Joined: {format(parseISO(student.enrollment_date), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-white/90">
                                    <User size={16} />
                                    <span className="text-sm capitalize">{student.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="flex gap-3">
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px]">
                                <div className="text-3xl font-black text-white">{student.performance.attendance_percentage}%</div>
                                <div className="text-xs text-white/80 mt-1">Attendance</div>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center min-w-[100px]">
                                <div className="text-3xl font-black text-white">{student.performance.overall_grade}</div>
                                <div className="text-xs text-white/80 mt-1">Grade</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-slate-200 bg-slate-50">
                    <div className="flex gap-2 px-8">
                        {[
                            { id: 'overview', label: 'Overview', icon: User },
                            { id: 'classes', label: 'Classes', icon: BookOpen },
                            { id: 'payments', label: 'Payments', icon: CreditCard },
                            { id: 'performance', label: 'Performance', icon: TrendingUp }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  flex items-center gap-2 px-6 py-4 font-semibold transition-all border-b-4
                  ${activeTab === tab.id
                                        ? 'border-[#463a7a] text-[#463a7a] bg-white'
                                        : 'border-transparent text-slate-500 hover:text-slate-700'}
                `}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto max-h-[calc(95vh-300px)]">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Financial Summary */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border-2 border-emerald-200">
                                <h3 className="text-xl font-black text-emerald-900 mb-4 flex items-center gap-2">
                                    <DollarSign size={24} />
                                    Financial Summary
                                </h3>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-emerald-700 mb-1">Total Fees</div>
                                        <div className="text-2xl font-black text-emerald-900">
                                            ₹{student.financial.total_fees.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-emerald-700 mb-1">Paid</div>
                                        <div className="text-2xl font-black text-emerald-600">
                                            ₹{student.financial.fees_paid.toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-orange-700 mb-1">Outstanding</div>
                                        <div className="text-2xl font-black text-orange-600">
                                            ₹{student.financial.outstanding.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {student.financial.outstanding > 0 && (
                                    <div className="mt-4 p-3 bg-orange-100 rounded-2xl flex items-center gap-2">
                                        <AlertCircle className="text-orange-600" size={20} />
                                        <span className="text-sm font-semibold text-orange-900">
                                            Next payment due: {format(parseISO(student.financial.next_due_date), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Current Enrollments */}
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-4">Current Enrollments</h3>
                                <div className="grid gap-4">
                                    {student.enrollments.map(enrollment => (
                                        <div key={enrollment.id} className="border-2 border-slate-200 rounded-3xl p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h4 className="text-lg font-bold text-slate-900">{enrollment.subject}</h4>
                                                    <p className="text-sm text-slate-600">Teacher: {enrollment.teacher}</p>
                                                    <p className="text-sm text-slate-600">Batch: {enrollment.batch}</p>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-[#463a7a]">
                                                        {enrollment.attendance_rate}%
                                                    </div>
                                                    <div className="text-xs text-slate-500">Attendance</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-6 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="text-emerald-500" size={16} />
                                                    <span>{enrollment.attended} attended</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <XCircle className="text-red-500" size={16} />
                                                    <span>{enrollment.missed} missed</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="text-blue-500" size={16} />
                                                    <span>{enrollment.total_classes} total classes</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Upcoming Classes */}
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-4">Upcoming Classes</h3>
                                <div className="space-y-3">
                                    {student.upcoming_classes.map(cls => (
                                        <div key={cls.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-500 rounded-xl">
                                                    <Clock className="text-white" size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{cls.subject}</div>
                                                    <div className="text-sm text-slate-600">{cls.teacher} • {cls.location}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-semibold text-slate-900">{format(parseISO(cls.date), 'MMM d, EEE')}</div>
                                                <div className="text-sm text-slate-600">{cls.time}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Classes Tab */}
                    {activeTab === 'classes' && (
                        <div className="space-y-6">
                            {student.enrollments.map(enrollment => (
                                <div key={enrollment.id} className="border-2 border-slate-200 rounded-3xl p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-slate-900">{enrollment.subject}</h3>
                                            <p className="text-slate-600">Batch: {enrollment.batch}</p>
                                        </div>
                                        <span className={`px-4 py-2 rounded-full font-semibold ${enrollment.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {enrollment.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        <div className="bg-slate-50 rounded-2xl p-4">
                                            <div className="text-sm text-slate-600 mb-1">Total Classes</div>
                                            <div className="text-2xl font-black text-slate-900">{enrollment.total_classes}</div>
                                        </div>
                                        <div className="bg-emerald-50 rounded-2xl p-4">
                                            <div className="text-sm text-emerald-700 mb-1">Attended</div>
                                            <div className="text-2xl font-black text-emerald-600">{enrollment.attended}</div>
                                        </div>
                                        <div className="bg-red-50 rounded-2xl p-4">
                                            <div className="text-sm text-red-700 mb-1">Missed</div>
                                            <div className="text-2xl font-black text-red-600">{enrollment.missed}</div>
                                        </div>
                                        <div className="bg-blue-50 rounded-2xl p-4">
                                            <div className="text-sm text-blue-700 mb-1">Attendance</div>
                                            <div className="text-2xl font-black text-blue-600">{enrollment.attendance_rate}%</div>
                                        </div>
                                    </div>

                                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all"
                                            style={{ width: `${enrollment.attendance_rate}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-200">
                                    <div className="text-sm text-blue-700 mb-2">Total Fees</div>
                                    <div className="text-3xl font-black text-blue-900">
                                        ₹{student.financial.total_fees.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-emerald-50 rounded-3xl p-6 border-2 border-emerald-200">
                                    <div className="text-sm text-emerald-700 mb-2">Paid</div>
                                    <div className="text-3xl font-black text-emerald-600">
                                        ₹{student.financial.fees_paid.toLocaleString()}
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-3xl p-6 border-2 border-orange-200">
                                    <div className="text-sm text-orange-700 mb-2">Outstanding</div>
                                    <div className="text-3xl font-black text-orange-600">
                                        ₹{student.financial.outstanding.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-xl font-black text-slate-900 mb-4">Payment History</h3>

                            <div className="space-y-3">
                                {student.financial.payment_history.map(payment => (
                                    <div key={payment.id} className="flex items-center justify-between p-4 border-2 border-slate-200 rounded-2xl hover:border-[#463a7a] transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${payment.status === 'paid' ? 'bg-emerald-100' : 'bg-orange-100'
                                                }`}>
                                                <CreditCard className={payment.status === 'paid' ? 'text-emerald-600' : 'text-orange-600'} size={20} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{payment.type}</div>
                                                <div className="text-sm text-slate-600">{format(parseISO(payment.date), 'MMM d, yyyy')}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div className="text-xl font-black text-slate-900">
                                                ₹{payment.amount.toLocaleString()}
                                            </div>
                                            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${payment.status === 'paid'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {payment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Performance Tab */}
                    {activeTab === 'performance' && (
                        <div className="space-y-6">
                            {/* Skills Progress */}
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-4">Skills Progress</h3>
                                <div className="space-y-4">
                                    {student.performance.skills_progress.map(skill => (
                                        <div key={skill.skill}>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-semibold text-slate-700">{skill.skill}</span>
                                                <span className="text-lg font-black text-[#463a7a]">{skill.level}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] h-full rounded-full transition-all"
                                                    style={{ width: `${skill.level}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent Feedback */}
                            <div>
                                <h3 className="text-xl font-black text-slate-900 mb-4">Recent Feedback</h3>
                                <div className="space-y-4">
                                    {student.performance.recent_feedback.map((feedback, idx) => (
                                        <div key={idx} className="border-2 border-slate-200 rounded-3xl p-6">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="font-bold text-slate-900">{feedback.subject}</div>
                                                    <div className="text-sm text-slate-600">
                                                        {feedback.teacher} • {format(parseISO(feedback.date), 'MMM d, yyyy')}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    {[...Array(feedback.rating)].map((_, i) => (
                                                        <span key={i} className="text-yellow-500">⭐</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-700 leading-relaxed">{feedback.feedback}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="border-t border-slate-200 p-6 bg-slate-50 flex gap-4">
                    <button className="flex-1 px-6 py-4 rounded-full bg-white border-2 border-slate-300 font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                        <Download size={18} />
                        Download Report
                    </button>

                    <button className="flex-1 px-6 py-4 rounded-full bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] text-white font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2">
                        <Edit2 size={18} />
                        Edit Student
                    </button>

                    <button
                        onClick={onClose}
                        className="px-6 py-4 rounded-full bg-slate-700 text-white font-semibold hover:bg-slate-800 transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
