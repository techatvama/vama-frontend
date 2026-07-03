import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { Mail, Loader2, AlertCircle, MailCheck, ArrowLeft, KeyRound } from 'lucide-react';
import AuthShell from './AuthShell';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            // Always returns a generic message — never reveals whether the email exists.
            await api.post('/auth/forgot-password', { email });
            setSent(true);
        } catch (err) {
            // Rate-limit (429) is the only error surfaced; otherwise still show generic success.
            if (err.response?.status === 429) setError(err.response.data.detail);
            else setSent(true);
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <AuthShell title="Check your email" subtitle="Reset link sent" icon={<MailCheck className="text-emerald-400" />}>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-5 rounded-2xl text-sm font-bold">
                    If an account exists for <span className="text-white">{email}</span>, a password reset link has been sent. It expires in 60 minutes.
                </div>
                <button onClick={() => navigate(-1)} className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[28px] py-5 font-black flex items-center justify-center gap-2 transition-all">
                    <ArrowLeft size={18} /> Back to login
                </button>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Forgot password?" subtitle="We'll email you a reset link" icon={<KeyRound className="text-yellow-400" />}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}
                <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
                    <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Your registered email"
                        className="w-full bg-white/5 border-2 border-white/5 rounded-[28px] py-5 pl-14 pr-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                    />
                </div>
                <button type="submit" disabled={loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-[28px] py-6 font-black text-lg shadow-2xl shadow-indigo-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : 'SEND RESET LINK'}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="w-full text-white/40 hover:text-white text-xs font-bold flex items-center justify-center gap-2 pt-2">
                    <ArrowLeft size={16} /> Back to login
                </button>
            </form>
        </AuthShell>
    );
}
