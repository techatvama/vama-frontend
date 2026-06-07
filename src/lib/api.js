import axios from 'axios';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
});

// ── Auto-inject center_id for Center Admins ──────────────────────────────────
// Super admins see everything (no center_id). Center admins are scoped to their
// own center on GET list endpoints. Reads the logged-in admin from localStorage.
const CENTER_SCOPED_GET = [
    /^\/students(\?|$)/,
    /^\/staff(\?|$)/,
    /^\/batches(\?|$)/,
    /^\/calendar\/filtered/,
    /^\/admin\/invoices/,
];

api.interceptors.request.use((config) => {
    try {
        const admin = JSON.parse(localStorage.getItem('admin') || 'null');
        if (admin?.access_role === 'center_admin' && admin?.center_id) {
            const method = (config.method || 'get').toLowerCase();
            const url = config.url || '';
            const scoped = CENTER_SCOPED_GET.some(rx => rx.test(url));
            if (method === 'get' && scoped) {
                config.params = { ...(config.params || {}), center_id: admin.center_id };
            }
        }
    } catch { /* ignore */ }
    return config;
});

// ── Notification auto-fire on every successful write ─────────────────────────

const RESOURCE_PATTERNS = [
    { pattern: /\/admin\/invoices\/\d+\/send-email/, label: 'Invoice Email',  icon: '📧', category: 'payment',    action: { post: 'Sent' } },
    { pattern: /\/admin\/invoices\/\d+/,             label: 'Invoice',        icon: '🧾', category: 'payment' },
    { pattern: /\/admin\/invoices/,                  label: 'Invoice',        icon: '🧾', category: 'payment' },
    { pattern: /\/admin\/packages\/\d+/,             label: 'Package',        icon: '📦', category: 'payment' },
    { pattern: /\/admin\/packages/,                  label: 'Package',        icon: '📦', category: 'payment' },
    { pattern: /\/admin\/subscriptions\/\d+/,        label: 'Subscription',   icon: '🔄', category: 'payment' },
    { pattern: /\/admin\/subscriptions/,             label: 'Subscription',   icon: '🔄', category: 'payment' },
    { pattern: /\/students\/\d+/,                    label: 'Student',        icon: '🎓', category: 'student' },
    { pattern: /\/students/,                         label: 'Student',        icon: '🎓', category: 'student' },
    { pattern: /\/staff\/\d+/,                       label: 'Staff',          icon: '👤', category: 'staff' },
    { pattern: /\/staff/,                            label: 'Staff',          icon: '👤', category: 'staff' },
    { pattern: /\/batches\/\d+/,                     label: 'Batch',          icon: '📅', category: 'schedule' },
    { pattern: /\/batches/,                          label: 'Batch',          icon: '📅', category: 'schedule' },
    { pattern: /\/sessions\/\d+/,                    label: 'Session',        icon: '🎵', category: 'schedule' },
    { pattern: /\/sessions/,                         label: 'Session',        icon: '🎵', category: 'schedule' },
    { pattern: /\/admin\/subjects\/\d+/,             label: 'Subject',        icon: '📚', category: 'curriculum' },
    { pattern: /\/admin\/subjects/,                  label: 'Subject',        icon: '📚', category: 'curriculum' },
    { pattern: /\/admin\/grades\/\d+/,               label: 'Grade',          icon: '🏆', category: 'curriculum' },
    { pattern: /\/admin\/grades/,                    label: 'Grade',          icon: '🏆', category: 'curriculum' },
    { pattern: /\/admin\/syllabi\/\d+/,              label: 'Syllabus',       icon: '📖', category: 'curriculum' },
    { pattern: /\/admin\/syllabi/,                   label: 'Syllabus',       icon: '📖', category: 'curriculum' },
    { pattern: /\/admin\/exam-sessions\/\d+/,        label: 'Exam session',   icon: '📝', category: 'exam' },
    { pattern: /\/admin\/exam-sessions/,             label: 'Exam session',   icon: '📝', category: 'exam' },
    { pattern: /\/enrollments/,                      label: 'Enrollment',     icon: '✅', category: 'student' },
    { pattern: /\/attendances\/\d+/,                 label: 'Attendance',     icon: '📋', category: 'attendance' },
    { pattern: /\/attendances/,                      label: 'Attendance',     icon: '📋', category: 'attendance' },
    { pattern: /\/reschedule/,                       label: 'Reschedule',     icon: '🗓️', category: 'schedule' },
];

const METHOD_ACTIONS = { post: 'Created', put: 'Updated', patch: 'Updated', delete: 'Deleted' };

function buildMessage(url, method, req, res) {
    if (url.includes('invoice')) {
        const num   = res.invoice_number || req.invoice_number || '';
        const total = req.total_amount != null ? `₹${Number(req.total_amount).toLocaleString('en-IN')}` : '';
        const name  = req.student_name || '';
        return [num, name, total].filter(Boolean).join(' · ');
    }
    if (url.includes('package'))      return req.name || res.name || '';
    if (url.includes('subscription')) return req.plan_name || req.name || '';
    if (url.includes('student'))      return [req.first_name, req.last_name].filter(Boolean).join(' ') || req.name || '';
    if (url.includes('staff'))        return req.name || [req.first_name, req.last_name].filter(Boolean).join(' ') || '';
    if (url.includes('batch'))        return req.name || req.subject || '';
    if (url.includes('session'))      return req.date ? `Scheduled on ${req.date}` : '';
    if (url.includes('subject'))      return req.name || '';
    if (url.includes('grade'))        return req.name || '';
    if (url.includes('syllabus'))     return req.title || req.name || '';
    if (url.includes('exam'))         return req.name || req.exam_name || '';
    if (url.includes('enrollment'))   return req.student_id ? `Student #${req.student_id}` : '';
    if (url.includes('attendance'))   return req.status ? `Marked ${req.status}` : '';
    return '';
}

api.interceptors.response.use(
    res => {
        const method = res.config.method?.toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const url = res.config.url || '';
            // skip GET-like paths and login endpoints
            if (url.includes('/login') || url.includes('/logout')) return res;

            const matched = RESOURCE_PATTERNS.find(p => p.pattern.test(url));
            if (matched) {
                let req = {};
                try { req = JSON.parse(res.config.data || '{}'); } catch {}
                const resData = typeof res.data === 'object' ? (res.data || {}) : {};
                const action  = matched.action?.[method] || METHOD_ACTIONS[method] || 'Changed';
                const message = buildMessage(url, method, req, resData);

                window.dispatchEvent(new CustomEvent('vama:notification', {
                    detail: {
                        id:        `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                        type:      'success',
                        category:  matched.category,
                        title:     `${matched.label} ${action}`,
                        message:   message || `${matched.label} ${action.toLowerCase()} successfully`,
                        timestamp: new Date().toISOString(),
                        read:      false,
                        icon:      matched.icon,
                    },
                }));
            }
        }
        return res;
    },
    err => {
        if (err.code === 'ECONNABORTED') {
            console.error('[API] Request timed out:', err.config?.url);
        }
        return Promise.reject(err);
    }
);
