import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { api } from '../../lib/api';
import { PASSWORD_RULES, isPasswordValid } from '../../lib/password';
import { Lock, Loader2, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { BRAND } from '../../lib/brand';
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
            <div className="flex justify-center py-12"><Loader2 className="animate-spin" style={{ color: BRAND.purple }} size={36} /></div>
        </AuthShell>;
    }

    if (!valid && !done) {
        return <AuthShell title="Link expired" subtitle="This activation link is invalid or used">
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                <AlertCircle size={18} className="shrink-0" /> This activation link is no longer valid. Ask an admin to resend it, or use "Forgot password".
            </div>
            <button onClick={() => navigate('/forgot-password')} className="mt-6 w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl py-3.5 font-semibold transition-all">
                Request a new link
            </button>
        </AuthShell>;
    }

    if (done) {
        return <AuthShell title="You're all set!" subtitle="Account activated" icon={<CheckCircle2 size={22} className="text-emerald-600" />}>
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 size={18} className="shrink-0" /> Your password is set and your account is active. Sign in to continue.
            </div>
            <div className="grid grid-cols-3 gap-3 mt-6">
                {[['Student', '/student-login'], ['Teacher', '/teacher-login'], ['Admin', '/admin-login']].map(([label, to]) => (
                    <button
                        key={to}
                        onClick={() => navigate(to)}
                        className="rounded-xl py-3 font-semibold text-xs transition-opacity hover:opacity-90"
                        style={{ backgroundColor: '#EDEBF5', color: BRAND.purple }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </AuthShell>;
    }

    return (
        <AuthShell title="Set your password" subtitle="Activate your VAMA account" icon={<ShieldCheck size={22} />}>
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 text-sm font-medium">
                        <AlertCircle size={18} className="shrink-0" /> {error}
                    </div>
                )}
                <PasswordInput value={password} onChange={setPassword} placeholder="New password" />
                <PasswordInput value={confirm} onChange={setConfirm} placeholder="Confirm password" />

                <ul className="space-y-1.5 px-1">
                    {PASSWORD_RULES.map((r) => {
                        const ok = r.test(password);
                        return (
                            <li key={r.id} className={`flex items-center gap-2 text-xs font-medium ${ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                                <CheckCircle2 size={14} /> {r.label}
                            </li>
                        );
                    })}
                </ul>

                <button type="submit" disabled={loading}
                    className="w-full text-white rounded-xl py-3.5 font-semibold shadow-lg transition-opacity hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: BRAND.orange }}>
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <>Activate Account <ArrowRight size={18} /></>}
                </button>
            </form>
        </AuthShell>
    );
}

function PasswordInput({ value, onChange, placeholder }) {
    return (
        <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
                type="password" value={value} onChange={(e) => onChange(e.target.value)} required placeholder={placeholder}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#463A7A]/15 focus:border-[#463A7A]/40 transition-all"
            />
        </div>
    );
}
