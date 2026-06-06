import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext(null);
const STORAGE_KEY = 'vama_notifications';
const MAX_STORED   = 100;

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // Persist on every change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
    }, [notifications]);

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
