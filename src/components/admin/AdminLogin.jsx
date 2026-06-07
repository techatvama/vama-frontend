import { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { useAdmin } from '../../context/AdminContext';
import { Loader2, Eye, EyeOff, Zap, Building2, ShieldCheck } from 'lucide-react';

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
            login(res.data.admin);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#2d2550] via-[#463a7a] to-[#1a1535] flex items-center justify-center p-4">
            {/* Background circles */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative w-full max-w-sm">
                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-8 pt-10 pb-8 text-center">
                        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Zap size={28} className="text-white fill-current" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Vama Optimus</h1>
                        <p className="text-white/50 text-sm mt-1">Admin Portal</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Email</label>
                            <input
                                type="email" required value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="admin@vama.academy"
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a]/40 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                            <div className="relative">
                                <input
                                    type={showPw ? 'text' : 'password'} required value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 pr-11 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a]/40 transition-all"
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium">
                                {error}
                            </div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-[#463a7a] hover:bg-[#342a5b] text-white rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#463a7a]/30">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>

                        <div className="flex items-center gap-2 justify-center text-xs text-slate-400 pt-1">
                            <Building2 size={12} />
                            <span>Super Admin & Center Admin accounts only</span>
                        </div>
                    </form>
                </div>

                <p className="text-center text-white/30 text-xs mt-6">
                    Teacher login → <a href="/teacher-login" className="underline hover:text-white/60">/teacher-login</a>
                    &nbsp;·&nbsp; Student login → <a href="/student-login" className="underline hover:text-white/60">/student-login</a>
                </p>
            </div>
        </div>
    );
}
