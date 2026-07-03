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
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
            <TeacherSidebar />
            <main className="flex-1 min-w-0 overflow-y-auto">
                <div className="pt-16 lg:pt-0 pb-20 lg:pb-0">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
