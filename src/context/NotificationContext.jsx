import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from './AdminContext';

const NotificationContext = createContext(null);
const LEGACY_SHARED_KEY = 'vama_notifications';
const MAX_STORED   = 100;

// One browser can be used to log into different center accounts one after
// another (e.g. a super_admin switching centers, or a shared machine) — these
// are admin-only activity toasts, so they must be scoped per logged-in admin
// id, not stored under one shared key that every account reads and writes.
const keyFor = (adminId) => adminId ? `vama_notifications_${adminId}` : null;

export function NotificationProvider({ children }) {
    const { admin } = useAdmin();
    const adminId = admin?.id || null;
    const [notifications, setNotifications] = useState([]);
    const loadedForId = useRef(undefined);

    // Scrub the old unscoped key once — it may already hold another
    // account's notifications from before this fix.
    useEffect(() => {
        try { localStorage.removeItem(LEGACY_SHARED_KEY); } catch {}
    }, []);

    // (Re)load this account's own notification history whenever the logged-in
    // admin changes (login, logout, or switching accounts without a reload).
    useEffect(() => {
        if (loadedForId.current === adminId) return;
        loadedForId.current = adminId;
        const key = keyFor(adminId);
        if (!key) { setNotifications([]); return; }
        try {
            const raw = localStorage.getItem(key);
            setNotifications(raw ? JSON.parse(raw) : []);
        } catch {
            setNotifications([]);
        }
    }, [adminId]);

    // Persist on every change, under this account's own key
    useEffect(() => {
        const key = keyFor(adminId);
        if (!key || loadedForId.current !== adminId) return;
        localStorage.setItem(key, JSON.stringify(notifications.slice(0, MAX_STORED)));
    }, [notifications, adminId]);

    // Listen to events emitted by the API interceptor
    useEffect(() => {
        const handler = (e) => {
            setNotifications(prev => [e.detail, ...prev].slice(0, MAX_STORED));
        };
        window.addEventListener('vama:notification', handler);
        return () => window.removeEventListener('vama:notification', handler);
    }, []);

    const markRead = useCallback((id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => setNotifications([]), []);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clearAll }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    return useContext(NotificationContext);
}
