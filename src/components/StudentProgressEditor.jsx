import React, { useState, useMemo, useCallback } from 'react'
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
    FaTrash
} from 'react-icons/fa'

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
function StatusToggle({ status, onChange, itemName }) {
    const statuses = ['not-yet', 'in-progress', 'done']
    const config = STATUS_CONFIG[status]

    const cycle = () => {
        const idx = statuses.indexOf(status)
        onChange(statuses[(idx + 1) % 3])
    }

    return (
        <button
            onClick={cycle}
            aria-label={`Status for ${itemName}: ${config.label}. Click to change.`}
            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition-all ${config.bg} ${config.text} ${config.border} hover:scale-105 active:scale-95`}
        >
            <span className={`w-2 h-2 rounded-full ${config.dot}`} />
            {config.label}
        </button>
    )
}

// Editable Text
function EditableText({ value, onChange, placeholder = "Enter text...", className = "" }) {
    const [editing, setEditing] = useState(false)
    const [text, setText] = useState(value)

    const save = () => {
        onChange(text)
        setEditing(false)
    }

    if (editing) {
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
            onClick={() => setEditing(true)}
            className={`cursor-pointer hover:bg-slate-100 rounded px-1 -mx-1 ${className}`}
            title="Click to edit"
        >
            {value || <span className="text-slate-400 italic">{placeholder}</span>}
        </span>
    )
}

// Section Component
function SyllabusSection({ section, onUpdate, onAddItem, onDeleteItem }) {
    const [expanded, setExpanded] = useState(true)

    const completedCount = section.items.filter(i => i.status === 'done').length
    const totalWeight = section.items.reduce((sum, i) => sum + (i.weight || 1), 0)
    const completedWeight = section.items.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
    const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0

    const updateItem = (idx, updates) => {
        const newItems = [...section.items]
        newItems[idx] = { ...newItems[idx], ...updates }
        onUpdate({ ...section, items: newItems })
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
                    <span className="text-xs text-slate-500">({completedCount}/{section.items.length})</span>
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
                    <span className="text-xs bg-[#463a7a]/10 text-[#463a7a] px-2 py-0.5 rounded font-medium">
                        {section.weight}%
                    </span>
                </div>
            </button>

            {/* Items */}
            {expanded && (
                <div className="divide-y divide-slate-100">
                    {section.items.map((item, idx) => (
                        <div key={item.id} className="p-3 sm:p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <EditableText
                                            value={item.name}
                                            onChange={(name) => updateItem(idx, { name })}
                                            className="font-medium text-slate-800"
                                        />
                                        {item.weight && (
                                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                ×{item.weight}
                                            </span>
                                        )}
                                    </div>
                                    {item.notes !== undefined && (
                                        <EditableText
                                            value={item.notes}
                                            onChange={(notes) => updateItem(idx, { notes })}
                                            placeholder="Add notes..."
                                            className="text-xs text-slate-500 mt-1 block"
                                        />
                                    )}
                                    {item.completedDate && (
                                        <span className="text-[10px] text-emerald-600 mt-1 block">
                                            ✓ Completed {item.completedDate}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <StatusToggle
                                        status={item.status}
                                        itemName={item.name}
                                        onChange={(status) => updateItem(idx, {
                                            status,
                                            completedDate: status === 'done' ? new Date().toLocaleDateString() : null
                                        })}
                                    />
                                    <button
                                        onClick={() => onDeleteItem(section.id, item.id)}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        aria-label={`Delete ${item.name}`}
                                    >
                                        <FaTrash size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add Item Row */}
                    <button
                        onClick={() => onAddItem(section.id)}
                        className="w-full p-3 text-sm text-[#463a7a] hover:bg-[#463a7a]/5 flex items-center justify-center gap-2 transition-colors"
                    >
                        <FaPlus size={12} /> Add Item
                    </button>
                </div>
            )}
        </div>
    )
}

// Add Item Modal
function AddItemModal({ isOpen, onClose, onAdd, sectionName }) {
    const [name, setName] = useState('')
    const [weight, setWeight] = useState(1)
    const [notes, setNotes] = useState('')

    if (!isOpen) return null

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!name.trim()) return
        onAdd({ name: name.trim(), weight, notes, status: 'not-yet', id: Date.now() })
        setName('')
        setWeight(1)
        setNotes('')
        onClose()
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl w-full max-w-md p-5 shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Add Item to {sectionName}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                        <input
                            autoFocus
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border-slate-300 focus:border-[#463a7a] focus:ring-[#463a7a]"
                            placeholder="e.g., Moonlight Sonata"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                        <input
                            type="number"
                            min="1"
                            max="10"
                            value={weight}
                            onChange={(e) => setWeight(Number(e.target.value))}
                            className="w-24 rounded-lg border-slate-300 focus:border-[#463a7a] focus:ring-[#463a7a]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border-slate-300 focus:border-[#463a7a] focus:ring-[#463a7a]"
                            placeholder="Optional notes..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-[#463a7a] hover:bg-[#5a4a9f] rounded-lg"
                        >
                            Add Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Main Component
export default function StudentProgressEditor() {
    // Sample student data
    const [student] = useState({
        name: 'Sarah Johnson',
        avatar: null,
        instrument: 'Piano',
        grade: 'Grade 5'
    })

    // Syllabus sections with weighted progress
    const [sections, setSections] = useState([
        {
            id: 1,
            name: 'Songs & Pieces',
            weight: 40,
            items: [
                { id: 1, name: 'Für Elise - Beethoven', status: 'done', weight: 2, notes: 'Excellent dynamics', completedDate: '12/10/2024' },
                { id: 2, name: 'Minuet in G - Bach', status: 'in-progress', weight: 1, notes: '' },
                { id: 3, name: 'Clair de Lune', status: 'not-yet', weight: 3, notes: '' }
            ]
        },
        {
            id: 2,
            name: 'Technical Exercises',
            weight: 35,
            items: [
                { id: 4, name: 'C Major Scale (2 octaves)', status: 'done', weight: 1, completedDate: '12/05/2024' },
                { id: 5, name: 'G Major Scale (2 octaves)', status: 'done', weight: 1, completedDate: '12/08/2024' },
                { id: 6, name: 'Arpeggios - C, G, F', status: 'in-progress', weight: 2 },
                { id: 7, name: 'Chromatic Scale', status: 'not-yet', weight: 1 }
            ]
        },
        {
            id: 3,
            name: 'Supporting Tests',
            weight: 25,
            items: [
                { id: 8, name: 'Sight Reading Test', status: 'not-yet', weight: 2 },
                { id: 9, name: 'Aural Skills Assessment', status: 'in-progress', weight: 2 },
                { id: 10, name: 'Music Theory Quiz', status: 'done', weight: 1, completedDate: '12/01/2024' }
            ]
        }
    ])

    const [history, setHistory] = useState([
        { date: '12/10/2024', action: 'Marked "Für Elise" as Done', teacher: 'Mr. Smith' },
        { date: '12/08/2024', action: 'Added practice notes for Minuet in G', teacher: 'Mr. Smith' }
    ])

    const [comments, setComments] = useState('')
    const [addModal, setAddModal] = useState({ open: false, sectionId: null, sectionName: '' })

    // Calculate overall progress
    const overallProgress = useMemo(() => {
        let totalWeighted = 0
        let completedWeighted = 0

        sections.forEach(section => {
            const sectionTotal = section.items.reduce((sum, i) => sum + (i.weight || 1), 0)
            const sectionCompleted = section.items.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
            const sectionProgress = sectionTotal > 0 ? sectionCompleted / sectionTotal : 0
            completedWeighted += sectionProgress * section.weight
            totalWeighted += section.weight
        })

        return totalWeighted > 0 ? (completedWeighted / totalWeighted) * 100 : 0
    }, [sections])

    const updateSection = useCallback((updatedSection) => {
        setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s))
        setHistory(prev => [{ date: new Date().toLocaleDateString(), action: 'Updated progress', teacher: 'Current Teacher' }, ...prev.slice(0, 9)])
    }, [])

    const addItemToSection = (sectionId) => {
        const section = sections.find(s => s.id === sectionId)
        setAddModal({ open: true, sectionId, sectionName: section?.name || '' })
    }

    const handleAddItem = (item) => {
        setSections(prev => prev.map(s =>
            s.id === addModal.sectionId
                ? { ...s, items: [...s.items, item] }
                : s
        ))
    }

    const deleteItem = (sectionId, itemId) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.filter(i => i.id !== itemId) }
                : s
        ))
    }

    const markAllDone = (sectionId) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.map(i => ({ ...i, status: 'done', completedDate: new Date().toLocaleDateString() })) }
                : s
        ))
    }

    const resetSection = (sectionId) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId
                ? { ...s, items: s.items.map(i => ({ ...i, status: 'not-yet', completedDate: null })) }
                : s
        ))
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Student Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#463a7a] to-[#7c3aed] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{student.name}</h1>
                                <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                                    <FaMusic size={12} className="text-[#463a7a]" />
                                    <span>{student.instrument}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{student.grade}</span>
                                </div>
                            </div>
                        </div>

                        {/* Progress Meters */}
                        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
                            <CircularProgress value={overallProgress} size={70} />
                            <div className="flex-1 sm:w-40">
                                <div className="flex justify-between text-xs text-slate-600 mb-1">
                                    <span>Overall Progress</span>
                                    <span className="font-semibold">{Math.round(overallProgress)}%</span>
                                </div>
                                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#463a7a] to-[#7c3aed] transition-all duration-700 ease-out"
                                        style={{ width: `${overallProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Syllabus */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold text-slate-800">Syllabus Progress</h2>
                        {sections.map(section => (
                            <SyllabusSection
                                key={section.id}
                                section={section}
                                onUpdate={updateSection}
                                onAddItem={addItemToSection}
                                onDeleteItem={deleteItem}
                            />
                        ))}
                    </div>

                    {/* Right Column - Actions & Info */}
                    <div className="space-y-4">
                        {/* Quick Actions */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3">Quick Actions</h3>
                            <div className="space-y-2">
                                {sections.map(s => (
                                    <div key={s.id} className="flex items-center gap-2">
                                        <span className="text-xs text-slate-600 flex-1 truncate">{s.name}</span>
                                        <button
                                            onClick={() => markAllDone(s.id)}
                                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded text-xs"
                                            title="Mark all done"
                                        >
                                            <FaCheck size={10} />
                                        </button>
                                        <button
                                            onClick={() => resetSection(s.id)}
                                            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded text-xs"
                                            title="Reset"
                                        >
                                            <FaUndo size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-3 p-2 text-sm text-[#463a7a] bg-[#463a7a]/5 hover:bg-[#463a7a]/10 rounded-lg flex items-center justify-center gap-2">
                                <FaLightbulb size={12} /> Suggest Practice Plan
                            </button>
                        </div>

                        {/* Progress Breakdown */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3">Progress Breakdown</h3>
                            <div className="space-y-3 text-sm">
                                {sections.map(s => {
                                    const total = s.items.reduce((sum, i) => sum + (i.weight || 1), 0)
                                    const done = s.items.filter(i => i.status === 'done').reduce((sum, i) => sum + (i.weight || 1), 0)
                                    const pct = total > 0 ? (done / total) * 100 : 0
                                    const contrib = (pct / 100) * s.weight

                                    return (
                                        <div key={s.id} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600 truncate flex-1">{s.name}</span>
                                            <span className="text-slate-500 px-2">{s.items.filter(i => i.status === 'done').length}/{s.items.length}</span>
                                            <span className="font-medium text-slate-700 w-10 text-right">{Math.round(pct)}%</span>
                                            <span className="text-[#463a7a] font-semibold w-12 text-right">+{contrib.toFixed(1)}%</span>
                                        </div>
                                    )
                                })}
                                <div className="border-t pt-2 flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span className="text-[#463a7a]">{Math.round(overallProgress)}%</span>
                                </div>
                            </div>
                        </div>

                        {/* History */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <FaHistory size={12} /> Update History
                            </h3>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {history.map((h, i) => (
                                    <div key={i} className="text-xs text-slate-600 border-l-2 border-[#463a7a]/20 pl-2">
                                        <span className="text-slate-400">{h.date}</span> — {h.action}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Teacher Comments */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                                <FaComment size={12} /> Teacher Notes
                            </h3>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Add notes for parents/students..."
                                rows={3}
                                className="w-full text-sm rounded-lg border-slate-300 focus:border-[#463a7a] focus:ring-[#463a7a]"
                            />
                            <button className="mt-2 w-full p-2 text-sm font-medium text-white bg-[#463a7a] hover:bg-[#5a4a9f] rounded-lg">
                                Save Notes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Item Modal */}
            <AddItemModal
                isOpen={addModal.open}
                onClose={() => setAddModal({ open: false, sectionId: null, sectionName: '' })}
                onAdd={handleAddItem}
                sectionName={addModal.sectionName}
            />
        </div>
    )
}
