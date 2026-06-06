import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import {
    CreditCard, CheckCircle2, Clock, AlertCircle, Download,
    ArrowRight, Zap, Bell, Package, Activity, RefreshCw,
    ChevronRight, Star, Shield, Sparkles, Lock, X,
    BadgeCheck, CalendarDays, Layers, Music
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

// ─── Load Razorpay script once ────────────────────────────────────────────────
function useRazorpay() {
    const [ready, setReady] = useState(!!window.Razorpay);
    useEffect(() => {
        if (window.Razorpay) { setReady(true); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setReady(true);
        document.body.appendChild(script);
    }, []);
    return ready;
}

// ─── Mock fallback data ───────────────────────────────────────────────────────
function mockPackages(grade, course) {
    const all = [
        { id: 1, name: 'Debut Starter', applicable_grades: ['Debut'], applicable_courses: ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums', 'Keyboard', 'Flute', 'Tabla'], validity_days: 30, total_sessions: 8, makeup_sessions: 1, price: 4500, tax_percentage: 18, total_with_tax: 5310, description: 'Perfect start for new learners' },
        { id: 2, name: 'Monthly Pro', applicable_grades: ['Grade 1', 'Grade 2', 'Grade 3'], applicable_courses: ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums'], validity_days: 30, total_sessions: 12, makeup_sessions: 2, price: 6500, tax_percentage: 18, total_with_tax: 7670, description: 'Most popular — great for active learners' },
        { id: 3, name: 'Quarterly Elite', applicable_grades: ['Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'], applicable_courses: ['Piano', 'Violin', 'Vocals', 'Guitar'], validity_days: 90, total_sessions: 36, makeup_sessions: 4, price: 17500, tax_percentage: 18, total_with_tax: 20650, description: 'Best value — save 10% vs monthly' },
        { id: 4, name: 'Half-Year Premium', applicable_grades: ['Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'], applicable_courses: ['Piano', 'Violin', 'Guitar', 'Vocals'], validity_days: 180, total_sessions: 72, makeup_sessions: 6, price: 32000, tax_percentage: 18, total_with_tax: 37760, description: 'Serious learners — dedicated progress' },
        { id: 5, name: 'Annual Gold', applicable_grades: ['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'], applicable_courses: ['Piano', 'Violin', 'Guitar', 'Vocals', 'Drums'], validity_days: 365, total_sessions: 144, makeup_sessions: 12, price: 58000, tax_percentage: 18, total_with_tax: 68440, description: 'Full-year commitment — maximum savings' },
        { id: 6, name: 'Beginner Trial', applicable_grades: ['Debut', 'Grade 1'], applicable_courses: ['Piano', 'Guitar', 'Violin', 'Vocals', 'Drums', 'Keyboard', 'Flute', 'Tabla'], validity_days: 14, total_sessions: 4, makeup_sessions: 0, price: 1500, tax_percentage: 0, total_with_tax: 1500, description: 'Try before you commit — 2 weeks trial' },
    ];
    return all.filter(p => {
        const gradeOk = p.applicable_grades.length === 0 || p.applicable_grades.includes(grade);
        const courseOk = p.applicable_courses.length === 0 || p.applicable_courses.includes(course);
        return gradeOk && courseOk;
    });
}

function mockStudentData() {
    const now = new Date();
    return {
        active_package: {
            id: 2, name: 'Monthly Pro', sessions_total: 12, sessions_used: 8,
            makeup_sessions: 2, makeup_used: 1,
            validity_until: addDays(now, 22).toISOString(),
            start_date: addDays(now, -8).toISOString(), price: 6500,
        },
        attendance_timeline: Array.from({ length: 8 }, (_, i) => ({
            date: addDays(now, -(i * 3 + 1)).toISOString(),
            status: ['present', 'present', 'present', 'absent', 'present', 'present', 'late', 'present'][i],
            session_number: 8 - i,
            topic: ['Scales & Arpeggios', 'Sight Reading', 'Exam Piece A', 'Ear Training', 'Exam Piece B', 'Improvisation', 'Theory', 'Warm Up'][i],
        })),
        invoices: [
            { id: 1, invoice_number: 'INV-04987', amount: 6500, tax_amount: 1170, discount_amount: 0, total_amount: 7670, status: 'paid', payment_type: 'Monthly Pro', issue_date: addDays(now, -30).toISOString(), due_date: addDays(now, -25).toISOString(), paid_date: addDays(now, -27).toISOString() },
            { id: 2, invoice_number: 'INV-04988', amount: 6500, tax_amount: 1170, discount_amount: 500, total_amount: 7170, status: 'paid', payment_type: 'Monthly Pro', issue_date: addDays(now, -60).toISOString(), due_date: addDays(now, -55).toISOString(), paid_date: addDays(now, -57).toISOString() },
        ],
        upcoming_renewals: [{ plan: 'Monthly Pro', amount: 7670, due_date: addDays(now, 22).toISOString(), sessions: 12 }],
    };
}

// ─── Ring chart ───────────────────────────────────────────────────────────────
function Ring({ pct, size = 96, stroke = 9, color = '#463a7a' }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (Math.min(pct, 100) / 100) * circ;
    const c = pct >= 90 ? '#ef4444' : pct >= 70 ? '#f59e0b' : color;
    return (
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90 absolute inset-0">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    style={{ transition: 'stroke-dasharray 0.7s ease' }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-900 leading-none">{pct}%</span>
                <span className="text-[9px] font-bold text-slate-400 mt-0.5">used</span>
            </div>
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const styles = {
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        pending: 'bg-blue-50 text-blue-700 border-blue-100',
        overdue: 'bg-red-50 text-red-600 border-red-100',
    };
    const icons = { paid: <CheckCircle2 size={10} />, pending: <Clock size={10} />, overdue: <AlertCircle size={10} /> };
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || styles.pending}`}>
            {icons[status]}{status}
        </span>
    );
}

// ─── Package card ─────────────────────────────────────────────────────────────
function PackageCard({ pkg, isActive, onSelect, highlight }) {
    const perSession = Math.round(pkg.price / pkg.total_sessions);
    const months = Math.round(pkg.validity_days / 30);
    const badges = highlight ? ['Most Popular'] : months >= 6 ? ['Best Value'] : months >= 3 ? ['Save 10%'] : [];

    return (
        <button
            onClick={() => onSelect(pkg)}
            className={`w-full text-left rounded-[28px] border-2 p-5 transition-all group relative overflow-hidden
                ${isActive
                    ? 'border-[#463a7a] bg-gradient-to-br from-[#463a7a]/5 to-violet-50 shadow-xl shadow-[#463a7a]/10'
                    : 'border-slate-100 bg-white hover:border-[#463a7a]/40 hover:shadow-lg shadow-sm'
                }`}
        >
            {/* Badge */}
            {(isActive || badges.length > 0) && (
                <div className="absolute top-4 right-4 flex gap-1.5">
                    {isActive && (
                        <span className="bg-[#463a7a] text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                            <BadgeCheck size={9} /> Current
                        </span>
                    )}
                    {badges.map(b => (
                        <span key={b} className="bg-amber-400 text-white text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                            {b}
                        </span>
                    ))}
                </div>
            )}

            <div className="mb-3 pr-16">
                <h3 className="text-base font-black text-slate-900 leading-tight">{pkg.name}</h3>
                {pkg.description && <p className="text-xs font-medium text-slate-400 mt-0.5">{pkg.description}</p>}
            </div>

            {/* Price row */}
            <div className="flex items-baseline gap-2 mb-4">
                <span className="text-2xl font-black text-[#463a7a]">₹{pkg.price.toLocaleString('en-IN')}</span>
                {pkg.tax_percentage > 0 && (
                    <span className="text-xs font-bold text-slate-400">+ {pkg.tax_percentage}% GST = <span className="text-slate-700 font-black">₹{pkg.total_with_tax.toLocaleString('en-IN')}</span></span>
                )}
            </div>

            {/* Stats pills */}
            <div className="flex flex-wrap gap-2 mb-4">
                {[
                    { icon: <Activity size={11} />, label: `${pkg.total_sessions} sessions` },
                    { icon: <CalendarDays size={11} />, label: months === 1 ? '1 month' : `${months} months` },
                    { icon: <RefreshCw size={11} />, label: `${pkg.makeup_sessions} makeup` },
                ].map((s, i) => (
                    <span key={i} className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold ${isActive ? 'bg-[#463a7a]/10 text-[#463a7a]' : 'bg-slate-100 text-slate-600'}`}>
                        {s.icon}{s.label}
                    </span>
                ))}
            </div>

            {/* Per session cost */}
            <div className={`flex items-center justify-between pt-3 border-t ${isActive ? 'border-[#463a7a]/10' : 'border-slate-100'}`}>
                <span className="text-[11px] font-bold text-slate-400">₹{perSession}/session</span>
                <span className={`text-xs font-black uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-2xl transition-all
                    ${isActive
                        ? 'bg-[#463a7a] text-white'
                        : 'bg-slate-900 text-white group-hover:bg-[#463a7a]'
                    }`}>
                    {isActive ? 'Renew' : 'Subscribe'} <ArrowRight size={12} />
                </span>
            </div>
        </button>
    );
}

