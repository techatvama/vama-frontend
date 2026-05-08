import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
    FaUser,
    FaMusic,
    FaPlus,
    FaCheck,
    FaTimes,
    FaEdit,
    FaSave,
    FaChevronDown,
    FaChevronRight,
    FaUndo,
    FaLightbulb,
    FaHistory,
    FaComment,
    FaTrash,
    FaSearch,
    FaExclamationTriangle
} from 'react-icons/fa'
import { api } from '../lib/api';

// Status colors matching theme
const STATUS_CONFIG = {
    'not-yet': { label: 'Not Yet', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
    'in-progress': { label: 'In Progress', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300', dot: 'bg-amber-500' },
    'done': { label: 'Done', bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300', dot: 'bg-emerald-500' }
}

// Circular Progress Component
function CircularProgress({ value, size = 80, strokeWidth = 8 }) {
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (value / 100) * circumference

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    stroke="url(#gradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-500 ease-out"
                />
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#463a7a" />
                        <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-800">{Math.round(value)}%</span>
            </div>
        </div>
    )
}

// Status Toggle Button
function StatusToggle({ status, onChange, itemName, disabled }) {
    const statuses = ['not-yet', 'in-progress', 'done']
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['not-yet']

    const cycle = () => {
        if (disabled) return
        const idx = statuses.indexOf(status)
        onChange(statuses[(idx + 1) % statuses.length])
    }

    return (
        <button
            onClick={cycle}
            disabled={disabled}
            aria-label={`Status for ${itemName}: ${config.label}. Click to change.`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${config.bg} ${config.text} ${config.border} ${disabled ? 'opacity-50' : 'hover:scale-105 active:scale-95'}`}
        >
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            {config.label}
        </button>
    )
}

// Editable Text
function EditableText({ value, onChange, placeholder = "Enter text...", className = "", disabled }) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(value)

    useEffect(() => {
        setText(value)
    }, [value])

    const save = () => {
        if (text !== value) {
            onChange(text);
        }
        setEditing(false);
    }

    if (editing && !disabled) {
        return (
            <div className="flex items-center gap-1">
                <input
                    autoFocus
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onBlur={save}
                    onKeyDown={(e) => e.key === 'Enter' && save()}
                    className={`border-b border-[#463a7a] bg-transparent outline-none text-sm ${className}`}
                    placeholder={placeholder}
                />
            </div>
        )
    }

    return (
        <span
            onClick={() => !disabled && setEditing(true)}
            className={`cursor-pointer hover:bg-slate-100 rounded px-1 -mx-1 ${className}`}
            title={disabled ? "" : "Click to edit"}
        >
            {value || <span className="text-slate-400 italic">{placeholder}</span>}
        </span>
    )
}

// Section Component
function SyllabusSection({ section, onUpdateProgress, disabled }) {
    const [expanded, setExpanded] = useState(true)

    const items = section.contents || []
    const completedCount = items.filter(i => i.progress?.status === 'done').length
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0)
    const completedWeight = items.filter(i => i.progress?.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Section Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-3 sm:p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                aria-expanded={expanded}
            >
                <div className="flex items-center gap-2">
                    {expanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base">{section.name}</h3>
                    <span className="text-xs text-slate-500">({completedCount}/{items.length})</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-[#463a7a] to-[#7c3aed] transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{Math.round(progress)}%</span>
                    </div>
                </div>
            </button>

            {/* Items */}
            {expanded && (
                <div className="divide-y divide-slate-100">
                    {items.length === 0 && (
                        <div className="p-4 text-center text-slate-400 text-sm italic">No items in this section</div>
                    )}
                    {items.map((item) => (
                        <div key={item.id} className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium text-slate-800">{item.name}</span>
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
                                            {item.content_type}
                                        </span>
                                    </div>
                                    <EditableText
                                        value={item.progress?.notes || ""}
                                        onChange={(notes) => onUpdateProgress(item.id, { notes })}
                                        placeholder="Add notes..."
                                        disabled={disabled}
                                        className="text-xs text-slate-500 mt-1 block"
                                    />
                                    {item.progress?.completed_at && (
                                        <span className="text-[10px] text-emerald-600 mt-1 block">
                                            ✓ Completed {new Date(item.progress.completed_at).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <StatusToggle
                                        status={item.progress?.status || 'not-yet'}
                                        itemName={item.name}
                                        disabled={disabled}
                                        onChange={(status) => onUpdateProgress(item.id, {
                                            status,
                                            completed_at: status === 'done' ? new Date().toISOString() : null
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// Main Component
export default function StudentProgressEditor({ studentIdFromProps }) {
    const [students, setStudents] = useState([])
    const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromProps || '')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(false)

    // Fetch students on mount
    useEffect(() => {
        if (studentIdFromProps) return; // Don't fetch list if ID is provided
        const fetchStudents = async () => {
            try {
                const res = await api.get(`/students`)
                setStudents(res.data)
                if (res.data.length > 0 && !selectedStudentId) {
                    setSelectedStudentId(res.data[0].id)
                }
            } catch (err) {
                console.error("Error fetching students:", err)
            }
        }
        fetchStudents()
    }, [studentIdFromProps])

    // Fetch progress when student changes
    useEffect(() => {
        const studentId = studentIdFromProps || selectedStudentId;
        if (!studentId) return

        const fetchProgress = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await api.get(`/students/${studentId}/progress`)
                setData(res.data)
            } catch (err) {
                setError("Failed to load progress data")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchProgress()
    }, [selectedStudentId, studentIdFromProps])

    const updateProgress = async (contentId, updates) => {
        setUpdating(true)
        try {
            await api.post(`/students/${selectedStudentId}/progress/${contentId}`, updates)

            // Optimistic update or refetch
            setData(prev => {
                const newData = { ...prev }
                newData.syllabus.modules = newData.syllabus.modules.map(m => ({
                    ...m,
                    contents: m.contents.map(c =>
                        c.id === contentId ? { ...c, progress: { ...c.progress, ...updates } } : c
                    )
                }))
                return newData
            })
        } catch (err) {
            console.error("Failed to update progress:", err)
            // Revert or show alert
        } finally {
            setUpdating(false)
        }
    }

    // Calculate overall progress from data
    const overallProgress = useMemo(() => {
        if (!data?.syllabus?.modules) return 0
        let totalWeighted = 0
        let completedWeighted = 0

        data.syllabus.modules.forEach(module => {
            const moduleItems = module.contents || []
            const moduleTotal = moduleItems.reduce((sum, i) => sum + (i.weight || 1), 0)
            const moduleCompleted = moduleItems.filter(i => i.progress?.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
            const moduleProgressPct = moduleTotal > 0 ? moduleCompleted / moduleTotal : 0

            // Use module weight if available, else equal weight
            const mWeight = module.weight || 100 / data.syllabus.modules.length
            completedWeighted += moduleProgressPct * mWeight
            totalWeighted += mWeight
        })

        return totalWeighted > 0 ? (completedWeighted / totalWeighted) * 100 : 0
    }, [data])

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">Loading progress data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-[#463a7a] text-white rounded-lg font-medium hover:bg-[#5a4a9f] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Student Selector */}
                {!studentIdFromProps && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Student Selection */}
                            <div className="flex-1 w-full">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Select Student</label>
                                <div className="relative">
                                    <select
                                        value={selectedStudentId}
                                        onChange={(e) => setSelectedStudentId(e.target.value)}
                                        className="w-full md:w-80 appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-[#463a7a]/20 focus:border-[#463a7a] transition-all font-semibold text-slate-800"
                                    >
                                        <option value="" disabled>Select a student...</option>
                                        {students.map(s => (
                                            <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <FaChevronDown size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Progress Meter */}
                            {data && (
                                <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-shrink-0">
                                    <CircularProgress value={overallProgress} size={64} />
                                    <div>
                                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overall Progress</h4>
                                        <div className="text-2xl font-bold text-[#463a7a]">{Math.round(overallProgress)}%</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {studentIdFromProps && data && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{data.student.name} Progress</h2>
                            <p className="text-slate-500">Managing syllabus completion and notes</p>
                        </div>
                        <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-shrink-0">
                            <CircularProgress value={overallProgress} size={64} />
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Overall Progress</h4>
                                <div className="text-2xl font-bold text-[#463a7a]">{Math.round(overallProgress)}%</div>
                            </div>
                        </div>
                    </div>
                )}

                {!data ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <FaUser size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Student Selected</h3>
                        <p className="text-slate-500">Please select a student from the menu above to view and track their progress.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Syllabus */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold text-slate-800">Syllabus: {data.syllabus?.name}</h2>
                                {updating && <span className="text-xs text-[#463a7a] animate-pulse font-medium">Saving...</span>}
                            </div>
                            {data.syllabus?.modules.sort((a, b) => a.order - b.order).map(module => (
                                <SyllabusSection
                                    key={module.id}
                                    section={module}
                                    onUpdateProgress={updateProgress}
                                    disabled={updating}
                                />
                            ))}
                        </div>

                        {/* Right Column - Stats & History */}
                        <div className="space-y-6">
                            {/* Student Profile Quick View */}
                            <div className="bg-gradient-to-br from-[#463a7a] to-[#7c3aed] rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                                <div className="relative z-10">
                                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl font-bold mb-4">
                                        {data.student.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <h3 className="text-2xl font-bold mb-1">{data.student.name}</h3>
                                    <div className="flex items-center gap-2 text-white/80 text-sm">
                                        <FaMusic size={12} />
                                        <span>{data.student.instrument || 'Piano'}</span>
                                        <span className="opacity-50 text-xs">•</span>
                                        <span>Grade {data.student.grade || 'N/A'}</span>
                                    </div>
                                </div>
                                {/* Decorative circle */}
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            </div>

                            {/* Progress Breakdown */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#463a7a] rounded-full" />
                                    Module Breakdown
                                </h3>
                                <div className="space-y-4">
                                    {data.syllabus.modules.map(module => {
                                        const items = module.contents || []
                                        const done = items.filter(i => i.progress?.status === 'done').length
                                        const pct = items.length > 0 ? (done / items.length) * 100 : 0

                                        return (
                                            <div key={module.id} className="space-y-1.5">
                                                <div className="flex justify-between text-xs font-medium">
                                                    <span className="text-slate-600">{module.name}</span>
                                                    <span className="text-[#463a7a]">{done}/{items.length}</span>
                                                </div>
                                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[#463a7a] transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Action Cards */}
                            <div className="grid grid-cols-1 gap-4">
                                <button className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-left transition-all group">
                                    <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 mb-3 group-hover:scale-110 transition-transform">
                                        <FaLightbulb size={18} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">Practice Insights</h4>
                                    <p className="text-xs text-slate-500">Generate a personalized practice plan based on current progress.</p>
                                </button>

                                <button className="bg-white hover:bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-sm text-left transition-all group">
                                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                                        <FaHistory size={18} />
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">Full Activity Log</h4>
                                    <p className="text-xs text-slate-500">Review detailed history of all status changes and teacher notes.</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
