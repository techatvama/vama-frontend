import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router';
import {
    Calendar,
    LayoutDashboard,
    LogOut,
    Music,
    Zap,
    BookOpen,
    FileText,
    CreditCard,
    User,
    ChevronLeft,
    ChevronRight,
    Menu,
    X,
    CheckCircle2
} from 'lucide-react';

export default function StudentSidebar() {
    const [student, setStudent] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();
    const { pathname } = useLocation();

    useEffect(() => {
        const stored = localStorage.getItem('student');
        if (stored) {
            setStudent(JSON.parse(stored));
        } else {
            navigate('/student-login');
        }

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) setIsExpanded(true);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('student');
        navigate('/student-login');
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/student-portal' },
        { name: 'My Schedule', icon: Calendar, path: '/student-portal/schedule' },
        { name: 'Attendance', icon: CheckCircle2, path: '/student-portal/attendance' },
        { name: 'Curriculum', icon: BookOpen, path: '/student-portal/progress' },
        { name: 'Materials', icon: FileText, path: '/student-portal/materials' },
        { name: 'Payments', icon: CreditCard, path: '/student-portal/payments' },
    ];

    if (!student) return null;

    const SidebarContent = () => (
        <>
            {/* Brand */}
            <div className="p-8">
                <div className={`flex items-center ${isExpanded ? 'gap-4' : 'justify-center'}`}>
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-900/30 flex-shrink-0">
                        <Zap size={24} className="text-white fill-current" />
                    </div>
                    {isExpanded && (
                        <div className="flex flex-col min-w-0">
                            <span className="text-2xl font-black text-slate-900 tracking-tighter leading-none">OPTIMUS</span>
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Student</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} px-4 py-4 rounded-[24px] transition-all group ${isActive
                                ? 'bg-[#463a7a] text-white shadow-xl shadow-indigo-900/20'
                                : 'text-slate-400 hover:text-[#463a7a] hover:bg-slate-50'
                                }`}
                        >
                            <div className={`flex items-center ${isExpanded ? 'gap-4' : ''}`}>
                                <item.icon className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-[#463a7a]'}`} />
                                {isExpanded && <span className="font-black text-sm tracking-tight truncate uppercase">{item.name}</span>}
                            </div>
                            {isActive && isExpanded && <div className="w-2 h-2 rounded-full bg-orange-400" />}
                        </NavLink>
                    );
                })}
            </nav>

            {/* Profile Box */}
            <div className="p-4 mt-auto">
                <div className={`p-4 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-3 ${!isExpanded ? 'justify-center' : ''}`}>
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm flex-shrink-0">
                        <User className="text-[#463a7a]" />
                    </div>
                    {isExpanded && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-black text-slate-900 truncate">{student.first_name}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{student.course}</p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center ${isExpanded ? 'gap-3 px-4' : 'justify-center'} py-5 mt-4 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-[24px] transition-all font-black text-[10px] tracking-widest uppercase`}
                >
                    <LogOut size={20} className="opacity-40" />
                    {isExpanded && "Sign Out"}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Top Header */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 z-[60]">
                    <button onClick={() => setIsMobileOpen(true)} className="text-[#463a7a] p-2 hover:bg-slate-50 rounded-xl transition-all">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center gap-2">
                        <Zap size={20} className="text-[#463a7a] fill-current" />
                        <span className="font-black text-slate-900 tracking-tighter text-xl">Optimus</span>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-[#463a7a] text-xs border border-slate-100">
                        {student?.first_name?.[0] || '?'}
                    </div>
                </div>
            )}

            {/* Mobile Overlay */}
            {isMobile && isMobileOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] animate-in fade-in" onClick={() => setIsMobileOpen(false)} />
            )}

            {/* Sidebar Aside */}
            <aside className={`
        ${isMobile
                    ? `fixed inset-y-0 left-0 z-[80] transition-transform duration-500 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`
                    : `sticky top-0 h-screen transition-all duration-300 ${isExpanded ? 'w-80' : 'w-28'}`
                }
        bg-white flex flex-col border-r border-slate-100 z-[80]
      `}>
                {!isMobile && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="absolute -right-4 top-10 w-8 h-8 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[#463a7a] shadow-xl hover:scale-110 active:scale-95 transition-all z-[90]"
                    >
                        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                )}

                {isMobile && (
                    <button onClick={() => setIsMobileOpen(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={24} />
                    </button>
                )}

                <SidebarContent />
            </aside>
        </>
    );
}
