import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import { BRAND } from '../../lib/brand';
import AuthLayout from '../auth/AuthLayout';
import { Loader2, Eye, EyeOff, ShieldCheck, Building2, ArrowRight, Users } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw]     = useState(false);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');
    const { login }               = useAdmin();
    const navigate                = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const res = await api.post('/admin/login', { email, password });
            if (res.data.access_token) {
                localStorage.setItem('admin_token', res.data.access_token);
            }
            if (res.data.refresh_token) {
                localStorage.setItem('admin_refresh_token', res.data.refresh_token);
            }
            login(res.data.admin);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            portalLabel="Admin Portal"
            title="Sign in to Optimus."
            subtitle="Super admin & center admin accounts only."
            heroTitle={<>Run Your Academy,<br />Effortlessly.</>}
            heroSubtitle="Oversee students, faculty, billing, and every center — all from one powerful dashboard."
            stats={[
                { icon: Building2, value: '10+', label: 'Academy Centers' },
                { icon: Users, value: '1,000+', label: 'Students Managed' },
            ]}
            footer={
                <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
                    <Building2 size={13} />
                    Academy &amp; center administration
                </p>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Email</label>
                    <input
                        type="email" required value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@vama.academy"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Password</label>
                    <div className="relative">
                        <input
                            type={showPw ? 'text' : 'password'} required value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
                        />
                        <button type="button" onClick={() => setShowPw(v => !v)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                            {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <div className="flex justify-end">
                    <button type="button" onClick={() => navigate('/forgot-password')} className="text-xs font-semibold hover:underline" style={{ color: BRAND.purple }}>
                        Forgot Password?
                    </button>
                </div>

                <button type="submit" disabled={loading}
                    className="w-full py-3.5 text-white rounded-xl font-semibold shadow-lg transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ backgroundColor: BRAND.orange }}>
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    {loading ? 'Signing in…' : 'Sign In'}
                    {!loading && <ArrowRight size={18} />}
                </button>
            </form>
        </AuthLayout>
    );
}