// ─── Payment confirmation modal ───────────────────────────────────────────────
function ConfirmModal({ pkg, student, onPay, onClose, paying }) {
    if (!pkg) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white w-full sm:max-w-sm rounded-t-[36px] sm:rounded-[36px] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] px-6 pt-7 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Confirm Payment</p>
                            <h3 className="text-xl font-black text-white leading-tight">{pkg.name}</h3>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-white/70 hover:text-white mt-1">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    {/* Package summary */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { label: 'Sessions', val: pkg.total_sessions },
                            { label: 'Duration', val: `${Math.round(pkg.validity_days / 30)}m` },
                            { label: 'Makeup', val: pkg.makeup_sessions },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-3 text-center">
                                <p className="text-lg font-black text-slate-900">{s.val}</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Amount breakdown */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-500">Base price</span>
                            <span className="font-black text-slate-900">₹{pkg.price.toLocaleString('en-IN')}</span>
                        </div>
                        {pkg.tax_percentage > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="font-medium text-slate-500">GST ({pkg.tax_percentage}%)</span>
                                <span className="font-black text-amber-600">+₹{(pkg.total_with_tax - pkg.price).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="font-black text-slate-900">Total</span>
                            <span className="text-xl font-black text-[#463a7a]">₹{pkg.total_with_tax.toLocaleString('en-IN')}</span>
                        </div>
                    </div>

                    {/* Paying for */}
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 rounded-2xl">
                        <Shield size={16} className="text-blue-600 flex-shrink-0" />
                        <p className="text-xs font-bold text-blue-700">
                            Paying as <span className="font-black">{student?.first_name} {student?.last_name}</span> · Secured by Razorpay
                        </p>
                    </div>

                    <button
                        onClick={onPay}
                        disabled={paying}
                        className="w-full py-4 bg-gradient-to-r from-[#463a7a] to-violet-600 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
                    >
                        {paying ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Opening Razorpay…</>
                        ) : (
                            <><Lock size={16} /> Pay ₹{pkg.total_with_tax.toLocaleString('en-IN')}</>
                        )}
                    </button>
                    <p className="text-center text-[10px] font-medium text-slate-400">
                        UPI · Cards · Net Banking · Wallets
                    </p>
                </div>
            </div>
        </div>
    );
}

