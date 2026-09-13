import React from 'react';
import { Link } from 'react-router';
import { IconMusic } from '@tabler/icons-react';
import vamaLogo from '../../assets/vama-logo.png';
import { BRAND } from '../../lib/brand';

const DEFAULT_HERO = {
  heroTitle: <>One Platform for Your<br />Entire VAMA Journey.</>,
  heroSubtitle: 'Schedule, progress, payments, and everything that matters — all in one place, powered by Optimus.',
  stats: [],
};

// Shared shell for every auth screen (student/teacher/admin login, forgot &
// reset password) so they all read as one product with the landing page.
// The left brand panel's copy/stats are configurable per portal — students,
// teachers and admins each see messaging relevant to their own role.
export default function AuthLayout({
  portalLabel,
  title,
  subtitle,
  children,
  footer,
  heroTitle = DEFAULT_HERO.heroTitle,
  heroSubtitle = DEFAULT_HERO.heroSubtitle,
  stats = DEFAULT_HERO.stats,
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        {/* Left: brand panel */}
        <div
          className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${BRAND.purple}, #241d40)` }}
        >
          <IconMusic className="w-72 h-72 text-white/5 absolute -bottom-16 -right-16 rotate-12" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-14">
              <div className="bg-white rounded-lg px-2 py-1.5">
                <img src={vamaLogo} alt="VAMA Academy" className="h-7 w-auto" />
              </div>
            </Link>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">{heroTitle}</h2>
            <p className="text-indigo-100/70 max-w-sm">{heroSubtitle}</p>
          </div>

          {stats.length > 0 && (
            <div className="relative z-10 grid grid-cols-2 gap-4">
              {stats.map(({ icon: Icon, value, label }) => (
                <div key={label} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                  <Icon className="text-orange-400 mb-3 w-5 h-5" />
                  <p className="text-white font-bold text-lg leading-none">{value}</p>
                  <p className="text-indigo-200/50 text-[10px] font-bold uppercase tracking-widest mt-2">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: form */}
        <div className="p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={vamaLogo} alt="VAMA Academy" className="h-9 w-auto" />
          </div>

          {portalLabel && (
            <span
              className="inline-block w-fit px-3 py-1 rounded-full text-xs font-semibold mb-4"
              style={{ backgroundColor: '#EDEBF5', color: BRAND.purple }}
            >
              {portalLabel}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">{title}</h1>
          {subtitle && <p className="text-slate-500 mb-8">{subtitle}</p>}

          {children}

          {footer && <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
