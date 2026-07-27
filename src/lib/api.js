import axios from 'axios';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
});

// ── GET cache — prevents redundant refetches within a TTL window ──────────────
// Keyed by full URL+params string. Writes (POST/PUT/PATCH/DELETE) to a resource
// bust the cache for that path prefix.
const _cache = new Map();           // key → { data, exp }
const _inflight = new Map();        // key → Promise  (deduplicate concurrent calls)

// Long-lived: stable reference data that rarely changes
const LONG_TTL_PATHS = [
    '/centers', '/staff', '/admin/subjects', '/admin/grades',
    '/admin/payment-modes', '/scheduling/rooms', '/admin/syllabi',
    '/admin/exam-sessions', '/centers/onboard',
];
// Short-lived: per-session/dynamic data
const SHORT_TTL_PATHS = [
    '/scheduling/calendar', '/calendar/filtered',
    '/admin/invoices', '/students', '/admin/student-applications',
    '/admin/reports', '/attendances', '/admin/subscriptions',
    '/admin/students-overview',
];

function ttlFor(url) {
    if (LONG_TTL_PATHS.some(p => url.startsWith(p)))  return 5 * 60 * 1000; // 5 min
    if (SHORT_TTL_PATHS.some(p => url.startsWith(p))) return 20 * 1000;     // 20 s
    return 60 * 1000;  // 1 min default
}

function cacheKey(url, params) {
    const p = params && Object.keys(params).length
        ? '?' + new URLSearchParams(params).toString()
        : '';
    return url + p;
}

// Bust all cache entries whose key starts with any of the given prefixes
function bustCache(urlPrefixes) {
    for (const key of _cache.keys()) {
        if (urlPrefixes.some(p => key.startsWith(p))) _cache.delete(key);
    }
}

// Map write endpoints → which cache prefixes they invalidate
const BUST_MAP = [
    { match: /\/students/,              busts: ['/students'] },
    { match: /\/staff/,                 busts: ['/staff'] },
    { match: /\/batches|\/sessions/,    busts: ['/scheduling/calendar', '/calendar/filtered', '/batches', '/sessions'] },
    { match: /\/scheduling\/calendar/,  busts: ['/scheduling/calendar'] },
    { match: /\/attendances/,           busts: ['/attendances', '/scheduling/calendar', '/calendar/filtered'] },
    { match: /\/admin\/invoices/,       busts: ['/admin/invoices'] },
    { match: /\/admin\/subscriptions/,  busts: ['/admin/subscriptions', '/students'] },
    { match: /\/admin\/packages/,       busts: ['/admin/packages'] },
    { match: /\/centers/,               busts: ['/centers'] },
    { match: /\/admin\/subjects/,       busts: ['/admin/subjects'] },
    { match: /\/admin\/grades/,         busts: ['/admin/grades'] },
    { match: /\/admin\/syllabi/,        busts: ['/admin/syllabi'] },
    { match: /\/admin\/settings/,       busts: ['/admin/settings'] },
    { match: /\/admin\/form-config/,    busts: ['/admin/form-config', '/public/form-config'] },
];

export function clearApiCache() { _cache.clear(); _inflight.clear(); }

// Patched GET that serves from cache when fresh
const _originalGet = api.get.bind(api);
api.get = (url, config = {}) => {
    const key = cacheKey(url, config.params);
    const now = Date.now();

    // Return fresh cache hit immediately
    const hit = _cache.get(key);
    if (hit && hit.exp > now) return Promise.resolve({ data: hit.data });

    // Deduplicate: if the same request is in-flight, return the same promise
    if (_inflight.has(key)) return _inflight.get(key);

    const req = _originalGet(url, config).then(res => {
        _cache.set(key, { data: res.data, exp: now + ttlFor(url) });
        _inflight.delete(key);
        return res;
    }).catch(err => {
        _inflight.delete(key);
        throw err;
    });

    _inflight.set(key, req);
    return req;
};

// ── Auto-inject JWT token for all authenticated requests ───────────────────
// Reads from admin/teacher/student localStorage keys based on who's logged in.
api.interceptors.request.use((config) => {
    try {
        // Try to get token from any of the three user types
        let token = null;
        const admin = localStorage.getItem('admin_token');
        const teacher = localStorage.getItem('teacher_token');
        const student = localStorage.getItem('student_token');

        token = admin || teacher || student;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch { /* ignore */ }

    // ── Auto-inject center_id for Center Admins ──────────────────────────────────
    // Super admins see everything (no center_id). Center admins are scoped to their
    // own center on GET list endpoints. Reads the logged-in admin from localStorage.
    const CENTER_SCOPED_GET = [
        /^\/students(\?|$)/,
        /^\/staff(\?|$)/,
        /^\/batches(\?|$)/,
        /^\/calendar\/filtered/,
        /^\/scheduling\/calendar/,
        /^\/admin\/invoices/,
        /^\/admin\/student-applications/,
        /^\/admin\/reports/,
    ];

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
    { pattern: /\/admin\/student-applications\/\d+\/approve/, label: 'Application', icon: '📥', category: 'student', action: { post: 'Approved' } },
    { pattern: /\/admin\/student-applications\/\d+\/reject/,  label: 'Application', icon: '📥', category: 'student', action: { post: 'Rejected' } },
    { pattern: /\/admin\/student-applications/,      label: 'Application',    icon: '📥', category: 'student' },
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

// ── Auto-refresh access token on 401 ─────────────────────────────────────────
let _refreshing = null;

api.interceptors.response.use(null, async (err) => {
    const original = err.config;
    const status = err.response?.status;
    const detail = err.response?.data?.detail || '';

    // Only attempt refresh for token-expired 401s (not wrong password, not forbidden)
    if (
        status === 401 &&
        (detail === 'Invalid or expired token' || detail === 'Not authenticated') &&
        !original._retried
    ) {
        original._retried = true;
        const refreshToken = localStorage.getItem('admin_refresh_token');
        if (!refreshToken) return Promise.reject(err);

        try {
            // Deduplicate concurrent refresh calls
            if (!_refreshing) {
                _refreshing = axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
                    .finally(() => { _refreshing = null; });
            }
            const { data } = await _refreshing;
            if (data.access_token) {
                localStorage.setItem('admin_token', data.access_token);
                original.headers.Authorization = `Bearer ${data.access_token}`;
                return api(original);
            }
        } catch {
            // Refresh failed — clear tokens, redirect to login
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_refresh_token');
            window.location.href = '/admin-login';
        }
    }
    return Promise.reject(err);
});

api.interceptors.response.use(
    res => {
        const method = res.config.method?.toLowerCase();
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const url = res.config.url || '';
            // skip GET-like paths and login endpoints
            if (url.includes('/login') || url.includes('/logout')) return res;

            // Bust relevant cache entries so next GET reflects the mutation
            const bustEntry = BUST_MAP.find(e => e.match.test(url));
            if (bustEntry) bustCache(bustEntry.busts);

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
        const cfg = err.config;
        // Retry GET once on timeout — safe for idempotent reads (handles Neon cold-start)
        if (
            err.code === 'ECONNABORTED' &&
            cfg && !cfg._timeoutRetried &&
            (cfg.method || 'get').toLowerCase() === 'get'
        ) {
            cfg._timeoutRetried = true;
            console.warn('[API] Timeout on', cfg.url, '— retrying once...');
            return api.request({ ...cfg, _timeoutRetried: true });
        }
        if (err.code === 'ECONNABORTED') {
            console.error('[API] Request timed out:', cfg?.url);
        }
        return Promise.reject(err);
    }
);