// ─── Payment success screen ───────────────────────────────────────────────────
function SuccessScreen({ result, onDone }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white rounded-[36px] w-full max-w-sm shadow-2xl overflow-hidden text-center">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-500 px-6 pt-10 pb-8">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white">Payment Successful!</h2>
                    <p className="text-white/70 text-sm mt-1">Your package is now active</p>
                </div>
                <div className="p-7 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Package', val: result.package_name },
                            { label: 'Invoice', val: result.invoice_number },
                            { label: 'Sessions', val: result.sessions },
                            { label: 'Valid Until', val: result.valid_until ? format(new Date(result.valid_until), 'MMM d, yyyy') : '—' },
                        ].map((s, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{s.label}</p>
                                <p className="text-sm font-black text-slate-900 truncate">{s.val}</p>
                            </div>
                        ))}
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4">
                        <p className="text-sm font-black text-emerald-700">
                            ₹{result.amount_paid?.toLocaleString('en-IN')} paid successfully
                        </p>
                    </div>
                    <button onClick={onDone} className="w-full py-4 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all">
                        Go to My Package →
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StudentPayments() {
    const razorpayReady = useRazorpay();

    const [student, setStudent] = useState(null);
    const [tab, setTab] = useState('overview');
    const [payData, setPayData] = useState(null);       // active package + invoices
    const [packages, setPackages] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingPkgs, setLoadingPkgs] = useState(false);

    const [selectedPkg, setSelectedPkg] = useState(null); // confirm modal
    const [paying, setPaying] = useState(false);
    const [successResult, setSuccessResult] = useState(null);

    // ── load student from localStorage ────────────────────────────────
    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) setStudent(JSON.parse(stored));
    }, []);

    // ── load active package + invoices ─────────────────────────────────
    useEffect(() => {
        if (!student?.id) return;
        (async () => {
            setLoadingData(true);
            try {
                const res = await api.get(`/student/${student.id}/payments`);
                setPayData(res.data);
            } catch {
                setPayData(mockStudentData());
            } finally {
                setLoadingData(false);
            }
        })();
    }, [student?.id]);

    // ── load eligible packages when Browse tab opens ───────────────────
    useEffect(() => {
        if (tab !== 'browse' || !student) return;
        (async () => {
            setLoadingPkgs(true);
            try {
                const res = await api.get(`/student/packages?student_id=${student.id}`);
                setPackages(res.data);
            } catch {
                setPackages(mockPackages(student.current_grade || 'Debut', student.desired_course || student.instrument || 'Piano'));
            } finally {
                setLoadingPkgs(false);
            }
        })();
    }, [tab, student]);

    // ── Razorpay checkout ──────────────────────────────────────────────
    const handlePay = useCallback(async () => {
        if (!selectedPkg || !student) return;
        setPaying(true);
        try {
            const { data: order } = await api.post('/student/payments/create-order', {
                package_id: selectedPkg.id,
                student_id: student.id,
            });

            // If keys aren't configured yet, simulate success for demo
            if (order.test_mode || !window.Razorpay || order.key_id === 'rzp_test_placeholder') {
                await new Promise(r => setTimeout(r, 1200));
                const { data: result } = await api.post('/student/payments/verify', {
                    razorpay_order_id: order.order_id,
                    razorpay_payment_id: 'pay_test_demo',
                    razorpay_signature: '',
                    package_id: selectedPkg.id,
                    student_id: student.id,
                    test_mode: true,
                });
                setSelectedPkg(null);
                setSuccessResult(result);
                return;
            }

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Vama Music Academy',
                description: order.description,
                order_id: order.order_id,
                prefill: {
                    name: `${student.first_name} ${student.last_name}`,
                    email: student.email || '',
                    contact: student.primary_phone_number || '',
                },
                theme: { color: '#463a7a' },
                modal: { backdropclose: false },
                handler: async (response) => {
                    try {
                        const { data: result } = await api.post('/student/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            package_id: selectedPkg.id,
                            student_id: student.id,
                        });
                        setSelectedPkg(null);
                        setSuccessResult(result);
                    } catch {
                        alert('Payment verified but invoice creation failed. Contact support.');
                    }
                },
            };
            new window.Razorpay(options).open();
        } catch (err) {
            alert(err.response?.data?.detail || 'Could not initiate payment. Try again.');
        } finally {
            setPaying(false);
        }
    }, [selectedPkg, student]);

    const handleSuccessDone = () => {
        setSuccessResult(null);
        setTab('overview');
        // Refresh payment data
        if (student?.id) {
            api.get(`/student/${student.id}/payments`).then(r => setPayData(r.data)).catch(() => {});
        }
    };

    // ── derived values ─────────────────────────────────────────────────
    const pkg = payData?.active_package;
    const sessionsRemaining = pkg ? pkg.sessions_total - pkg.sessions_used : 0;
    const sessionsPct = pkg ? Math.round((pkg.sessions_used / pkg.sessions_total) * 100) : 0;
    const daysLeft = pkg ? differenceInDays(new Date(pkg.validity_until), new Date()) : 0;
    const makeupLeft = pkg ? pkg.makeup_sessions - pkg.makeup_used : 0;
    const isExpiring = daysLeft >= 0 && daysLeft <= 7;
    const isLow = sessionsRemaining <= 2 && sessionsRemaining >= 0;
    const needsRenewal = !!pkg && (daysLeft < 0 || sessionsRemaining <= 0);

    if (loadingData) return (
        <div className="flex items-center justify-center min-h-[70vh]">
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading</p>
            </div>
        </div>
    );

    return (
        <div className="px-4 py-6 lg:px-8 lg:py-8 max-w-lg mx-auto space-y-5 pb-32">

            {/* ── Page title ──────────────────────────────────────── */}
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fees & Packages</h1>
                {student && (
                    <p className="text-sm font-medium text-slate-400 mt-0.5">
                        {student.current_grade} · {student.desired_course || student.instrument}
                    </p>
                )}
            </div>

            {/* ── Alert banners ────────────────────────────────────── */}
            {needsRenewal && (
                <div className="bg-red-50 border border-red-100 rounded-[24px] p-4 flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-red-700">Package expired</p>
                        <p className="text-xs text-red-400">Renew to resume sessions.</p>
                    </div>
                    <button onClick={() => setTab('browse')} className="px-4 py-2 bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex-shrink-0">
                        Renew
                    </button>
                </div>
            )}
            {!needsRenewal && (isExpiring || isLow) && (
                <div className="bg-amber-50 border border-amber-100 rounded-[24px] p-4 flex items-center gap-3">
                    <Bell size={18} className="text-amber-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-amber-700">
                            {isLow ? `${sessionsRemaining} session${sessionsRemaining !== 1 ? 's' : ''} left` : `Expires in ${daysLeft}d`}
                        </p>
                        <p className="text-xs text-amber-500">Renew early to avoid interruption.</p>
                    </div>
                    <button onClick={() => setTab('browse')} className="px-4 py-2 bg-amber-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex-shrink-0">
                        Renew
                    </button>
                </div>
            )}

            {/* ── Tab bar ──────────────────────────────────────────── */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {[
                    { key: 'overview', label: 'My Package' },
                    { key: 'browse', label: '✦ Browse & Pay' },
                    { key: 'history', label: 'History' },
                ].map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tab === t.key ? 'bg-[#463a7a] text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200 hover:border-[#463a7a]/30 shadow-sm'}`}>
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ══════════════════════════════════════════════════════════
                TAB: MY PACKAGE (overview)
            ══════════════════════════════════════════════════════════ */}
            {tab === 'overview' && (
                <div className="space-y-4">
                    {pkg ? (
                        <>
                            {/* Hero package card */}
                            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] rounded-[32px] p-6 text-white relative overflow-hidden">
                                <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
                                <div className="relative z-10">
                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Active Package</p>
                                    <div className="flex items-start justify-between gap-3 mb-5">
                                        <div>
                                            <h2 className="text-xl font-black leading-tight">{pkg.name}</h2>
                                            <p className="text-white/60 text-xs mt-0.5">Since {format(new Date(pkg.start_date), 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="bg-white/10 rounded-2xl px-3 py-2 text-center flex-shrink-0">
                                            <p className="text-2xl font-black leading-none">{sessionsRemaining}</p>
                                            <p className="text-white/60 text-[9px] font-black uppercase tracking-wider mt-0.5">left</p>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between mb-1.5 text-[11px]">
                                            <span className="text-white/60 font-bold">Sessions used</span>
                                            <span className="text-white font-black">{pkg.sessions_used}/{pkg.sessions_total}</span>
                                        </div>
                                        <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-700 ${sessionsPct >= 90 ? 'bg-red-400' : sessionsPct >= 70 ? 'bg-amber-400' : 'bg-white'}`}
                                                style={{ width: `${sessionsPct}%` }} />
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Used', val: pkg.sessions_used },
                                            { label: 'Makeup', val: makeupLeft },
                                            { label: 'Valid', val: `${Math.max(0, daysLeft)}d`, warn: daysLeft <= 7 },
                                        ].map((s, i) => (
                                            <div key={i} className={`rounded-2xl p-3 text-center ${s.warn ? 'bg-red-500/30' : 'bg-white/10'}`}>
                                                <p className="text-lg font-black leading-none">{s.val}</p>
                                                <p className="text-white/60 text-[9px] font-black uppercase tracking-wider mt-0.5">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                                        <p className="text-xs text-white/60">
                                            Expires <span className="text-white font-black">{format(new Date(pkg.validity_until), 'MMM d, yyyy')}</span>
                                        </p>
                                        <button onClick={() => setTab('browse')}
                                            className="px-4 py-2 bg-white text-[#463a7a] rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-1.5">
                                            Renew <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Session utilization card */}
                            <div className="bg-white rounded-[28px] p-5 border border-slate-100 shadow-lg">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Session Utilization</p>
                                <div className="flex items-center gap-5">
                                    <Ring pct={sessionsPct} />
                                    <div className="flex-1 space-y-3">
                                        {[
                                            { label: 'Sessions used', val: pkg.sessions_used, total: pkg.sessions_total, color: 'bg-[#463a7a]' },
                                            { label: 'Makeup used', val: pkg.makeup_used, total: pkg.makeup_sessions, color: 'bg-violet-400' },
                                        ].map((s, i) => (
                                            <div key={i}>
                                                <div className="flex justify-between mb-1 text-xs">
                                                    <span className="font-bold text-slate-600">{s.label}</span>
                                                    <span className="font-black text-slate-900">{s.val}/{s.total}</span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${s.color} rounded-full`}
                                                        style={{ width: `${s.total > 0 ? Math.round((s.val / s.total) * 100) : 0}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* No active package */
                        <div className="bg-white rounded-[32px] p-10 text-center border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                <Package size={28} className="text-slate-400" />
                            </div>
                            <h3 className="text-lg font-black text-slate-500 mb-1">No Active Package</h3>
                            <p className="text-sm text-slate-400 mb-5">Subscribe to start tracking sessions</p>
                            <button onClick={() => setTab('browse')}
                                className="px-6 py-3 bg-[#463a7a] text-white rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all inline-flex items-center gap-2">
                                <Zap size={16} /> Browse Packages
                            </button>
                        </div>
                    )}

                    {/* Attendance timeline */}
                    {payData?.attendance_timeline?.length > 0 && (
                        <div className="bg-white rounded-[28px] border border-slate-100 shadow-lg overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-0.5">Recent Sessions</p>
                                <div className="flex gap-3 mt-2">
                                    {[{ c: 'bg-emerald-400', l: 'Present' }, { c: 'bg-red-400', l: 'Absent' }, { c: 'bg-amber-400', l: 'Late' }].map(s => (
                                        <div key={s.l} className="flex items-center gap-1.5"><div className={`w-2 h-2 rounded-full ${s.c}`} /><span className="text-[11px] font-bold text-slate-400">{s.l}</span></div>
                                    ))}
                                </div>
                            </div>
                            {payData.attendance_timeline.slice(0, 5).map((s, i) => (
                                <div key={i} className="px-5 py-3.5 flex items-center gap-3 border-b border-slate-50 last:border-0 hover:bg-slate-50/60 transition-colors">
                                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.status === 'present' ? 'bg-emerald-400' : s.status === 'absent' ? 'bg-red-400' : 'bg-amber-400'}`} />
                                    <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-500 flex-shrink-0">{s.session_number}</div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-slate-900 truncate">{s.topic}</p>
                                        <p className="text-[11px] text-slate-400">{format(new Date(s.date), 'EEE, MMM d')}</p>
                                    </div>
                                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${s.status === 'present' ? 'bg-emerald-50 text-emerald-700' : s.status === 'absent' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                                        {s.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: BROWSE & PAY
            ══════════════════════════════════════════════════════════ */}
            {tab === 'browse' && (
                <div className="space-y-4">
                    {/* Eligibility pill */}
                    {student && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 rounded-2xl border border-violet-100 w-fit">
                            <Music size={14} className="text-[#463a7a]" />
                            <span className="text-xs font-black text-[#463a7a]">
                                Showing packages for <span className="uppercase">{student.current_grade}</span> · {student.desired_course || student.instrument}
                            </span>
                        </div>
                    )}

                    {loadingPkgs ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="w-8 h-8 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                        </div>
                    ) : packages.length === 0 ? (
                        <div className="bg-white rounded-[28px] p-10 text-center border border-slate-100 shadow-lg">
                            <Layers size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="font-black text-slate-400">No packages available for your grade & course</p>
                            <p className="text-xs text-slate-300 mt-1">Contact your academy to get enrolled</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-xs font-bold text-slate-400">{packages.length} package{packages.length !== 1 ? 's' : ''} available for you</p>
                            <div className="space-y-3">
                                {packages.map((p, i) => (
                                    <PackageCard
                                        key={p.id}
                                        pkg={p}
                                        isActive={pkg?.id === p.id}
                                        highlight={i === 1}
                                        onSelect={setSelectedPkg}
                                    />
                                ))}
                            </div>
                            <p className="text-center text-[11px] font-medium text-slate-400 py-2">
                                All prices include GST · Secured by Razorpay
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                TAB: HISTORY
            ══════════════════════════════════════════════════════════ */}
            {tab === 'history' && (
                <div className="space-y-3">
                    {!payData?.invoices?.length ? (
                        <div className="bg-white rounded-[28px] p-10 text-center border border-slate-100 shadow-lg">
                            <CreditCard size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="font-black text-slate-400">No payment history yet</p>
                        </div>
                    ) : payData.invoices.map((inv, i) => (
                        <div key={i} className="bg-white rounded-[24px] border border-slate-100 shadow-md overflow-hidden">
                            <div className="p-4 flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${inv.status === 'paid' ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                    {inv.status === 'paid' ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Clock size={18} className="text-blue-600" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-black text-slate-900">{inv.payment_type}</p>
                                        <StatusBadge status={inv.status} />
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{inv.invoice_number} · {format(new Date(inv.issue_date), 'MMM d, yyyy')}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-base font-black text-[#463a7a]">₹{inv.total_amount.toLocaleString('en-IN')}</p>
                                    {inv.discount_amount > 0 && <p className="text-[10px] font-bold text-emerald-600">-₹{inv.discount_amount}</p>}
                                </div>
                            </div>
                            <div className="px-4 pb-4">
                                <div className="bg-slate-50 rounded-2xl p-3 grid grid-cols-3 gap-2 text-center mb-3">
                                    <div><p className="text-[10px] font-black text-slate-400 mb-0.5">Base</p><p className="text-sm font-black text-slate-900">₹{inv.amount.toLocaleString('en-IN')}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 mb-0.5">GST</p><p className="text-sm font-black text-amber-600">+₹{inv.tax_amount.toLocaleString('en-IN')}</p></div>
                                    <div><p className="text-[10px] font-black text-slate-400 mb-0.5">Due</p><p className="text-sm font-black text-slate-900">{format(new Date(inv.due_date), 'MMM d')}</p></div>
                                </div>
                                {inv.paid_date && <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 mb-3"><CheckCircle2 size={11} />Paid {format(new Date(inv.paid_date), 'MMMM d, yyyy')}</p>}
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5">
                                        <Download size={12} /> Receipt
                                    </button>
                                    {inv.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                const pkgForPayment = packages.find(p => p.name === inv.payment_type) || { id: inv.package_id, name: inv.payment_type, price: inv.amount, tax_percentage: 18, total_with_tax: inv.total_amount, total_sessions: 0, validity_days: 30, makeup_sessions: 0 };
                                                setSelectedPkg(pkgForPayment);
                                                setTab('browse');
                                            }}
                                            className="flex-1 py-2.5 bg-[#463a7a] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5">
                                            <CreditCard size={12} /> Pay Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Floating CTA ──────────────────────────────────────── */}
            {tab !== 'browse' && (
                <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4 w-full max-w-sm pointer-events-none">
                    <button
                        onClick={() => setTab('browse')}
                        className={`pointer-events-auto w-full py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]
                            ${needsRenewal ? 'bg-red-600 text-white' : 'bg-gradient-to-r from-[#463a7a] to-violet-600 text-white'}`}>
                        <Zap size={18} />
                        {needsRenewal ? 'Package Expired — Renew Now' : isLow ? `Renew — ${sessionsRemaining} Session${sessionsRemaining !== 1 ? 's' : ''} Left` : pkg ? 'Change / Upgrade Package' : 'Browse & Subscribe'}
                    </button>
                </div>
            )}

            {/* ── Modals ────────────────────────────────────────────── */}
            {selectedPkg && !successResult && (
                <ConfirmModal
                    pkg={selectedPkg}
                    student={student}
                    paying={paying}
                    onPay={handlePay}
                    onClose={() => setSelectedPkg(null)}
                />
            )}
            {successResult && <SuccessScreen result={successResult} onDone={handleSuccessDone} />}
        </div>
    );
}
