// src/hooks/useChatLogic.ts
import { useState } from 'react';
import { CHAT_URL, CALENDAR_URL, authHeaders } from '../config/api';

type Role = 'user' | 'assistant' | 'system';
type Message = { id: string; role: Role; text: string };

export function useChatLogic(apiToken?: string) {
  // 👇 Starter assistant message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'How can I assist you today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // ✅ Push a new message into the log
  const addMessage = (role: Role, text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text }]);
  };

  // ✅ Main send function
  const onSend = async (text?: string, tab: string = 'chat') => {
    const raw = typeof text === 'string' ? text : input;
    const userText = (raw ?? '').toString().trim();
    if (!userText) return;

    // push user message
    addMessage('user', userText);

    // clear input box
    setInput('');
    setIsThinking(true);

    try {
      const endpoint = tab === 'calendar' ? CALENDAR_URL : CHAT_URL;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(apiToken),
        body: JSON.stringify({
          messages: [{ role: 'user', content: userText }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${errText}`);
      }

      const data = await res.json();

      // ✅ Flexible reply selection (works for both chat + calendar)
      const reply =
        data.reply ||
        data.summary ||
        (data.htmlLink
          ? `📅 Event created: ${data.htmlLink}`
          : data.event
          ? `📅 ${data.event.summary} — ${
              data.event.start?.dateTime ||
              data.event.start?.date ||
              '(no date)'
            }`
          : data.events
          ? data.events
              .map(
                (e: any) =>
                  `📅 ${e.summary} — ${
                    e.start?.dateTime || e.start?.date || '(no date)'
                  }`
              )
              .join('\n')
          : '(no reply)');

      addMessage('assistant', reply);
    } catch (err: any) {
      addMessage(
        'assistant',
        `⚠️ ${err?.message || 'Something went wrong'}`
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
