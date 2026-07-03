import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api';
import { PASSWORD_RULES, isPasswordValid } from '../../lib/password';
import { Lock, Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import AuthShell from './AuthShell';

export default function ActivateAccount() {
    const [params] = useSearchParams();
    const token = params.get('token') || '';
    const navigate = useNavigate();

    const [checking, setChecking] = useState(true);
    const [valid, setValid] = useState(false);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) { setChecking(false); setValid(false); return; }
        api.get('/auth/validate-token', { params: { token, purpose: 'activation' } })
            .then((r) => setValid(!!r.data.valid))
            .catch(() => setValid(false))
            .finally(() => setChecking(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!isPasswordValid(password)) { setError('Password does not meet the requirements below.'); return; }
        if (password !== confirm) { setError('Passwords do not match.'); return; }
        setLoading(true);
        try {
            await api.post('/auth/activate', { token, password });
            setDone(true);
        } catch (err) {
            setError(err.response?.data?.detail || 'Activation failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (checking) {
        return <AuthShell title="Activating…" subtitle="Verifying your link">
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-indigo-400" size={40} /></div>
        </AuthShell>;
    }

    if (!valid && !done) {
        return <AuthShell title="Link expired" subtitle="This activation link is invalid or used">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl flex items-center gap-3 text-sm font-bold">
                <AlertCircle size={20} /> This activation link is no longer valid. Ask an admin to resend it, or use “Forgot password”.
            </div>
            <button onClick={() => navigate('/forgot-password')} className="mt-6 w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[28px] py-5 font-black transition-all">
                Request a new link
            </button>
        </AuthShell>;
    }

    if (done) {
        return <AuthShell title="You're all set!" subtitle="Account activated" icon={<CheckCircle2 className="text-emerald-400" />}>
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-5 rounded-2xl flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 size={20} /> Your password is set and your account is active. Sign in to continue.
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
                {[['Student', '/student-login'], ['Teacher', '/teacher-login'], ['Admin', '/admin-login']].map(([label, to]) => (
                    <button key={to} onClick={() => navigate(to)} className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl py-4 font-black text-xs transition-all">
                        {label}
                    </button>
                ))}
            </div>
        </AuthShell>;
    }

    return (
        <AuthShell title="Set your password" subtitle="Activate your VAMA account" icon={<ShieldCheck className="text-yellow-400" />}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-sm font-bold">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}
                <PasswordInput value={password} onChange={setPassword} placeholder="New password" />
                <PasswordInput value={confirm} onChange={setConfirm} placeholder="Confirm password" />

                <ul className="space-y-1.5 px-1">
                    {PASSWORD_RULES.map((r) => {
                        const ok = r.test(password);
                        return (
                            <li key={r.id} className={`flex items-center gap-2 text-xs font-bold ${ok ? 'text-emerald-400' : 'text-white/30'}`}>
                                <CheckCircle2 size={14} /> {r.label}
                            </li>
                        );
                    })}
                </ul>

                <button type="submit" disabled={loading}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-[28px] py-6 font-black text-lg shadow-2xl shadow-indigo-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <Loader2 className="animate-spin" /> : <>ACTIVATE ACCOUNT <ArrowRight size={20} /></>}
                </button>
            </form>
        </AuthShell>
    );
}

function PasswordInput({ value, onChange, placeholder }) {
    return (
        <div className="relative group">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
                type="password" value={value} onChange={(e) => onChange(e.target.value)} required placeholder={placeholder}
                className="w-full bg-white/5 border-2 border-white/5 rounded-[28px] py-5 pl-14 pr-6 text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
            />
        </div>
    );
}
