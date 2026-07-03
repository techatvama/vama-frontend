import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import {
    Calendar,
    Users,
    FileText,
    LogOut,
    ChevronRight,
    User,
    LayoutDashboard,
    Menu,
    X,
    Zap,
    ChevronLeft
} from 'lucide-react';

const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/teacher-portal' },
    { name: 'Calendar',  icon: Calendar,         path: '/teacher-portal/calendar' },
    { name: 'Students',  icon: Users,             path: '/teacher-portal/students' },
    { name: 'Materials', icon: FileText,          path: '/teacher-portal/materials' },
];

export default function TeacherSidebar() {
    const [teacher, setTeacher] = useState(null);
    const [collapsed, setCollapsed] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) setTeacher(JSON.parse(stored));
        else navigate('/teacher-login');

        const onResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (mobile) setCollapsed(false);
        };
        onResize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, [navigate]);

    // Close drawer on route change
    useEffect(() => { setDrawerOpen(false); }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('teacher');
        localStorage.removeItem('teacher_token');
        navigate('/teacher-login');
    };

    if (!teacher) return null;

    const isActive = (path) =>
        path === '/teacher-portal' ? pathname === path : pathname.startsWith(path);

    /* ── Shared nav list ─────────────────────────────────── */
    const NavItems = ({ compact = false }) => (
        <>
            {menuItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={`flex items-center ${compact ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3.5'} rounded-2xl transition-all group
                            ${active ? 'bg-white/10 text-white shadow-lg shadow-black/10' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
                    >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-white/40 group-hover:text-white'}`} />
                        {!compact && <span className="font-bold text-sm tracking-tight truncate flex-1">{item.name}</span>}
                        {active && !compact && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                    </NavLink>
                );
            })}
        </>
    );

    /* ── Desktop sidebar ─────────────────────────────────── */
    const desktopWidth = collapsed ? 'w-[72px]' : 'w-72';

    return (
        <>
            {/* ── Mobile top bar ──────────────────────────────── */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-[#463a7a] border-b border-white/5 flex items-center justify-between px-5 z-[60] shadow-xl">
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white"
                    >
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                            <Zap size={14} className="text-white fill-current" />
                        </div>
                        <span className="font-black text-white tracking-widest text-sm uppercase">Optimus</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-white text-sm border-2 border-white/20">
                        {teacher.name?.[0] ?? '?'}
                    </div>
                </div>
            )}

            {/* ── Mobile drawer overlay ────────────────────────── */}
            {isMobile && drawerOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* ── Mobile drawer ────────────────────────────────── */}
            {isMobile && (
                <aside className={`fixed inset-y-0 left-0 w-72 z-[80] flex flex-col bg-gradient-to-b from-[#463a7a] to-[#2d2550] shadow-2xl transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    {/* Close */}
                    <button
                        onClick={() => setDrawerOpen(false)}
                        className="absolute top-5 right-5 w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 text-white/60 hover:text-white"
                    >
                        <X size={18} />
                    </button>

                    {/* Brand */}
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                                <Zap size={20} className="text-white fill-current" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-white tracking-tighter leading-none">OPTIMUS</p>
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Teacher</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                        <NavItems />
                    </nav>

                    {/* User + logout */}
                    <div className="p-4 border-t border-white/5">
                        <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl mb-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-black text-white truncate">{teacher.name}</p>
                                <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Teacher</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all font-black text-[10px] tracking-widest"
                        >
                            <LogOut className="w-4 h-4" />
                            SIGN OUT
                        </button>
                    </div>
                </aside>
            )}

            {/* ── Desktop sidebar ──────────────────────────────── */}
            {!isMobile && (
                <aside className={`${desktopWidth} h-full flex-shrink-0 flex flex-col bg-gradient-to-b from-[#463a7a] to-[#2d2550] shadow-2xl transition-all duration-300 relative`}>
                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="absolute -right-3 top-20 w-7 h-7 bg-[#463a7a] border border-white/10 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all z-10"
                    >
                        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                    </button>

                    {/* Brand */}
                    <div className={`px-5 pt-6 pb-4 ${collapsed ? 'flex justify-center' : ''}`}>
                        <div className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                                <Zap size={20} className="text-white fill-current" />
                            </div>
                            {!collapsed && (
                                <div>
                                    <p className="text-xl font-black text-white tracking-tighter leading-none">OPTIMUS</p>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Teacher</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
                        <NavItems compact={collapsed} />
                    </nav>

                    {/* User + logout */}
                    <div className="p-4 border-t border-white/5">
                        <div className={`flex items-center gap-3 p-3 bg-white/5 rounded-2xl ${collapsed ? 'justify-center' : ''}`}>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            {!collapsed && (
                                <div className="overflow-hidden">
                                    <p className="text-sm font-black text-white truncate">{teacher.name}</p>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider">Teacher</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleLogout}
                            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3.5 mt-2 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all group font-black text-[10px] tracking-widest`}
                        >
                            <LogOut className="w-4 h-4 opacity-50 group-hover:opacity-100 flex-shrink-0" />
                            {!collapsed && 'SIGN OUT'}
                        </button>
                    </div>
                </aside>
            )}

            {/* ── Mobile bottom tab bar ────────────────────────── */}
            {isMobile && (
                <nav className="fixed bottom-0 left-0 right-0 z-[60] bg-[#463a7a] border-t border-white/10 flex items-stretch shadow-2xl shadow-black/30">
                    {menuItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all ${active ? 'text-white' : 'text-white/40'}`}
                            >
                                <div className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all ${active ? 'bg-white/15' : ''}`}>
                                    <item.icon className="w-5 h-5" />
                                    {active && <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />}
                                </div>
                                <span className="text-[10px] font-black tracking-wide uppercase">{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            )}
        </>
    );
}
