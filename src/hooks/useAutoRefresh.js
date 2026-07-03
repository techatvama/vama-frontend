import { useEffect, useRef } from 'react';

/**
 * Calls `callback` on a timer interval AND whenever the browser tab
 * regains focus (visibilitychange). Safe: always uses the latest callback
 * without re-creating the interval.
 *
 * The callback is invoked as `callback(true)` on every tick, so it can tell a
 * background refresh apart from the initial load and skip the loading spinner.
 *
 * @param {Function} callback  - async-safe fetch/refresh fn, receives isRefresh
 * @param {number}   intervalMs - poll interval in ms (default 30 s)
 */
export function useAutoRefresh(callback, intervalMs = 30000) {
    const ref = useRef(callback);

    // Keep the ref current without resetting the interval
    useEffect(() => { ref.current = callback; }, [callback]);

    useEffect(() => {
        const tick = () => ref.current(true);

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
