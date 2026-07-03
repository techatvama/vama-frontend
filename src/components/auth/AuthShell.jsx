import React from 'react';
import { Zap } from 'lucide-react';

// Shared dark-glass shell for the standalone auth flows (activate / forgot / reset),
// matching the look of the portal login screens.
export default function AuthShell({ title, subtitle, icon, children }) {
    return (
        <div className="min-h-screen bg-[#0f0f13] flex items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#463a7a]/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-[460px] bg-white/5 backdrop-blur-3xl rounded-[44px] border border-white/10 shadow-2xl relative z-10 p-8 lg:p-12">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                        {icon || <Zap className="text-yellow-400 fill-current" />}
                    </div>
                    <span className="text-2xl font-black text-white tracking-tighter">VAMA</span>
                </div>

                <h1 className="text-3xl font-black text-white tracking-tight leading-none mb-3">{title}</h1>
                {subtitle && <p className="text-white/40 font-bold uppercase text-xs tracking-widest mb-8">{subtitle}</p>}

                {children}
            </div>
        </div>
    );
}
