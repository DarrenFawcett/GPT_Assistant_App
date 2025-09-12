// src/hooks/useChatLogic.ts
import { useEffect, useRef, useState } from 'react';

type Role = 'user' | 'assistant' | 'system';
type Message = { id: string; role: Role; text: string };

// ✅ Get VITE_API_BASE from environment
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export function useChatLogic(apiToken?: string) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'How can I assist you today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const latestMessagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  const addMessage = (role: Role, text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text }]);
  };

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', text };
    const tempId = crypto.randomUUID();

    setMessages((m) => [
      ...m,
      userMsg,
      { id: tempId, role: 'assistant', text: '...' },
    ]);
    setInput('');
    setIsThinking(true);

    try {
      if (!API_BASE) {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === tempId
              ? { ...msg, text: `👋 (Mock) You said: "${text}"` }
              : msg
          )
        );
        return;
      }

      const history = latestMessagesRef.current
        .filter((m) => m.text !== '...')
        .map((m) => ({ role: m.role, content: m.text }));

      const payload = {
        messages: [...history, { role: 'user', content: text }],
      };

      const res = await fetch(`${API_BASE}/CHAT`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Token': apiToken || '',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${errText}`);
      }

      const data = await res.json();
      setMessages((m) =>
        m.map((msg) =>
          msg.id === tempId ? { ...msg, text: data.reply || '(no reply)' } : msg
        )
      );
    } catch (err: any) {
      console.error('❌ fetch error:', err);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === tempId
            ? { ...msg, text: `⚠️ Error: ${err?.message || String(err)}` }
            : msg
        )
      );
    } finally {
      setIsThinking(false);
    }
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    addMessage,
    onSend,
    isThinking,
  };
}
