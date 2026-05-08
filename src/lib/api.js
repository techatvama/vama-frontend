import axios from 'axios';
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
export const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,  // 15 s — prevents indefinite spinner on slow/cold-start backends
});

// Global error interceptor — surfaces network failures instead of hanging silently
api.interceptors.response.use(
    res => res,
    err => {
        if (err.code === 'ECONNABORTED') {
            console.error('[API] Request timed out:', err.config?.url);
        }
        return Promise.reject(err);
    }
);