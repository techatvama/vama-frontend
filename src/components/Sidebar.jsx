// import React from "react";
// import { Calendar, Cloud, Users2, LayoutGrid, Folder, GraduationCap, MessageCircle, CreditCard, ClipboardList, Users, Settings } from "lucide-react";
// import { Link, Outlet } from "react-router";

// export default function Sidebar() {
//   const icons = [
//     [Calendar], [Cloud], [Users2,"/teacher"], [LayoutGrid], [Folder], [GraduationCap], [MessageCircle], [CreditCard], [ClipboardList], [Users], [Settings]];
//   return (
//     <div className="flex flex-row">
//     <aside className="w-16 bg-[#463a7a] text-white min-h-screen p-2 flex flex-col items-center space-y-6">
//       <Link to="/"><img src="/assets/logo.png" alt="Logo" className="h-8 mt-2" /></Link>
//       {icons.map(([Icon,link],i) => (
//         <Link to={link} ><Icon key={i} /></Link>
//       ))}
//     </aside>
//     <Outlet/>
//     </div>
//   );
// }
import React, { useState } from "react";
import {
  FaCalendarAlt,    // Calendar
  FaUserFriends,    // Users2 (substitute for premium feel)
  FaCreditCard,     // Payments
  FaBell,           // Bell
  FaUserGraduate,   // GraduationCap
  FaFileAlt,        // Report
  FaCog             // Settings
} from "react-icons/fa";
import { Link, Outlet, useLocation } from "react-router-dom";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: FaCalendarAlt, label: "Calendar", link: "/" },
    { icon: FaUserFriends, label: "Users", link: "/teacher" },
    { icon: FaCreditCard, label: "Payments", link: "/payments" },
    { icon: FaBell, label: "Notifications", link: "/notifications" },
    { icon: FaUserGraduate, label: "Grades", link: "/students" },
    { icon: FaFileAlt, label: "Report", link: "/reports" },
    { icon: FaCog, label: "Settings", link: "/settings" },
  ];

  return (
    <div className="flex flex-row">
      <aside className={`${isExpanded ? "w-64" : "w-16"} bg-[#463a7a] text-white min-h-screen p-3 flex flex-col justify-between transition-all duration-300 shadow-xl`}>
        <div>
          <div className="flex items-center justify-between mb-8">
            <Link to="/">
              <img src="/assets/logo.png" alt="Logo" className="h-8" />
            </Link>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-white/20 transition"
            >
              <FaCog size={20} />
            </button>
          </div>
          <nav className="space-y-2">
            {menuItems.map(({ icon: Icon, label, link }) => {
              const active = location.pathname === link;
              return (
                <Link
                  key={label}
                  to={link}
                  className={`flex items-center p-2 rounded-md hover:bg-white/20 transition ${active ? "bg-white/30" : ""}`}
                >
                  <Icon size={22} className="mr-3" />
                  {isExpanded && <span className="text-sm">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-6">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-400 p-3 rounded-xl hover:opacity-90 transition"
          >
            <span className="text-xs font-semibold">Pro Sidebar</span>
            {isExpanded && (
              <span className="text-[10px] opacity-80">View code</span>
            )}
          </a>
        </div>
      </aside>
      <main className="flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}