import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import { useAppData } from "../context/AppDataContext";
import { useAdmin } from "../context/AdminContext";

const INPUT_CLS = "w-full rounded-lg border-slate-300 shadow-sm focus:border-[#463a7a] focus:ring-[#463a7a] py-2.5 transition-all";

// Renders one form field from a center's own form-config entry — same field
// types the public enrollment form supports, so this dialog always matches
// whatever that center configured (including any custom questions they added
// via the Form Builder), instead of a second, independently-maintained list
// that drifts out of sync with it.
function DynField({ field, value, onChange, subjects }) {
    const { key, label, type, required } = field;
    const common = {
        id: key,
        name: key,
        value: value ?? "",
        onChange: (e) => onChange(key, e.target.value),
        required: !!required,
        className: INPUT_CLS,
    };

    if (type === "select_subjects") {
        return (
            <select {...common}>
                <option value="">Select a course</option>
                {subjects.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
        );
    }
    if (type === "select") {
        return (
            <select {...common}>
                <option value="">Select…</option>
                {(field.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        );
    }
    if (type === "textarea") {
        return <textarea {...common} rows={2} className={`${INPUT_CLS} resize-none`} />;
    }
    return <input type={type || "text"} {...common} />;
}

export default function AddStudentDialog({ isOpen, onClose, onSubmit, initialData }) {
    const { subjects: contextSubjects } = useAppData();
    const { isSuperAdmin, centerId: myCenterId } = useAdmin();

    const [centers, setCenters] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState(myCenterId || "");
    const [fields, setFields] = useState([]);
    const [subjects, setSubjects] = useState(contextSubjects || []);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const [formValues, setFormValues] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Fetch the centers list once (super_admin needs to pick which center's
    // form/fields to use; center_admin is locked to their own automatically).
    useEffect(() => {
        if (isSuperAdmin) {
            api.get("/centers").then((res) => setCenters(res.data || [])).catch(() => setCenters([]));
        }
    }, [isSuperAdmin]);

    useEffect(() => {
        if (!isOpen) return;
        setError("");
        const centerForConfig = isSuperAdmin ? (initialData?.center_id || selectedCenter || myCenterId) : myCenterId;
        if (!centerForConfig && isSuperAdmin && !centers.length) return; // wait for centers to load

        setLoadingConfig(true);
        Promise.all([
            api.get("/admin/form-config", { params: centerForConfig ? { center_id: centerForConfig } : {} }),
            api.get("/admin/subjects", { params: centerForConfig ? { center_id: centerForConfig } : {} }).catch(() => ({ data: contextSubjects || [] })),
        ]).then(([configRes, subjectsRes]) => {
            const cfgFields = (configRes.data || []).filter((f) => f.enabled !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setFields(cfgFields);
            setSubjects(subjectsRes.data?.length ? subjectsRes.data : (contextSubjects || []));

            const initial = {};
            cfgFields.forEach((f) => { initial[f.key] = ""; });
            if (initialData) {
                cfgFields.forEach((f) => { initial[f.key] = initialData[f.key] ?? ""; });
                // Previously-answered custom questions (Form Builder fields) — matched
                // back by their stable key so editing doesn't lose earlier answers.
                (initialData.custom_fields || []).forEach((cf) => {
                    if (cf.key) initial[cf.key] = cf.value;
                });
            }
            setFormValues(initial);
        }).finally(() => setLoadingConfig(false));
    }, [isOpen, initialData, selectedCenter, isSuperAdmin, myCenterId, centers.length]);

    useEffect(() => {
        if (isOpen && isSuperAdmin && !selectedCenter) {
            setSelectedCenter(initialData?.center_id || myCenterId || centers[0]?.id || "");
        }
    }, [isOpen, isSuperAdmin, centers, initialData, myCenterId]);

    const handleChange = (key, value) => setFormValues((prev) => ({ ...prev, [key]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const payload = { ...formValues };
        if (isSuperAdmin && selectedCenter) payload.center_id = parseInt(selectedCenter);

        try {
            let updatedStudent = null;
            if (initialData && initialData.id) {
                const res = await api.put(`/students/${initialData.id}`, payload);
                updatedStudent = res.data;
            } else {
                await api.post("/students", payload);
            }
            if (onSubmit) await onSubmit(updatedStudent);
            onClose();
        } catch (err) {
            console.error("Error saving student:", err);
            const detail = err.response?.data?.detail;
            const msg = Array.isArray(detail) ? detail.map((d) => d.msg).join(", ") : (detail || "Failed to save student. Please try again.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            {initialData ? "Edit Student Details" : "Add New Student"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="overflow-y-auto p-6 flex-1">
                        {error && (
                            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                                <p className="text-sm text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {loadingConfig ? (
                            <div className="flex justify-center py-16">
                                <Loader2 className="h-8 w-8 animate-spin text-[#463a7a]" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {isSuperAdmin && (
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Center *</label>
                                        <select
                                            value={selectedCenter}
                                            onChange={(e) => setSelectedCenter(e.target.value)}
                                            className={INPUT_CLS}
                                            required
                                        >
                                            <option value="">Select a center</option>
                                            {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">Determines which center's enrollment form fields are shown below.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {fields.map((field) => (
                                        <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                                {field.label}{field.required ? " *" : ""}
                                            </label>
                                            <DynField field={field} value={formValues[field.key]} onChange={handleChange} subjects={subjects} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || loadingConfig}
                            className="px-5 py-2.5 rounded-lg bg-[#463a7a] text-white font-medium hover:bg-[#382e61] transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>{initialData ? "Update Student" : "Add Student"}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
