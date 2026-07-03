import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import {
    Calendar, LayoutDashboard, LogOut, Zap,
    BookOpen, FileText, CreditCard, User,
    ChevronLeft, ChevronRight, Menu, X, CheckCircle2
} from 'lucide-react';

const NAV_ITEMS = [
    { name: 'Dashboard',   icon: LayoutDashboard, path: '/student-portal' },
    { name: 'Schedule',    icon: Calendar,         path: '/student-portal/schedule' },
    { name: 'Attendance',  icon: CheckCircle2,     path: '/student-portal/attendance' },
    { name: 'Curriculum',  icon: BookOpen,         path: '/student-portal/progress' },
    { name: 'Materials',   icon: FileText,         path: '/student-portal/materials' },
    { name: 'Payments',    icon: CreditCard,       path: '/student-portal/payments' },
];

export default function StudentSidebar() {
    const [student, setStudent] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) setStudent(JSON.parse(stored));
        else navigate('/student-login');

        const onResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setCollapsed(false);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [navigate]);

    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('student');
        localStorage.removeItem('student_token');
        navigate('/student-login');
    };

    if (!student) return null;

    const isActive = (path) =>
        path === '/student-portal' ? pathname === path : pathname.startsWith(path);

    const initials = `${student.first_name?.[0] ?? ''}${student.last_name?.[0] ?? ''}`.toUpperCase() || '?';

    /* ── Shared nav list ──────────────────────────────────── */
    const NavItems = ({ compact = false }) => (
        <>
            {NAV_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center ${compact ? 'justify-center px-2 py-3' : 'gap-3.5 px-4 py-3.5'} rounded-2xl transition-all group
                            ${active
                                ? 'bg-[#463a7a] text-white shadow-xl shadow-indigo-900/20'
                                : 'text-slate-400 hover:text-[#463a7a] hover:bg-indigo-50/60'}`}
                    >
                        <item.icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? 'text-white' : 'text-slate-300 group-hover:text-[#463a7a]'}`} />
                        {!compact && (
                            <span className="font-black text-sm tracking-tight uppercase flex-1 truncate">
                                {item.name}
                            </span>
                        )}
                        {active && !compact && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                    </NavLink>
                );
            })}
        </>
    );

    const desktopWidth = collapsed ? 'w-[72px]' : 'w-72';

    return (
        <>
            {/* ── Mobile top bar ──────────────────────────────────── */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-5 z-[60] shadow-sm">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-[#463a7a] transition-all"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Zap size={14} className="text-white fill-current" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tighter text-lg">Optimus</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center font-black text-[#463a7a] text-sm border border-indigo-100">
                        {initials}
                    </div>
                </div>
            )}

            {/* ── Mobile drawer overlay ────────────────────────────── */}
            {isMobile && drawerOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70]"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ── Mobile drawer ────────────────────────────────────── */}
            {isMobile && (
                <aside className={`fixed inset-y-0 left-0 w-72 z-[80] flex flex-col bg-white border-r border-slate-100 shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-700"
                    >
                        <X size={18} />
                    </button>

                    {/* Brand */}
                    <div className="px-6 pt-6 pb-5 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <Zap size={20} className="text-white fill-current" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">OPTIMUS</p>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Student</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                        <NavItems />
                    </nav>

                    {/* User + logout */}
                    <div className="p-4 border-t border-slate-100">
                        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-2xl mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#463a7a] flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                                {initials}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-black text-slate-900 truncate">{student.first_name} {student.last_name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{student.course || 'Student'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all font-black text-[10px] tracking-widest uppercase"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </aside>
            )}

            {/* ── Desktop sidebar ──────────────────────────────────── */}
            {!isMobile && (
                <aside className={`${desktopWidth} h-full flex-shrink-0 flex flex-col bg-white border-r border-slate-100 shadow-sm transition-all duration-300 relative`}>
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="absolute -right-3.5 top-12 w-7 h-7 bg-white border border-slate-200 rounded-full flex items-center justify-center text-[#463a7a] shadow-md hover:scale-110 active:scale-95 transition-all z-10"
                    >
                        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
                    </button>

                    {/* Brand */}
                    <div className={`px-5 pt-6 pb-5 border-b border-slate-100 ${collapsed ? 'flex justify-center' : ''}`}>
                        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Zap size={20} className="text-white fill-current" />
                            </div>
                            {!collapsed && (
                                <div>
                                    <p className="text-xl font-black text-slate-900 tracking-tighter leading-none">OPTIMUS</p>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">Student</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        <NavItems compact={collapsed} />
                    </nav>

                    {/* User + logout */}
                    <div className="p-3 border-t border-slate-100">
                        <div className={`flex items-center gap-3 p-3 bg-slate-50 rounded-2xl ${collapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-2xl bg-[#463a7a] flex items-center justify-center font-black text-white text-sm flex-shrink-0">
                                {initials}
                            </div>
                            {!collapsed && (
                                <div className="overflow-hidden flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-900 truncate">{student.first_name} {student.last_name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{student.course || 'Student'}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-3 mt-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all group font-black text-[10px] tracking-widest uppercase`}
                        >
                            <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                            {!collapsed && 'Sign Out'}
                        </button>
                    </div>
                </aside>
            )}

            {/* ── Mobile bottom tab bar ────────────────────────────── */}
            {isMobile && (
                <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-slate-100 shadow-2xl shadow-black/10 grid grid-cols-6">
                    {NAV_ITEMS.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex flex-col items-center justify-center gap-0.5 py-2.5 transition-all ${active ? 'text-[#463a7a]' : 'text-slate-400'}`}
                            >
                                <div className={`relative flex items-center justify-center w-9 h-7 rounded-xl transition-all ${active ? 'bg-indigo-50' : ''}`}>
                                    <item.icon className="w-[18px] h-[18px]" />
                                    {active && <span className="absolute -top-1 -right-0.5 w-1.5 h-1.5 bg-orange-400 rounded-full" />}
                                </div>
                                <span className="text-[8px] font-black tracking-wide uppercase leading-none">
                                    {item.name.split(' ')[0]}
                                </span>
                            </NavLink>
                        );
                    })}
                </nav>
            )}
        </>
    );
}
