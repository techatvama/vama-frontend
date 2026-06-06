import { useEffect, useRef } from 'react';

/**
 * Calls `callback` on a timer interval AND whenever the browser tab
 * regains focus (visibilitychange). Safe: always uses the latest callback
 * without re-creating the interval.
 *
 * @param {Function} callback  - async-safe fetch/refresh function
 * @param {number}   intervalMs - poll interval in ms (default 30 s)
 */
export function useAutoRefresh(callback, intervalMs = 30000) {
    const ref = useRef(callback);

    // Keep the ref current without resetting the interval
    useEffect(() => { ref.current = callback; }, [callback]);

    useEffect(() => {
        const tick = () => ref.current();

        const id = setInterval(tick, intervalMs);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') tick();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [intervalMs]);
}
