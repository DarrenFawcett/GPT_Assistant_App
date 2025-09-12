import { useEffect, useRef } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export function useWakeUpPing() {
  const hasBootstrapped = useRef(false);

  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const wake = async () => {
      try {
        if (!API_BASE) return;

        const start = performance.now();
        console.log('🧊 Sending wake-up ping…');

        const res = await fetch(`${API_BASE}/ping`, {
          method: 'GET',
          cache: 'no-store',
          keepalive: true,
        });

        const duration = performance.now() - start;
        const result = await res.json();
        console.log('✅ Warm-up ping sent', result, `(${duration.toFixed(1)}ms)`);
      } catch (e) {
        console.warn('Wake-up failed:', e);
      }
    };

    (async () => await wake())();
  }, []);
}
