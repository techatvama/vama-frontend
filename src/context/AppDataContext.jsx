import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
    const [subjects, setSubjects] = useState([]);
    const [grades, setGrades] = useState([]);
    const [syllabi, setSyllabi] = useState([]);
    const [ready, setReady] = useState(false);

    const load = useCallback(async () => {
        try {
            const [sRes, gRes, syRes] = await Promise.all([
                api.get('/admin/subjects').catch(() => ({ data: [] })),
                api.get('/admin/grades').catch(() => ({ data: [] })),
                api.get('/admin/syllabi').catch(() => ({ data: [] })),
            ]);
            setSubjects(sRes.data || []);
            setGrades(gRes.data || []);
            setSyllabi(syRes.data || []);
        } catch {
            // silently keep empty arrays — components fall back to API calls if needed
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Unique curriculum names from the syllabi table
    const curricula = [...new Set(syllabi.map(s => s.syllabus_type).filter(Boolean))];
    // Fallback: well-known types if none are in DB yet
    const curriculaOrFallback = curricula.length ? curricula : ['Trinity', 'RSL', 'ABRSM', 'Berklee'];

    // Plain name arrays (most dropdowns just need strings)
    const subjectNames = subjects.map(s => s.name);
    const gradeNames = grades.map(g => g.name);

    return (
        <AppDataContext.Provider value={{
            subjects,       // [{id, name, is_active}]
            grades,         // [{id, name}]
            syllabi,        // [{id, name, subject, grade_name, syllabus_type}]
            curricula: curriculaOrFallback,
            subjectNames,
            gradeNames,
            ready,
            reload: load,
        }}>
            {children}
        </AppDataContext.Provider>
    );
}

export function useAppData() {
    const ctx = useContext(AppDataContext);
    if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
    return ctx;
}
