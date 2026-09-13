import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { BRAND } from '../../lib/brand';
import AuthLayout from '../auth/AuthLayout';
import {
    ArrowRight,
    Mail,
    Lock,
    Loader2,
    AlertCircle,
    Star,
    Users,
} from 'lucide-react';

export default function StudentLogin() {
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
            const response = await api.post('/student/login', { email, password });
            localStorage.setItem('student', JSON.stringify(response.data.student));
            if (response.data.access_token) {
                localStorage.setItem('student_token', response.data.access_token);
            }
            if (response.data.refresh_token) {
                localStorage.setItem('student_refresh_token', response.data.refresh_token);
            }
            navigate('/student-portal');
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            portalLabel="Student Portal"
            title="Welcome back."
            subtitle="Sign in with your VAMA Academy credentials."
            heroTitle={<>One Platform for Your<br />Entire VAMA Journey.</>}
            heroSubtitle="Schedule, progress, payments, and everything that matters — all in one place, powered by Optimus."
            stats={[
                { icon: Star, value: '4.8', label: 'Student Rating' },
                { icon: Users, value: '1,000+', label: 'Active Students' },
            ]}
            footer={
                <p className="text-slate-500">
                    New to VAMA Academy?{' '}
                    <a href="/apply" className="font-semibold hover:underline" style={{ color: BRAND.orange }}>
                        Book a free trial class
                    </a>
                </p>
            }
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
                            placeholder="you@example.com"
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
