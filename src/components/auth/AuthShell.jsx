import React from 'react';
import { Link } from 'react-router';
import vamaLogo from '../../assets/vama-logo.png';
import { BRAND } from '../../lib/brand';

// Shared light shell for the standalone auth flows (activate / forgot / reset),
// matching the VAMA landing page and portal login screens.
export default function AuthShell({ title, subtitle, icon, children }) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-[460px] bg-white rounded-[32px] shadow-xl border border-slate-100 relative z-10 p-8 lg:p-10">
                <div className="flex justify-center mb-8">
                    <Link to="/">
                        <img src={vamaLogo} alt="VAMA Academy" className="h-9 w-auto" />
                    </Link>
                </div>

                {icon && (
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
                        style={{ backgroundColor: '#EDEBF5', color: BRAND.purple }}
                    >
                        {icon}
                    </div>
                )}

                <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2">{title}</h1>
                {subtitle && <p className="text-slate-500 text-sm mb-8">{subtitle}</p>}

                {children}
            </div>
        </div>
    );
}
