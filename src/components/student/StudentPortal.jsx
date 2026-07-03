import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import StudentSidebar from './StudentSidebar';
import ChildSwitcher from './ChildSwitcher';

export default function StudentPortal() {
    const navigate = useNavigate();

    useEffect(() => {
        const student = localStorage.getItem('student');
        if (!student) {
            navigate('/student-login');
        }
    }, [navigate]);

    return (
        <div className="flex h-screen overflow-hidden bg-[#f8fafc] font-sans">
            <StudentSidebar />
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
                    <ChildSwitcher />
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
