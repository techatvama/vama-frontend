import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import { X, UserPlus, Check, XCircle, Clock, Calendar, MoreVertical, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

export default function SessionDetailDialog({ session, isOpen, onClose, onUpdate }) {
    const [activeTab, setActiveTab] = useState('attendance');
    const [students, setStudents] = useState([]); // All available students for search
    const [enrolledStudents, setEnrolledStudents] = useState([]); // Students in this class
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [attendanceState, setAttendanceState] = useState({}); // { studentId: 'present' | 'absent' }

    useEffect(() => {
        if (isOpen && session) {
            fetchDetails();
            fetchAllStudents();
        }
    }, [isOpen, session]);

    const fetchDetails = async () => {
        if (!session?.id) return;
        try {
            const res = await api.get(`/sessions/${session.id}`);
            const sessionData = res.data;

            if (sessionData.attendances && sessionData.attendances.length > 0) {
                const studentsFromAttendance = sessionData.attendances.map(a => a.student).filter(Boolean);
                // Filter unique students
                const uniqueStudents = Array.from(new Map(studentsFromAttendance.map(s => [s.id, s])).values());
                setEnrolledStudents(uniqueStudents);

                const attState = {};
                sessionData.attendances.forEach(a => {
                    attState[a.student_id] = a.status;
                });
                setAttendanceState(attState);
            } else {
                setEnrolledStudents([]);
            }

        } catch (e) {
            console.error("Failed to fetch session details", e);
        }
    };

    const fetchAllStudents = async () => {
        try {
            const res = await api.get('/students');
            setStudents(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const markAttendance = async (studentId, status) => {
        try {
            // Optimistic update
            setAttendanceState(prev => ({ ...prev, [studentId]: status }));

            await api.post(`/sessions/${session.id}/attendance`, {
                student_id: studentId,
                status: status
            });
            onUpdate(); // Refresh parent
        } catch (e) {
            console.error("Failed to mark attendance", e);
        }
    };

    const markAll = async (status) => {
        for (const student of enrolledStudents) {
            markAttendance(student.id, status);
        }
    };

    const removeStudent = async (studentId) => {
        if (!session?.batch_id) return;
        try {
            await api.delete(`/batches/${session.batch_id}/students/${studentId}`);
            setEnrolledStudents(prev => prev.filter(s => s.id !== studentId));
            onUpdate();
        } catch (e) {
            console.error("Failed to remove student", e);
        }
    };

    if (!isOpen || !session) return null;

    const filteredStudents = students.filter(s =>
        (s.first_name + ' ' + s.last_name).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{parseSubject(session.batch?.subject) || 'Class Details'}</h2>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{session.start_time} - {session.end_time}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>{session.date}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-6">
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={cn("py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors", activeTab === 'attendance' ? "border-[#463A7A] text-[#463A7A]" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Attendance
                    </button>
                    <button
                        onClick={() => setActiveTab('students')}
                        className={cn("py-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors", activeTab === 'students' ? "border-[#463A7A] text-[#463A7A]" : "border-transparent text-gray-500 hover:text-gray-700")}
                    >
                        Students ({enrolledStudents.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'attendance' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium text-gray-700">Mark Attendance</h3>
                                <button onClick={() => markAll('present')} className="text-sm text-[#463A7A] font-medium hover:underline">Mark All Present</button>
                            </div>

                            <div className="space-y-2">
                                {enrolledStudents.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-[#463A7A] font-bold text-xs">
                                                {student.first_name[0]}{student.last_name[0]}
                                            </div>
                                            <span className="font-medium text-gray-800">{student.first_name} {student.last_name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => markAttendance(student.id, 'present')}
                                                className={cn("p-1.5 rounded-md transition-all", attendanceState[student.id] === 'present' ? "bg-green-100 text-green-600" : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50")}
                                                title="Present"
                                            >
                                                <Check size={16} />
                                            </button>
                                            <button
                                                onClick={() => markAttendance(student.id, 'absent')}
                                                className={cn("p-1.5 rounded-md transition-all", attendanceState[student.id] === 'absent' ? "bg-red-100 text-red-600" : "bg-white text-gray-400 border border-gray-200 hover:bg-gray-50")}
                                                title="Absent"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && (
                        <div className="space-y-4">
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    placeholder="Search student to add..."
                                    className="flex-1 p-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#463A7A]"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {searchQuery && (
                                <div className="bg-white border rounded-lg shadow-sm mb-4">
                                    {filteredStudents.slice(0, 3).map(s => (
                                        <div key={s.id} className="p-2 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                            onClick={async () => {
                                                try {
                                                    await api.post('/enrollments', {
                                                        student_id: s.id,
                                                        batch_id: session.batch_id,
                                                        enrollment_type: 'recurring'
                                                    });
                                                    setEnrolledStudents([...enrolledStudents, s]);
                                                    setSearchQuery('');
                                                } catch (e) {
                                                    console.error("Failed to enroll student", e);
                                                }
                                            }}
                                        >
                                            <span>{s.first_name} {s.last_name}</span>
                                            <UserPlus size={14} className="text-[#463A7A]" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-2">
                                {enrolledStudents.map(student => (
                                    <div key={student.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                                        <span>{student.first_name} {student.last_name}</span>
                                        <button
                                            onClick={() => removeStudent(student.id)}
                                            className="text-red-400 hover:text-red-600"
                                            title="Remove student from batch"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onUpdate} className="px-4 py-2 bg-[#463A7A] text-white rounded-lg hover:bg-[#342a5b]">
                        Done
                    </button>
                </div>
            </div>
        </div >
    );
}
