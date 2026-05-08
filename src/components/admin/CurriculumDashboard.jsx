import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import {
    BookOpen,
    Award,
    Users,
    Calendar,
    TrendingUp,
    Plus,
    Settings,
    FileText,
    Target,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router';

export default function CurriculumDashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard/stats');
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
            <Loader2 className="w-10 h-10 text-[#463a7a] animate-spin" />
        </div>
    );

    const quickActions = [
        {
            title: 'Manage Subjects',
            description: 'Add, edit, or remove subjects',
            icon: BookOpen,
            color: 'from-indigo-500 to-purple-600',
            path: '/admin/subjects'
        },
        {
            title: 'Manage Grades',
            description: 'Configure grade levels',
            icon: Award,
            color: 'from-emerald-500 to-teal-600',
            path: '/admin/grades'
        },
        {
            title: 'Exam Sessions',
            description: 'Create and manage exams',
            icon: FileText,
            color: 'from-orange-500 to-red-600',
            path: '/admin/exams'
        },
        {
            title: 'Teacher Assignments',
            description: 'Assign teachers to subjects',
            icon: Users,
            color: 'from-blue-500 to-cyan-600',
            path: '/admin/teacher-assignments'
        },
        {
            title: 'Syllabus Builder',
            description: 'Build curriculum structure',
            icon: Target,
            color: 'from-violet-500 to-purple-600',
            path: '/admin/syllabus'
        }
    ];

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                    <TrendingUp className="w-96 h-96 text-white" />
                </div>

                <div className="relative z-10">
                    <h1 className="text-4xl lg:text-6xl font-black text-white tracking-tighter leading-none mb-4">
                        Curriculum<br />
                        <span className="text-indigo-300">Management</span>
                    </h1>
                    <p className="text-indigo-100/60 font-medium text-lg max-w-2xl">
                        Manage subjects, grades, syllabi, and exam sessions from one central dashboard
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6">
                        <BookOpen className="text-[#463a7a]" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {stats?.total_subjects || 0}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Subjects</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-emerald-100 rounded-3xl flex items-center justify-center mb-6">
                        <Award className="text-emerald-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {stats?.total_grades || 0}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Grade Levels</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-orange-100 rounded-3xl flex items-center justify-center mb-6">
                        <Calendar className="text-orange-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {stats?.active_exams || 0}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Exams</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-blue-100 rounded-3xl flex items-center justify-center mb-6">
                        <Users className="text-blue-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {stats?.total_teachers || 0}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Teachers</p>
                </div>

                <div className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100">
                    <div className="w-14 h-14 bg-purple-100 rounded-3xl flex items-center justify-center mb-6">
                        <Users className="text-purple-600" size={28} />
                    </div>
                    <p className="text-3xl font-black text-slate-900 leading-none mb-2">
                        {stats?.total_students || 0}
                    </p>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Students</p>
                </div>

                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[40px] p-8 shadow-xl text-white">
                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/10">
                        <Target className="text-yellow-400" size={28} />
                    </div>
                    <p className="text-3xl font-black leading-none mb-2">
                        {stats?.teacher_assignments || 0}
                    </p>
                    <p className="text-xs font-black text-indigo-200/60 uppercase tracking-widest">Assignments</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter px-2">
                    QUICK ACTIONS
                </h2>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={index}
                                onClick={() => navigate(action.path)}
                                className="bg-white rounded-[40px] p-8 shadow-xl border border-slate-100 hover:border-[#463a7a] transition-all group text-left"
                            >
                                <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-3xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <Icon className="text-white" size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-[#463a7a] transition-colors">
                                    {action.title}
                                </h3>
                                <p className="text-sm text-slate-500 font-medium">
                                    {action.description}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Info Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[40px] p-8 border border-indigo-100">
                <div className="flex items-start gap-6">
                    <div className="w-14 h-14 bg-indigo-200 rounded-3xl flex items-center justify-center flex-shrink-0">
                        <FileText className="text-indigo-700" size={28} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-indigo-900 mb-2 uppercase tracking-tight">
                            Getting Started
                        </h3>
                        <p className="text-sm text-indigo-700 leading-relaxed font-medium mb-4">
                            Start by creating subjects and grade levels. Then build your syllabus structure, assign teachers, and create exam sessions. The system will automatically enforce rules and track progress.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/admin/subjects')}
                                className="px-6 py-3 bg-[#463a7a] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                            >
                                Create Subject
                            </button>
                            <button
                                onClick={() => navigate('/admin/grades')}
                                className="px-6 py-3 bg-white border border-indigo-200 text-[#463a7a] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all"
                            >
                                Create Grade
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
