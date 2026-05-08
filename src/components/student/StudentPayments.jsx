import React, { useState } from 'react';
import {
    CreditCard,
    ArrowUpRight,
    History,
    Zap,
    ShieldCheck,
    Music,
    CheckCircle2,
    Lock,
    ArrowRight,
    TrendingUp,
    Award
} from 'lucide-react';
import { format } from 'date-fns';

export default function StudentPayments() {
    const [selectedPlan, setSelectedPlan] = useState('monthly');

    const history = [
        { id: 1, date: '2025-12-05', amount: '85.00', status: 'Paid', type: 'Monthly Tuition' },
        { id: 2, date: '2025-11-05', amount: '85.00', status: 'Paid', type: 'Monthly Tuition' },
        { id: 3, date: '2025-10-05', amount: '85.00', status: 'Paid', type: 'Monthly Tuition' },
    ];

    return (
        <div className="p-4 lg:p-12 max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header Profile */}
            <div className="relative bg-[#463a7a] rounded-[50px] p-8 lg:p-16 overflow-hidden shadow-2xl shadow-indigo-900/40">
                <div className="absolute top-0 right-0 p-12 opacity-5 scale-125">
                    <CreditCard className="w-96 h-96 text-white fill-current" />
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="px-5 py-2 bg-emerald-500 rounded-full flex items-center gap-2 shadow-lg shadow-emerald-900/20 w-fit mb-8 border border-white/10">
                            <ShieldCheck size={14} className="text-white" />
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Secure Payments</span>
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.85] mb-8">
                            Investment in<br />
                            <span className="text-indigo-300">Your Future.</span>
                        </h1>
                    </div>

                    <div className="bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#463a7a]/5 rounded-bl-[80px] -mr-8 -mt-8 transition-colors" />
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-6">Current Dues</p>
                            <div className="flex items-baseline gap-2 mb-10">
                                <span className="text-slate-400 text-3xl font-black leading-none">$</span>
                                <span className="text-6xl font-black text-slate-900 tracking-tighter leading-none">0.00</span>
                            </div>
                            <div className="bg-emerald-50 rounded-[28px] p-6 border border-emerald-100 flex items-center gap-4 mb-8">
                                <CheckCircle2 className="text-emerald-500" size={24} />
                                <p className="text-emerald-900 text-sm font-black uppercase tracking-tight">Your account is fully paid! 🎉</p>
                            </div>
                            <button className="w-full py-6 bg-[#463a7a] text-white rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-900/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                                MAKE A PAYMENT <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                {/* Plans */}
                <div className="xl:col-span-2 space-y-10">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Support Plans</h2>
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-1 flex gap-1">
                            <button onClick={() => setSelectedPlan('monthly')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlan === 'monthly' ? 'bg-[#463a7a] text-white' : 'text-slate-400'}`}>Monthly</button>
                            <button onClick={() => setSelectedPlan('yearly')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedPlan === 'yearly' ? 'bg-[#463a7a] text-white' : 'text-slate-400'}`}>Yearly (Save 20%)</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-[#463a7a] transition-all group">
                            <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-[#463a7a] mb-8 group-hover:bg-[#463a7a] group-hover:text-white transition-all">
                                <TrendingUp size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-4 uppercase">Solo Artist</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">Perfect for individual focus and accelerated musical learning.</p>
                            <div className="flex items-baseline gap-1 mb-10">
                                <span className="text-3xl font-black text-slate-900">$85</span>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">/ month</span>
                            </div>
                            <button className="w-full py-5 bg-slate-50 text-[#463a7a] rounded-[24px] font-black text-[10px] uppercase tracking-widest border border-slate-200/50 hover:bg-[#463a7a] hover:text-white transition-all">Current Plan</button>
                        </div>

                        <div className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-[#463a7a] transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 px-6 py-2 bg-orange-400 text-white font-black text-[10px] uppercase tracking-widest transform translate-x-[36px] translate-y-[18px] rotate-45 shadow-xl">MOST POPULAR</div>
                            <div className="w-16 h-16 bg-slate-50 rounded-[24px] flex items-center justify-center text-[#463a7a] mb-8 group-hover:bg-[#463a7a] group-hover:text-white transition-all">
                                <Award size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none mb-4 uppercase">Performance Pro</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-10">Includes exam fees, performance workshops and private theory classes.</p>
                            <div className="flex items-baseline gap-1 mb-10">
                                <span className="text-3xl font-black text-slate-900">$140</span>
                                <span className="text-slate-400 font-bold uppercase text-[10px]">/ month</span>
                            </div>
                            <button className="w-full py-5 bg-[#463a7a] text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/10 hover:scale-[1.02] active:scale-95 transition-all">Upgrade Now</button>
                        </div>
                    </div>
                </div>

                {/* History Sidebar */}
                <div className="bg-white rounded-[50px] p-10 shadow-2xl shadow-slate-200/50 border border-slate-100 h-fit">
                    <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tighter uppercase flex items-center gap-3">
                        <History className="text-[#463a7a]" />
                        PAYMENT LOG
                    </h2>
                    <div className="space-y-6">
                        {history.map(item => (
                            <div key={item.id} className="p-5 bg-slate-50/50 border border-slate-100 rounded-[32px] flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-xl transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm border border-slate-50">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-slate-900 uppercase">{item.type}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{format(new Date(item.date), 'MMM d, yyyy')}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-[#463a7a] tracking-tight">${item.amount}</p>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">Paid</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full py-5 border-2 border-dashed border-slate-200 text-slate-300 font-black text-[10px] uppercase tracking-widest rounded-3xl mt-10 hover:border-[#463a7a] hover:text-[#463a7a] transition-all">
                        Download All Receipts
                    </button>
                </div>
            </div>

            {/* Security Tip */}
            <div className="bg-slate-900 rounded-[50px] p-12 text-center relative overflow-hidden shadow-2xl">
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/5 backdrop-blur-md rounded-[32px] flex items-center justify-center mx-auto mb-8 border border-white/5">
                        <Lock className="text-emerald-400" size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase mb-4">Encryption Guaranteed</h3>
                    <p className="text-white/40 font-medium max-w-lg mx-auto leading-relaxed mb-0">
                        All transactions are encrypted with AES-256 and processed through our secure PCI-compliant gateway. Your data is always safe with us.
                    </p>
                </div>
                <Music className="absolute -bottom-20 -left-20 w-80 h-80 text-white/5 opacity-5" />
            </div>
        </div>
    );
}
