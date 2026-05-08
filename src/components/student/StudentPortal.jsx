import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import StudentSidebar from './StudentSidebar';

export default function StudentPortal() {
    const navigate = useNavigate();

    useEffect(() => {
        const student = localStorage.getItem('student');
        if (!student) {
            navigate('/student-login');
        }
    }, [navigate]);

    return (
        <div className="flex bg-[#f8fafc] min-h-screen font-sans overflow-x-hidden">
            <StudentSidebar />
            <main className="flex-1 min-w-0 transition-all duration-300">
                <div className="pt-16 lg:pt-0 min-h-screen border-l border-white/40">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
