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
    FaExclamationTriangle,
    FaTrophy,
    FaArrowUp
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

const CONTENT_TYPES = ['piece', 'scale', 'exercise', 'theory', 'sight-reading', 'technique', 'other']

// Section Component
function SyllabusSection({ section, onUpdateProgress, disabled, allowAddContent, onAddContent }) {
    const [expanded, setExpanded] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [newItemType, setNewItemType] = useState('piece')
    const [addingItem, setAddingItem] = useState(false)

    const items = section.contents || []
    const completedCount = items.filter(i => i.progress?.status === 'done').length
    const totalWeight = items.reduce((sum, i) => sum + (i.weight || 1), 0)
    const completedWeight = items.filter(i => i.progress?.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0

    const [addError, setAddError] = useState('')

    const handleAddItem = async () => {
        if (!newItemName.trim()) return
        setAddingItem(true)
        setAddError('')
        try {
            await onAddContent(section.id, newItemName.trim(), newItemType)
            setNewItemName('')
            setNewItemType('piece')
            setShowAddForm(false)
        } catch (err) {
            const msg = err?.response?.data?.detail || err?.message || 'Failed to add item'
            setAddError(msg)
        } finally {
            setAddingItem(false)
        }
    }

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
                                        <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded">
                                            {Math.round(item.weight || 0)}%
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

                    {/* Add Item Form */}
                    {allowAddContent && (
                        <div className="p-3 sm:p-4 bg-purple-50/40">
                            {showAddForm ? (
                                <div>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <input
                                            autoFocus
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                                            placeholder="Item name (e.g. C major scale)"
                                            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#463a7a]"
                                        />
                                        <select
                                            value={newItemType}
                                            onChange={(e) => setNewItemType(e.target.value)}
                                            className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#463a7a] bg-white"
                                        >
                                            {CONTENT_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddItem}
                                                disabled={addingItem || !newItemName.trim()}
                                                className="px-3 py-1.5 bg-[#463a7a] text-white text-sm rounded-lg hover:bg-[#5a4a9f] disabled:opacity-50 transition-colors"
                                            >
                                                {addingItem ? '...' : 'Add'}
                                            </button>
                                            <button
                                                onClick={() => { setShowAddForm(false); setNewItemName(''); setAddError('') }}
                                                className="px-3 py-1.5 bg-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-300 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                    {addError && (
                                        <p className="text-xs text-red-600 mt-1.5 font-medium">{addError}</p>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowAddForm(true)}
                                    className="flex items-center gap-1.5 text-xs text-[#463a7a] font-medium hover:text-[#5a4a9f] transition-colors"
                                >
                                    <FaPlus size={10} /> Add item
                                </button>
                            )}
                            {items.length > 0 && (
                                <p className="text-[10px] text-slate-400 mt-1.5">
                                    Adding an item auto-adjusts weights equally across all {items.length + (showAddForm ? 1 : 0)} items in this module
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Grade History Timeline Component
function GradeHistoryTimeline({ gradeHistory, loading }) {
    if (loading) return (
        <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
        </div>
    )
    if (!gradeHistory.length) return (
        <p className="text-xs text-slate-400 italic text-center py-4">No grade changes recorded yet</p>
    )
    return (
        <div className="space-y-3">
            {gradeHistory.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${h.change_type === 'auto_promote' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                            {h.change_type === 'auto_promote' ? <FaTrophy size={11} /> : <FaArrowUp size={11} />}
                        </div>
                        {i < gradeHistory.length - 1 && <div className="w-px flex-1 bg-slate-100 mt-1" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {h.from_grade && (
                                <>
                                    <span className="text-xs font-medium text-slate-500">{h.from_grade}</span>
                                    <span className="text-slate-300 text-xs">→</span>
                                </>
                            )}
                            <span className="text-xs font-bold text-[#463a7a]">{h.to_grade}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide ${h.change_type === 'auto_promote' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>
                                {h.change_type === 'auto_promote' ? 'Auto' : 'Manual'}
                            </span>
                        </div>
                        {h.changed_by && <p className="text-[10px] text-slate-400 mt-0.5">by {h.changed_by}</p>}
                        {h.notes && <p className="text-[10px] text-slate-500 mt-0.5 italic">{h.notes}</p>}
                        <p className="text-[9px] text-slate-300 mt-0.5">{new Date(h.changed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                </div>
            ))}
        </div>
    )
}

// Main Component
export default function StudentProgressEditor({ studentIdFromProps, allowAddContent = false, onGradeChange }) {
    const [students, setStudents] = useState([])
    const [selectedStudentId, setSelectedStudentId] = useState(studentIdFromProps || '')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [updating, setUpdating] = useState(false)
    const [retryCount, setRetryCount] = useState(0)
    const [gradeHistory, setGradeHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(false)
    const [syllabusComplete, setSyllabusComplete] = useState(false)
    const [nextGrade, setNextGrade] = useState(null)
    const [promoting, setPromoting] = useState(false)

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
    }, [selectedStudentId, studentIdFromProps, retryCount])

    // Fetch grade history when student changes
    useEffect(() => {
        const studentId = studentIdFromProps || selectedStudentId;
        if (!studentId) return
        const fetchHistory = async () => {
            setHistoryLoading(true)
            try {
                const res = await api.get(`/students/${studentId}/grade-history`)
                setGradeHistory(res.data)
            } catch (err) {
                console.error('Grade history fetch failed', err)
            } finally {
                setHistoryLoading(false)
            }
        }
        fetchHistory()
    }, [selectedStudentId, studentIdFromProps, retryCount])

    const updateProgress = async (contentId, updates) => {
        const studentId = studentIdFromProps || selectedStudentId;
        if (!studentId) return;
        setUpdating(true)
        try {
            const res = await api.post(`/students/${studentId}/progress/${contentId}`, updates)

            // Optimistic update
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

            // Check if syllabus is now fully complete
            if (res.data.syllabus_complete) {
                setSyllabusComplete(true)
                setNextGrade(res.data.next_grade)
            }
        } catch (err) {
            console.error("Failed to update progress:", err)
        } finally {
            setUpdating(false)
        }
    }

    const addContent = async (moduleId, name, contentType) => {
        const studentId = studentIdFromProps || selectedStudentId;
        if (!studentId) return;
        const res = await api.post(
            `/teacher/students/${studentId}/modules/${moduleId}/contents`,
            { name, content_type: contentType }
        )
        setData(res.data)
        setSyllabusComplete(false)
    }

    const promoteGrade = async () => {
        const studentId = studentIdFromProps || selectedStudentId;
        if (!studentId || !nextGrade) return;
        setPromoting(true)
        try {
            const teacher = JSON.parse(localStorage.getItem('teacher') || 'null')
            const admin = JSON.parse(localStorage.getItem('admin') || 'null')
            const changedBy = teacher?.name || admin?.name || ''
            await api.post(`/teacher/students/${studentId}/promote`, {
                to_grade: nextGrade,
                changed_by: changedBy,
            })
            setSyllabusComplete(false)
            setNextGrade(null)
            setRetryCount(c => c + 1)  // refetch progress + history
            if (onGradeChange) onGradeChange(nextGrade)
        } catch (err) {
            console.error("Promote failed:", err)
            alert('Failed to promote grade. Please try again.')
        } finally {
            setPromoting(false)
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
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#463a7a]/20 border-t-[#463a7a] rounded-full animate-spin" />
                    <p className="text-slate-600 font-medium">Loading progress data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16 p-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center border border-slate-100">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Oops!</h2>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <button
                        onClick={() => { setError(null); setRetryCount(c => c + 1); }}
                        className="px-6 py-2 bg-[#463a7a] text-white rounded-lg font-medium hover:bg-[#5a4a9f] transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-50 p-4 sm:p-6 lg:p-8">
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
                ) : !data.syllabus ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
                        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-400">
                            <FaMusic size={36} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No syllabus for this student yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto">
                            No syllabus is set up for <span className="font-bold text-slate-700">{data.student?.syllabus_type} {data.student?.grade}</span>
                            {' '}({data.student?.instrument}). Create a matching syllabus in <span className="font-bold">Curriculum → Syllabus Builder</span>, or update the student's grade/curriculum.
                        </p>
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
                                    allowAddContent={allowAddContent}
                                    onAddContent={addContent}
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

                            {/* Promote Banner — shows when syllabus is 100% done */}
                            {syllabusComplete && nextGrade && allowAddContent && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FaTrophy className="text-emerald-600" size={16} />
                                        <h4 className="font-bold text-emerald-800 text-sm">Syllabus Complete!</h4>
                                    </div>
                                    <p className="text-xs text-emerald-700 mb-3">
                                        All topics are done. Ready to move to <strong>{nextGrade}</strong>?
                                    </p>
                                    <button
                                        onClick={promoteGrade}
                                        disabled={promoting}
                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        <FaArrowUp size={10} />
                                        {promoting ? 'Promoting...' : `Promote to ${nextGrade}`}
                                    </button>
                                </div>
                            )}

                            {/* Grade History */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#463a7a] rounded-full" />
                                    Grade History
                                </h3>
                                <GradeHistoryTimeline gradeHistory={gradeHistory} loading={historyLoading} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
