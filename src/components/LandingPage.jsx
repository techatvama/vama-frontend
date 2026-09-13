import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import {
  Clock,
  Calendar,
  Repeat,
  CreditCard,
  Bell,
  Star,
  User,
  ListChecks,
  Menu,
  X,
  CheckCircle2,
  ChevronRight,
  Zap,
  ShieldCheck,
  GraduationCap,
} from 'lucide-react';
import { IconMusic, IconMicrophone2, IconGuitarPick, IconMasksTheater } from '@tabler/icons-react';
import vamaLogo from '../assets/vama-logo.png';
import { BRAND } from '../lib/brand';

const ROTATING_PHRASES = [
  'Track your Progress',
  'View your Schedule',
  'Manage Rescheduling',
  'Stay updated with Classes',
  'Manage Fee Payments',
  'Stay connected with VAMA',
  'Track your Learning Journey',
];

const FEATURES = [
  {
    icon: Clock,
    title: 'Track Your Progress',
    desc: 'See completed classes, upcoming milestones, and your overall learning development all in one dashboard.',
    color: BRAND.purple,
  },
  {
    icon: Calendar,
    title: 'Manage Your Schedule',
    desc: 'View upcoming classes, schedules, and important class-related information instantly from anywhere.',
    color: BRAND.orange,
  },
  {
    icon: Repeat,
    title: 'Easy Rescheduling',
    desc: 'Make class rescheduling simple and transparent without unnecessary back-and-forth communication.',
    color: BRAND.teal,
  },
  {
    icon: CreditCard,
    title: 'Simple Fee Payments',
    desc: 'View fee information, payment status, and make payments conveniently — no more confusion or missed dues.',
    color: BRAND.magenta,
  },
  {
    icon: Bell,
    title: 'Stay Updated',
    desc: 'Receive important academy announcements, class updates, reminders, and notifications in real time.',
    color: BRAND.purple,
  },
  {
    icon: Star,
    title: 'Your Learning Journey',
    desc: 'Get a clear view of your entire learning journey — see how far you’ve come and what exciting milestones await.',
    color: BRAND.orange,
  },
];

const STEPS = [
  { n: '01', icon: User, title: 'Login', desc: 'Sign in with your VAMA student credentials' },
  { n: '02', icon: Calendar, title: 'View Classes', desc: 'See your upcoming schedule and class details' },
  { n: '03', icon: Clock, title: 'Track Progress', desc: 'Monitor your learning milestones and achievements' },
  { n: '04', icon: Repeat, title: 'Manage Schedule', desc: 'Reschedule classes easily when needed' },
  { n: '05', icon: CreditCard, title: 'Make Payments', desc: 'Pay fees directly and view payment history' },
  { n: '06', icon: ListChecks, title: 'Continue Learning', desc: 'Keep growing with VAMA’s expert guidance' },
];

function RotatingPhrase() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeOut = setTimeout(() => setVisible(false), 2200);
    const next = setTimeout(() => {
      setIndex((i) => (i + 1) % ROTATING_PHRASES.length);
      setVisible(true);
    }, 2500);
    return () => {
      clearTimeout(fadeOut);
      clearTimeout(next);
    };
  }, [index]);

  return (
    <p
      className="text-lg sm:text-xl font-semibold mb-2 h-7 transition-all duration-300 ease-out"
      style={{
        color: BRAND.orange,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      {ROTATING_PHRASES[index]}
    </p>
  );
}

function NavLink({ href, children }) {
  return (
    <a href={href} className="relative group text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
      {children}
      <span
        className="absolute -bottom-1 left-0 h-px w-0 group-hover:w-full transition-all duration-300"
        style={{ backgroundColor: BRAND.orange }}
      />
    </a>
  );
}

function NavBar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={vamaLogo} alt="VAMA Academy" className="h-10 w-auto" />
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm" style={{ backgroundColor: BRAND.optimusBlue }}>
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 leading-none">Powered by</p>
              <p className="text-sm font-bold leading-tight" style={{ color: BRAND.optimusBlue }}>Optimus</p>
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <nav className="flex items-center gap-8">
            <NavLink href="#features">Features</NavLink>
            <NavLink href="#how-it-works">How It Works</NavLink>
            <NavLink href="#about">About VAMA</NavLink>
          </nav>
          <Link
            to="/student-login"
            className="px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
            style={{ backgroundColor: BRAND.orange, boxShadow: `0 8px 20px -6px ${BRAND.orange}80` }}
          >
            Student Login
          </Link>
        </div>

        <button
          className="md:hidden text-slate-700"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-slate-100 px-6 py-4 flex flex-col gap-4 bg-white">
          <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">How It Works</a>
          <a href="#about" onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600">About VAMA</a>
          <Link
            to="/student-login"
            className="px-4 py-2.5 rounded-xl text-white font-semibold text-sm text-center"
            style={{ backgroundColor: BRAND.orange }}
          >
            Student Login
          </Link>
        </div>
      )}
    </header>
  );
}

