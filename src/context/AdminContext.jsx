import { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
    const [admin, setAdmin] = useState(() => {
        try { return JSON.parse(localStorage.getItem('admin') || 'null'); }
        catch { return null; }
    });

    const login = (adminData) => {
        localStorage.setItem('admin', JSON.stringify(adminData));
        setAdmin(adminData);
    };

    const logout = () => {
        localStorage.removeItem('admin');
        setAdmin(null);
    };

    const isSuperAdmin   = admin?.access_role === 'super_admin';
    const isCenterAdmin  = admin?.access_role === 'center_admin';
    const centerName     = admin?.center?.name || null;
    const centerId       = admin?.center_id || null;

    return (
        <AdminContext.Provider value={{ admin, login, logout, isSuperAdmin, isCenterAdmin, centerName, centerId }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    return useContext(AdminContext);
}
