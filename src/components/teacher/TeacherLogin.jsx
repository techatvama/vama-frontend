import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { BRAND } from '../../lib/brand';
import AuthLayout from '../auth/AuthLayout';
import { Mail, Lock, Loader2, AlertCircle, ArrowRight, Users, BookOpen } from 'lucide-react';

export default function TeacherLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/teacher/login', { email, password });
            localStorage.setItem('teacher', JSON.stringify(response.data.teacher));
            if (response.data.access_token) {
                localStorage.setItem('teacher_token', response.data.access_token);
            }
            if (response.data.refresh_token) {
                localStorage.setItem('teacher_refresh_token', response.data.refresh_token);
            }
            navigate('/teacher-portal');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            portalLabel="Faculty Portal"
            title="Welcome back, teacher."
            subtitle="Sign in to manage your classes and students."
            heroTitle={<>Empowering Educators,<br />Every Step of the Way.</>}
            heroSubtitle="Manage your classes, track student progress, and stay connected with your academy — all in one place."
            stats={[
                { icon: Users, value: '50+', label: 'Faculty Members' },
                { icon: BookOpen, value: '1,000+', label: 'Students Taught' },
            ]}
        >
            <form onSubmit={handleLogin} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                        <AlertCircle size={18} className="shrink-0" />
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" size={18} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
                            placeholder="name@vamaacademy.in"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold hover:underline" style={{ color: BRAND.purple }}>
                        Forgot Password?
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white rounded-xl py-3.5 font-semibold shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: BRAND.orange }}
                >
                    {loading ? (
                        <Loader2 className="animate-spin w-5 h-5" />
                    ) : (
                        <>
                            Sign In <ArrowRight size={18} />
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
