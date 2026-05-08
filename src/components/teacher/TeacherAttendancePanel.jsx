import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { parseSubject } from '../../lib/utils';
import {
    CheckCircle, XCircle, Clock, User, Save, MessageSquare,
    BookOpen, ChevronRight, TrendingUp, Award
} from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherAttendancePanel({ session, teacherId }) {
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});
    const [feedbackData, setFeedbackData] = useState({});
    const [syllabusProgress, setSyllabusProgress] = useState({});
    const [sessionNotes, setSessionNotes] = useState('');

    useEffect(() => {
        fetchSessionDetails();
    }, [session.id]);

    const fetchSessionDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/teacher/${teacherId}/session/${session.id}/details`);
            setStudents(res.data.students || []);
            setAttendanceData(res.data.attendance || {});
            setFeedbackData(res.data.feedback || {});
            setSyllabusProgress(res.data.syllabus_progress || {});
            setSessionNotes(res.data.session_notes || '');
        } catch (err) {
            console.error(err);
            // Mock data
            const mockStudents = [
                { id: 1, first_name: 'Alice', last_name: 'Johnson', avatar: null },
                { id: 2, first_name: 'Bob', last_name: 'Smith', avatar: null },
                { id: 3, first_name: 'Charlie', last_name: 'Brown', avatar: null }
            ];
            setStudents(mockStudents);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (studentId, status) => {
        setAttendanceData(prev => ({ ...prev, [studentId]: status }));

        try {
            await api.post(`/teacher/${teacherId}/mark-attendance`, {
                session_id: session.id,
                student_id: studentId,
                status: status
            });
        } catch (err) {
            console.error(err);
        }
    };

    const saveFeedback = async (studentId) => {
        try {
            await api.post(`/teacher/${teacherId}/save-feedback`, {
                session_id: session.id,
                student_id: studentId,
                feedback: feedbackData[studentId] || '',
                syllabus_progress: syllabusProgress[studentId] || ''
            });

            alert('Feedback saved successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to save feedback');
        }
    };

    const saveSessionNotes = async () => {
        setLoading(true);
        try {
            await api.post(`/teacher/${teacherId}/session-notes`, {
                session_id: session.id,
                notes: sessionNotes
            });

            alert('Session notes saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save notes');
        } finally {
            setLoading(false);
        }
    };

    const getAttendanceStats = () => {
        const present = Object.values(attendanceData).filter(s => s === 'present').length;
        const absent = Object.values(attendanceData).filter(s => s === 'absent').length;
        const total = students.length;
        return { present, absent, total, unmarked: total - present - absent };
    };

    const stats = getAttendanceStats();

    return (
        <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#463a7a] to-[#2d2550] p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-white mb-2">Class Management</h3>
                        <p className="text-white/80">
                            {parseSubject(session.batch?.subject)} • {format(new Date(session.date), 'MMM d, yyyy')} • {session.start_time}
                        </p>
                    </div>

                    {/* Attendance Stats */}
                    <div className="flex gap-4">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3">
                            <div className="text-white/80 text-xs mb-1">Present</div>
                            <div className="text-2xl font-black text-white">{stats.present}/{stats.total}</div>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-3">
                            <div className="text-white/80 text-xs mb-1">Absent</div>
                            <div className="text-2xl font-black text-white">{stats.absent}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Student List */}
            <div className="p-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#463a7a] border-t-transparent"></div>
                    </div>
                ) : (
                    students.map((student) => {
                        const attendance = attendanceData[student.id];
                        const feedback = feedbackData[student.id] || '';
                        const progress = syllabusProgress[student.id] || '';

                        return (
                            <div
                                key={student.id}
                                className="border-2 border-slate-100 rounded-3xl p-6 hover:border-[#463a7a]/30 transition-all"
                            >
                                {/* Student Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#463a7a] to-[#5e4fa2] flex items-center justify-center text-white font-bold text-lg">
                                            {student.first_name[0]}{student.last_name[0]}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-lg">
                                                {student.first_name} {student.last_name}
                                            </h4>
                                            <p className="text-sm text-slate-500">Student ID: #{student.id}</p>
                                        </div>
                                    </div>

                                    {/* Attendance Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => markAttendance(student.id, 'present')}
                                            className={`
                        flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all
                        ${attendance === 'present'
                                                    ? 'bg-emerald-500 text-white shadow-lg scale-105'
                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}
                      `}
                                        >
                                            <CheckCircle size={20} />
                                            Present
                                        </button>

                                        <button
                                            onClick={() => markAttendance(student.id, 'absent')}
                                            className={`
                        flex items-center gap-2 px-5 py-3 rounded-full font-semibold transition-all
                        ${attendance === 'absent'
                                                    ? 'bg-red-500 text-white shadow-lg scale-105'
                                                    : 'bg-red-100 text-red-700 hover:bg-red-200'}
                      `}
                                        >
                                            <XCircle size={20} />
                                            Absent
                                        </button>
                                    </div>
                                </div>

                                {/* Expandable Details */}
                                {attendance && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-fadeIn">
                                        {/* Syllabus Progress */}
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                                <BookOpen size={16} />
                                                Today's Syllabus Coverage
                                            </label>
                                            <input
                                                type="text"
                                                value={progress}
                                                onChange={(e) => setSyllabusProgress(prev => ({
                                                    ...prev,
                                                    [student.id]: e.target.value
                                                }))}
                                                placeholder="E.g., Scales: C Major, Piece: Fur Elise - Bars 1-16"
                                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#463a7a] focus:outline-none"
                                            />
                                        </div>

                                        {/* Feedback */}
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                                                <MessageSquare size={16} />
                                                Performance Feedback
                                            </label>
                                            <textarea
                                                value={feedback}
                                                onChange={(e) => setFeedbackData(prev => ({
                                                    ...prev,
                                                    [student.id]: e.target.value
                                                }))}
                                                placeholder="How did the student perform today? Any areas for improvement?"
                                                className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-[#463a7a] focus:outline-none resize-none"
                                                rows="3"
                                            />
                                        </div>

                                        {/* Quick Rating */}
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-bold text-slate-700">Quick Rating:</span>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onClick={() => setFeedbackData(prev => ({
                                                        ...prev,
                                                        [student.id]: `${prev[student.id] || ''}\nRating: ${star}/5 stars`
                                                    }))}
                                                    className="text-2xl hover:scale-125 transition-transform"
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>

                                        {/* Save Button */}
                                        <button
                                            onClick={() => saveFeedback(student.id)}
                                            className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#463a7a] to-[#5e4fa2] text-white font-semibold hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                        >
                                            <Save size={18} />
                                            Save Student Progress
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}

                {/* Session Notes */}
                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border-2 border-slate-200">
                    <label className="flex items-center gap-2 text-lg font-bold text-slate-900 mb-3">
                        <MessageSquare size={20} />
                        Overall Session Notes
                    </label>
                    <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="General observations about today's class, topics covered, announcements, etc."
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-[#463a7a] focus:outline-none resize-none"
                        rows="4"
                    />

                    <button
                        onClick={saveSessionNotes}
                        disabled={loading}
                        className="mt-4 px-6 py-3 rounded-full bg-[#463a7a] text-white font-semibold hover:bg-[#5e4fa2] transition-all"
                    >
                        {loading ? 'Saving...' : 'Save Session Notes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
