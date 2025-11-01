// src/hooks/useTokens.tsx
import { useState, useEffect } from 'react';

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export function useTokens() {
  const [userToken, setUserToken] = useState<string | null>(
    localStorage.getItem('userToken')
  );
  const [apiToken, setApiToken] = useState<string | null>(
    localStorage.getItem('apiToken')
  );

  useEffect(() => {
    if (!API_BASE || (userToken && apiToken)) return;

    const requestTokens = async () => {
      const secret = prompt('🔐 No token found.\nEnter your secret access word:');
      if (!secret) return;

      try {
        const res = await fetch(`${API_BASE}/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secretWord: secret }),
        });

        const data = await res.json();
        if (res.ok && data.userToken === 'ACCESS_GRANTED') {
          localStorage.setItem('userToken', data.userToken);
          localStorage.setItem('apiToken', data.apiToken);
          setUserToken(data.userToken);
          setApiToken(data.apiToken);
        } else {
          alert('❌ Invalid secret word');
        }
      } catch (e) {
        console.error('Token error:', e);
        alert('⚠️ Error calling /token');
      }
    };

    requestTokens();
  }, [userToken, apiToken]);

  return { userToken, apiToken, setUserToken, setApiToken };
}
