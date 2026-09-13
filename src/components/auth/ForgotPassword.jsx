import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../../lib/api';
import { Mail, Loader2, AlertCircle, MailCheck, ArrowLeft, KeyRound } from 'lucide-react';
import { BRAND } from '../../lib/brand';
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
            <AuthShell title="Check your email" subtitle="Reset link sent" icon={<MailCheck size={22} />}>
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl text-sm font-medium">
                    If an account exists for <span className="font-bold text-emerald-900">{email}</span>, a password reset link has been sent. It expires in 60 minutes.
                </div>
                <button onClick={() => navigate(-1)} className="mt-6 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition-all">
                    <ArrowLeft size={18} /> Back to login
                </button>
            </AuthShell>
        );
    }

    return (
        <AuthShell title="Forgot password?" subtitle="We'll email you a reset link" icon={<KeyRound size={22} />}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                        <AlertCircle size={18} className="shrink-0" /> {error}
                    </div>
                )}
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Your registered email"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
                    />
                </div>
                <button type="submit" disabled={loading}
                    className="w-full text-white rounded-xl py-3.5 font-semibold shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: BRAND.orange }}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : 'Send Reset Link'}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="w-full text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center justify-center gap-2 pt-1">
                    <ArrowLeft size={15} /> Back to login
                </button>
            </form>
        </AuthShell>
    );
}
