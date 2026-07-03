import { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { useAdmin } from "../context/AdminContext";
import {
  FaCalendarAlt,
  FaUserFriends,
  FaCreditCard,
  FaBell,
  FaUserGraduate,
  FaFileAlt,
  FaCog,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaUserPlus,
  FaListUl,
  FaBook,
  FaReceipt,
  FaHistory,
  FaUserCog,
  FaShieldAlt,
  FaPalette,
  FaBars,
  FaTimes,
  FaBolt,
  FaAward,
  FaTachometerAlt,
  FaBox,
  FaSync,
  FaSignOutAlt,
  FaBuilding,
  FaInbox
} from "react-icons/fa";
import { Link, Outlet, useLocation, useNavigate } from "react-router";

export default function Sidebar() {
  const { unreadCount } = useNotifications();
  const { admin, logout, isSuperAdmin, centerName } = useAdmin();
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Auth guard — redirect to admin login if not authenticated
  useEffect(() => {
    if (!admin) navigate('/admin-login');
  }, [admin, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  // Check for mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(true); // Always expanded on mobile when open
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { icon: FaCalendarAlt, label: "Calendar", link: "/schedule" },
    {
      icon: FaUserFriends,
      label: "Staff",
      link: "/teacher",
      submenus: [
        { icon: FaListUl, label: "All Staff", link: "/teacher" },
        { icon: FaUserPlus, label: "Add Staff", link: "/teacher/add" },
      ]
    },
    {
      icon: FaUserGraduate,
      label: "Students",
      link: "/students",
      submenus: [
        { icon: FaListUl, label: "All Students", link: "/students" },
        { icon: FaUserPlus, label: "Add Student", link: "/students/add" },
        { icon: FaUserCog, label: "Student Progress", link: "/students/progress" },
        { icon: FaBook, label: "Enrollments", link: "/students/enrollments" },
        { icon: FaInbox, label: "Form Submissions", link: "/students/forms" },
      ]
    },
    {
      icon: FaCreditCard,
      label: "Payments",
      link: "/admin/payments",
      submenus: [
        { icon: FaTachometerAlt, label: "Overview", link: "/admin/payments" },
        { icon: FaReceipt, label: "Invoices", link: "/admin/invoices" },
        { icon: FaBox, label: "Packages", link: "/admin/packages" },
        { icon: FaSync, label: "Subscriptions", link: "/admin/subscriptions" },
        { icon: FaHistory, label: "History", link: "/admin/payments/history" },
      ]
    },
    {
      icon: FaBook,
      label: "Curriculum",
      link: "/admin/curriculum",
      submenus: [
        { icon: FaListUl, label: "Dashboard", link: "/admin/curriculum" },
        { icon: FaBook, label: "Subjects", link: "/admin/subjects" },
        { icon: FaAward, label: "Grades", link: "/admin/grades" },
{ icon: FaFileAlt, label: "Exams", link: "/admin/exams" },
        { icon: FaBolt, label: "Syllabus Builder", link: "/admin/syllabus" },
      ]
    },
    { icon: FaBell, label: "Notifications", link: "/notifications" },
    { icon: FaFileAlt, label: "Reports", link: "/reports" },
    { icon: FaCog, label: "Settings", link: "/settings" },
  ].filter(item => {
    // Only super admins see global Settings
    if (item.label === "Settings" && !isSuperAdmin) return false;
    return true;
  });

  const toggleSubmenu = (label) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const isActive = (link) => location.pathname === link;
  const isParentActive = (item) => {
    if (item.submenus) {
      return item.submenus.some(sub => location.pathname === sub.link);
    }
    return location.pathname === item.link;
  };

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className={`flex items-center ${isExpanded ? "justify-between" : "justify-center"}`}>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
              <FaBolt size={18} className="text-white" />
            </div>
            {isExpanded && (
              <span className="text-lg font-bold tracking-wide">OPTIMUS</span>
            )}
          </Link>
        </div>
      </div>

      {/* Desktop Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-4 -right-3 w-6 h-6 bg-[#463a7a] border border-white/30 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform z-50"
        >
          {isExpanded ? <FaChevronLeft size={10} /> : <FaChevronRight size={10} />}
        </button>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasSubmenus = item.submenus && item.submenus.length > 0;
          const isOpen = expandedMenu === item.label;
          const parentActive = isParentActive(item);

          return (
            <div key={item.label}>
              {hasSubmenus ? (
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`w-full flex items-center ${isExpanded ? "justify-between" : "justify-center"} p-2.5 rounded-lg transition-colors ${parentActive ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <div className={`flex items-center ${isExpanded ? "gap-3" : ""}`}>
                    <Icon size={18} />
                    {isExpanded && <span className="text-sm">{item.label}</span>}
                  </div>
                  {isExpanded && (isOpen ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />)}
                </button>
              ) : (
                <Link
                  to={item.link}
                  className={`flex items-center ${isExpanded ? "gap-3" : "justify-center"} p-2.5 rounded-lg transition-colors ${isActive(item.link) ? "bg-white/20" : "hover:bg-white/10"}`}
                >
                  <div className="relative flex-shrink-0">
                    <Icon size={18} />
                    {item.link === "/notifications" && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                  {isExpanded && (
                    <span className="text-sm flex-1">{item.label}</span>
                  )}
                  {isExpanded && item.link === "/notifications" && unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full leading-none">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Submenus */}
              {hasSubmenus && isOpen && isExpanded && (
                <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/20 pl-3">
                  {item.submenus.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.label}
                        to={sub.link}
                        className={`flex items-center gap-2 p-2 rounded-md text-xs transition-colors ${isActive(sub.link) ? "bg-white/15" : "text-white/70 hover:text-white hover:bg-white/5"}`}
                      >
                        <SubIcon size={12} />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 space-y-2">
        {/* Center badge */}
        {isExpanded && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/10">
            <FaBuilding size={11} className="text-white/70 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-white/90 truncate">
              {isSuperAdmin ? "All Centers" : (centerName || "No center assigned")}
            </span>
          </div>
        )}

        {/* Admin profile */}
        {isExpanded && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {(admin?.name || "VA").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{admin?.name || "Vama Admin"}</p>
              <p className="text-[10px] text-white/60 truncate">
                {isSuperAdmin ? "Super Admin" : "Center Admin"}
              </p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center ${isExpanded ? "gap-3 px-2" : "justify-center"} py-2 rounded-lg text-white/70 hover:text-white hover:bg-red-500/20 transition-colors`}
        >
          <FaSignOutAlt size={16} className="flex-shrink-0" />
          {isExpanded && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-[#463a7a] text-white flex items-center justify-between px-4 z-40 shadow-lg">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-white/10"
          >
            <FaBars size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center">
              <FaBolt size={14} className="text-white" />
            </div>
            <span className="font-bold">OPTIMUS</span>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 transform ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}`
            : `relative ${isExpanded ? "w-56" : "w-16"}`
          }
          ${isMobile ? "w-64" : ""}
          bg-gradient-to-b from-[#463a7a] to-[#2d2550]
          text-white flex flex-col
          transition-all duration-200 ease-out
          shadow-xl
        `}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10"
          >
            <FaTimes size={18} />
          </button>
        )}

        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 bg-gray-50 overflow-auto ${isMobile ? "pt-14" : ""}`}>
        <Outlet />
      </main>
    </div>
  );
}