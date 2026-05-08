import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import TeacherSidebar from './TeacherSidebar';

export default function TeacherPortal() {
    const navigate = useNavigate();

    useEffect(() => {
        const teacher = localStorage.getItem('teacher');
        if (!teacher) {
            navigate('/teacher-login');
        }
    }, [navigate]);

    return (
        <div className="flex bg-slate-50 min-h-screen font-sans overflow-x-hidden">
            <TeacherSidebar />
            <main className="flex-1 min-w-0 transition-all duration-300">
                <div className="pt-16 lg:pt-0 min-h-screen">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