function HeroMockup() {
  return (
    <div className="relative mx-auto lg:mx-0 w-72 sm:w-80">
      {/* Soft colored glow beneath the phone */}
      <div
        className="absolute inset-x-6 top-10 bottom-0 rounded-[3rem] blur-3xl opacity-30 -z-10"
        style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.orange})` }}
      />

      <div className="rounded-[2rem] border-8 border-slate-900 bg-slate-900 shadow-2xl overflow-hidden transition-transform duration-500 hover:-translate-y-1">
        <div className="bg-[#f8fafc] rounded-[1.4rem] overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="text-[11px] font-semibold text-slate-800">9:41</span>
            <div className="w-3 h-2 rounded-sm bg-slate-800" />
          </div>

          <div className="px-3 pb-4 space-y-3">
            {/* Welcome card — mirrors the real student dashboard */}
            <div className="rounded-2xl p-4 relative overflow-hidden shadow-lg" style={{ backgroundColor: BRAND.purple }}>
              <IconMusic className="w-20 h-20 text-white/5 absolute -right-3 -top-3 rotate-12" />
              <div className="relative">
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wide mb-2 shadow-sm"
                  style={{ backgroundColor: BRAND.orange }}
                >
                  Debut Grade
                </span>
                <p className="text-white font-bold text-sm leading-tight">Ready to practice,</p>
                <p className="text-indigo-200 font-bold text-base leading-tight mb-2">Aryan?</p>
                <p className="text-white/50 text-[10px]">1 session scheduled today</p>
              </div>
            </div>

            {/* Progress ring card */}
            <div className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-sm">
              <div className="relative w-12 h-12 shrink-0">
                <svg className="w-12 h-12 -rotate-90">
                  <circle cx="24" cy="24" r="19" stroke="#f1f5f9" strokeWidth="5" fill="none" />
                  <circle
                    cx="24" cy="24" r="19" stroke={BRAND.purple} strokeWidth="5" fill="none"
                    strokeDasharray={119} strokeDashoffset={119 - 119 * 0.72} strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[11px] font-bold text-slate-900">72%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Overall Mastery</p>
                <p className="text-xs font-bold text-slate-800">Vama Excellence</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>

            {/* Today's schedule */}
            <div className="bg-white rounded-2xl p-3 shadow-sm">
              <p className="text-[11px] font-bold text-slate-800 mb-2">Today's Schedule</p>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" style={{ color: BRAND.purple }} />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-800 leading-none">Classical Guitar</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">4:00 PM</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold" style={{ color: BRAND.orange }}>Today</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -right-10 -top-6 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 hidden sm:flex">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <div>
          <p className="text-[11px] font-semibold text-slate-800 leading-none">Class Rescheduled</p>
          <p className="text-[10px] text-slate-500">Confirmed instantly</p>
        </div>
      </div>

      <div className="absolute -left-10 -bottom-6 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 hidden sm:flex">
        <Star className="w-4 h-4" style={{ color: BRAND.orange }} fill="currentColor" />
        <div>
          <p className="text-[11px] font-semibold text-slate-800 leading-none">72% Complete</p>
          <p className="text-[10px] text-slate-500">Learning Journey</p>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient background blobs */}
      <div
        className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-[0.08] -z-10 pointer-events-none"
        style={{ backgroundColor: BRAND.purple }}
      />
      <div
        className="absolute top-0 right-0 w-[24rem] h-[24rem] rounded-full blur-3xl opacity-[0.08] -z-10 pointer-events-none"
        style={{ backgroundColor: BRAND.orange }}
      />

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border shadow-sm"
            style={{ backgroundColor: '#EAF0FE', color: BRAND.optimusBlue, borderColor: '#D3E1FC' }}
          >
            Optimus
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-slate-900 leading-[1.05] tracking-tight mb-3">
            One Platform for Your<br />Entire VAMA Journey.
          </h1>
          <RotatingPhrase />
          <p className="text-slate-500 mb-8 max-w-md text-[15px] leading-relaxed">
            Optimus brings your VAMA Academy experience together — schedule, progress, payments, and everything that matters, in one place.
          </p>

          <div className="flex items-center gap-8 pt-6 border-t border-slate-100">
            <div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">1,000+</p>
              <p className="text-xs text-slate-400">Active Students</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-2xl font-bold text-slate-900 flex items-center gap-1 tracking-tight">
                4.8 <Star className="w-4 h-4" style={{ color: BRAND.orange }} fill="currentColor" />
              </p>
              <p className="text-xs text-slate-400">Student Rating</p>
            </div>
          </div>
        </div>

        <HeroMockup />
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="bg-slate-50/70 py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Everything you need,<br />
            <span style={{ color: BRAND.orange }}>all in one place.</span>
          </h2>
          <p className="text-slate-500">
            Optimus brings together every aspect of your VAMA Academy experience into a single, beautifully simple platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${color}40`)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${color}14` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Your complete VAMA experience<br />
            <span style={{ color: BRAND.orange }}>in six simple steps.</span>
          </h2>
          <p className="text-slate-500">
            Everything you need for your VAMA learning experience is in one place. Simple. Clear. Effortless.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 mb-14">
          {STEPS.map(({ n, icon: Icon, title, desc }) => (
            <div key={n} className="flex items-start gap-4 group">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: '#EDEBF5' }}
              >
                <Icon className="w-5 h-5" style={{ color: BRAND.purple }} />
              </div>
              <div>
                <span className="text-xs font-bold" style={{ color: BRAND.orange }}>{n}</span>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl p-8 grid md:grid-cols-3 gap-6 border border-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-900">Dashboard</p>
              <span className="text-xs text-slate-400">Week 3</span>
            </div>
            <div className="flex gap-3 mb-4">
              <div className="flex-1 rounded-xl py-3 text-center" style={{ backgroundColor: '#FDF0E4' }}>
                <p className="text-lg font-bold" style={{ color: BRAND.orange }}>3</p>
                <p className="text-[11px] text-slate-500">Classes</p>
              </div>
              <div className="flex-1 rounded-xl py-3 text-center" style={{ backgroundColor: '#EDEBF5' }}>
                <p className="text-lg font-bold" style={{ color: BRAND.purple }}>72%</p>
                <p className="text-[11px] text-slate-500">Done</p>
              </div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-3/4 rounded-full" style={{ backgroundColor: BRAND.orange }} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-slate-900 mb-4">This Week</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND.orange }} />
                <span className="text-slate-700">Guitar — Mon 4 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-700">Vocals — Wed 5 PM</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="text-slate-700">Theory — Fri 3 PM</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-50 hover:shadow-md transition-shadow">
            <p className="text-sm font-semibold text-slate-900 mb-4">Fee Status</p>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">June 2025</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">July 2025</span>
                <span className="font-medium" style={{ color: BRAND.orange }}>Due Jul 30</span>
              </div>
            </div>
            <Link
              to="/student-login"
              className="block text-center w-full py-2 rounded-lg text-white text-sm font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
              style={{ backgroundColor: BRAND.orange }}
            >
              Pay Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FreeTrialCTA() {
  return (
    <section className="max-w-7xl mx-auto px-6 pb-20">
      <div
        className="relative overflow-hidden rounded-[2rem] px-8 py-16 text-center border border-white/10 shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${BRAND.purple}, ${BRAND.magenta})` }}
      >
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full bg-white/10 blur-2xl" />

        <IconGuitarPick className="w-16 h-16 text-white/10 absolute left-8 top-8 -rotate-12" />
        <IconMicrophone2 className="w-20 h-20 text-white/10 absolute right-10 top-4 rotate-12" />
        <IconMasksTheater className="w-16 h-16 text-white/10 absolute left-12 bottom-8" />
        <IconMusic className="w-20 h-20 text-white/10 absolute right-8 bottom-4 -rotate-12" />

        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
            Book Your Free Trial Class Now.
          </h2>
          <p className="text-indigo-100 max-w-xl mx-auto mb-8">
            Experience a VAMA Academy class firsthand — no commitment, no cost. See why thousands of students trust us with their musical journey.
          </p>
          <Link
            to="/apply"
            className="inline-block px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
            style={{ backgroundColor: BRAND.orange, boxShadow: `0 12px 28px -8px ${BRAND.orange}90` }}
          >
            Book Your Free Trial Class
          </Link>
        </div>
      </div>
    </section>
  );
}

function FacultyLoginModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Faculty Login</h3>
        <p className="text-sm text-slate-500 mb-6">Choose your portal to continue.</p>

        <div className="space-y-3">
          <Link
            to="/teacher-login"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-transparent hover:shadow-md transition-all"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EDEBF5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#EDEBF5' }}>
              <GraduationCap className="w-5 h-5" style={{ color: BRAND.purple }} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 text-sm">Teacher</p>
              <p className="text-xs text-slate-500">Manage your classes &amp; students</p>
            </div>
          </Link>

          <Link
            to="/admin-login"
            className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:border-transparent hover:shadow-md transition-all"
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#FDF0E4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FDF0E4' }}>
              <ShieldCheck className="w-5 h-5" style={{ color: BRAND.orange }} />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-900 text-sm">Admin</p>
              <p className="text-xs text-slate-500">Academy &amp; center administration</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const [facultyModalOpen, setFacultyModalOpen] = useState(false);

  return (
    <footer id="about" className="relative bg-slate-900 text-slate-400 pt-16 pb-8">
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${BRAND.orange}80, transparent)` }}
      />
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ backgroundColor: BRAND.orange }}>
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-white">OPTIMUS</span>
            </div>
            <p className="text-sm leading-relaxed">
              The digital management platform for VAMA Academy — empowering students to take control of their learning journey.
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Product</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#features" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">Features</a></li>
              <li><a href="#how-it-works" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">How It Works</a></li>
              <li><Link to="/apply" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">Get Started</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">VAMA Academy</p>
            <ul className="space-y-3 text-sm">
              <li><a href="#about" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">About VAMA</a></li>
              <li><a href="#features" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">Programs</a></li>
              <li><a href="#" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">Contact</a></li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Access</p>
            <ul className="space-y-3 text-sm">
              <li><Link to="/student-login" className="inline-block hover:text-white hover:translate-x-0.5 transition-all">Student Login</Link></li>
              <li>
                <button
                  onClick={() => setFacultyModalOpen(true)}
                  className="inline-block hover:text-white hover:translate-x-0.5 transition-all text-left"
                >
                  Faculty Login
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} VAMA Academy. Powered by Optimus.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>

      {facultyModalOpen && <FacultyLoginModal onClose={() => setFacultyModalOpen(false)} />}
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <Hero />
      <Features />
      <HowItWorks />
      <FreeTrialCTA />
      <Footer />
    </div>
  );
}
