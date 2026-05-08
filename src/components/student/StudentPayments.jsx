import React from 'react';
import { Wrench, Clock } from 'lucide-react';

export default function StudentPayments() {
    return (
        <div className="flex items-center justify-center min-h-[70vh] p-8">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-indigo-50 rounded-[32px] flex items-center justify-center mx-auto mb-6">
                    <Wrench className="w-12 h-12 text-[#463a7a]" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-3">
                    Payments
                </h1>
                <div className="flex items-center justify-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-black text-amber-500 uppercase tracking-widest">Coming Soon</span>
                </div>
                <p className="text-slate-400 font-medium leading-relaxed">
                    We're working on this feature. Payment history, invoices, and online payments will be available here soon.
                </p>
            </div>
        </div>
    );
}
