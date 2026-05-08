import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Link } from 'react-router';
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

export default function TeacherSidebar() {
    const [teacher, setTeacher] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('teacher');
        if (stored) {
            setTeacher(JSON.parse(stored));
        } else {
            navigate('/teacher-login');
        }

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) {
                setIsExpanded(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [navigate]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem('teacher');
        navigate('/teacher-login');
    };

    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/teacher-portal' },
        { name: 'Calendar', icon: Calendar, path: '/teacher-portal/calendar' },
        { name: 'Students', icon: Users, path: '/teacher-portal/students' },
        { name: 'Materials', icon: FileText, path: '/teacher-portal/materials' },
    ];

    if (!teacher) return null;

    const SidebarContent = () => (
        <>
            {/* Brand */}
            <div className="p-6">
                <div className={`flex items-center ${isExpanded ? 'gap-3' : 'justify-center'}`}>
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-900/20 flex-shrink-0">
                        <Zap size={20} className="text-white fill-current" />
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-xl font-black text-white tracking-tighter leading-none truncate">OPTIMUS</span>
                            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-0.5">Teacher</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} px-4 py-3.5 rounded-2xl transition-all group ${isActive
                                    ? 'bg-white/10 text-white shadow-xl shadow-black/10'
                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <div className={`flex items-center ${isExpanded ? 'gap-3' : ''}`}>
                                <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-white/40 group-hover:text-white'}`} />
                                {isExpanded && <span className="font-bold text-sm tracking-tight truncate">{item.name}</span>}
                            </div>
                            {isActive && isExpanded && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* User Info */}
            <div className="p-4 mt-auto">
                <div className={`p-4 bg-white/5 rounded-[24px] flex items-center gap-3 border border-white/5 ${!isExpanded ? 'justify-center' : ''}`}>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center border border-white/10 shadow-lg flex-shrink-0">
                        <User className="w-5 h-5 text-white" />
                    </div>
                    {isExpanded && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-white truncate">{teacher.name}</p>
                            <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider truncate">{teacher.role}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center'} py-4 mt-4 text-white/60 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all group font-black text-[10px] tracking-widest`}
                >
                    <LogOut className="w-5 h-5 opacity-40 group-hover:opacity-100 flex-shrink-0" />
                    {isExpanded && "SIGN OUT"}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Top Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-[#463a7a] border-b border-white/5 flex items-center justify-between px-6 z-[60]">
                    <button onClick={() => setIsMobileOpen(true)} className="text-white p-2">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-orange-400 fill-current" />
                        <span className="font-black text-white tracking-widest text-sm uppercase">Optimus</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-white text-xs border border-white/20">
                        {teacher.name[0]}
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar Aside */}
            <aside className={`
        ${isMobile
                    ? `fixed inset-y-0 left-0 z-[80] transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `sticky top-0 h-screen transition-all duration-300 ${isExpanded ? 'w-72' : 'w-24'}`
                }
        bg-gradient-to-b from-[#463a7a] to-[#2d2550] flex flex-col shadow-2xl flex-shrink-0
      `}>
                {/* Toggle Button for Desktop */}
                {!isMobile && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute -right-3 top-20 w-7 h-7 bg-[#463a7a] border border-white/10 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all z-10"
                    >
                        {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                    </button>
                )}

                {isMobile && (
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="absolute top-6 right-6 text-white/40 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                )}

                <SidebarContent />
            </aside>
        </>
    );
}
