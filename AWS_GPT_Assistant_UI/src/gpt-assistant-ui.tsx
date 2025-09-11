// src/gpt-assistant-ui.tsx
import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  Calendar,
  ImageIcon,
  SendHorizontal,
  CheckCircle2,
  Mic,
} from 'lucide-react';

type Role = 'user' | 'assistant' | 'system';
type Message = { id: string; role: Role; text: string };
type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
};

// ✅ Vite env
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

/* ---------- Theme block (full palette) ---------- */
function ThemeStyles() {
  return (
    <style>{`
      .theme-ai-dark {
        --app: radial-gradient(1400px 800px at 50% -50%, #2d2940d2 0%, #111421bf 60%, #0c101c 100%);
        --ink: #e9eaf7;
        --muted: #a1a8bd;
        --card: #191d2c;
        --surface: #141827;
        --surface-2: #101421;
        --edge: rgba(255, 255, 255, 0.06);
        --shadow: 0 8px 24px rgba(10, 12, 20, 0.7);
        --accent: #a78bfa;
        --accent-2: #2241eeff;

        --chat-user: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(167,139,250,0.9));
        --chat-assistant: linear-gradient(135deg, rgba(79,70,229,0.9), rgba(129,140,248,0.9));
        --chat-user-ink: #fff;
        --chat-assistant-ink: #fff;
        
        --chip: rgba(139, 92, 246, 0.15);
        --success: #22c55e;
        --warning: #f59e0b;
        --glow: 0 0 18px rgba(167, 139, 250, 0.6);
      }
    `}</style>
  );
}

/* ---------- Extra UI styles (glow cards, dashed dropzone, inputs) ---------- */
function GlowStyles() {
  return (
    <style>{`

      
     /* === Glow Card (outer panels) === */
.ai-glow-card {
  position: relative;
  border-radius: 16px;
  background: var(--surface-2);
  border: 1px solid var(--edge);
  box-shadow:
    0 0 2px rgba(243, 232, 232, 0.7),
    0 0 10px rgba(146, 139, 250, 0.35),
    0 0 30px rgba(92, 100, 246, 0.25);
}

.ai-glow-card::before {
  content: "";
  position: absolute;
  inset: -8px;
  border-radius: inherit;
  background: radial-gradient(
    80% 80% at 50% 50%,
    rgba(167, 139, 250, 0.7) 0%,
    rgba(139, 92, 246, 0.35) 40%,
    rgba(139, 92, 246, 0) 80%
  );
  z-index: -1;
  filter: blur(45px);
  opacity: 1;
}

/* Dotted drop zone */
.ai-dash {
  border: 2px dashed rgba(148, 163, 184, 0.35);
}

/* === Input + Buttons unified style === */
.ai-input,
.ai-icon-btn {
  background: linear-gradient(135deg, #111a2f, #07162f); /* blue gradient */
  border-radius: 12px;
  border: 1px solid rgba(59, 130, 246, 0.6);
  color: #ffffff;
  box-shadow:
    0 0 2px rgba(243, 232, 232, 0.7),
    0 0 10px rgba(146, 139, 250, 0.35),
    0 0 30px rgba(92, 100, 246, 0.25);
  transition: all 0.2s ease;
}

/* === Solid Send Button === */
.ai-send {
  background: #5538c8cc; /* solid violet-blue */
  border: 1px solid rgba(59, 130, 246, 0.9);
  color: #fff;
  border-radius: 12px;
  box-shadow:
    0 0 3px rgba(59, 130, 246, 0.7),
    0 0 8px rgba(92, 100, 246, 0.5);
  transition: all 0.2s ease;
}

/* === Hover + Focus States === */
.ai-input:focus,
.ai-icon-btn:hover,
.ai-send:hover {
  border-color: #fff;
  transform: translateY(-1px);
  box-shadow:
    0 0 4px rgba(59, 130, 246, 0.8),
    0 0 12px rgba(92, 100, 246, 0.5);
}

/* === Active click effect === */
.ai-send:active,
.ai-icon-btn:active {
  transform: translateY(1px);
}

/* === Chat bubble styling === */
.ai-bubble-glow {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--surface-2);
  border-radius: 12px;
}

/* === GPT Icon Glow (header icon) === */
.ai-icon-glow {
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.7);
  padding: 6px;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(59, 130, 246, 0.15),
    rgba(17, 24, 39, 0.95)
  );
  box-shadow:
    0 0 3px rgba(243, 232, 232, 0.7),
    0 0 10px rgba(146, 139, 250, 0.35),
    0 0 20px rgba(92, 100, 246, 0.25);
}



    `}</style>
  );
}

/* ---------- Typing dots (bounce) ---------- */
function TypingDots() {
  return (
    <span className='inline-flex items-center gap-1 opacity-80'>
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '0ms' }}
      />
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '120ms' }}
      />
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '240ms' }}
      />
    </span>
  );
}

export default function AssistantUI() {
  // 1) Theme
  const [theme] = useState<'dark' | 'light'>('dark');

  // 2) 🎤 Mic state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 3) Auth state
  const [userToken, setUserToken] = useState<string | null>(
    localStorage.getItem('userToken')
  );
  const [apiToken, setApiToken] = useState<string | null>(
    localStorage.getItem('apiToken')
  );
  const hasBootstrapped = useRef(false);

  // 4) Thinking spinner
  const [isThinking, setIsThinking] = useState(false);

  // 5) Chat state (put BEFORE mic useEffect!)
  const [messages, setMessages] = useState<Message[]>([
    { id: crypto.randomUUID(), role: 'assistant', text: 'How can I assist you today?' }
  ]);
  const [input, setInput] = useState('');
  const latestMessagesRef = useRef<Message[]>(messages);
  useEffect(() => {
    latestMessagesRef.current = messages;
  }, [messages]);

  // 6) 🎤 Mic effect (now input is defined!)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("❌ SpeechRecognition API not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };

    recognition.onerror = (event: any) => {
      console.warn("Speech error:", event.error);
    };

    recognitionRef.current = recognition;
  }, [isRecording]);

  // 7)  Token effect
  const requestTokens = async () => {
    if (!API_BASE) return;
    if (userToken && apiToken) return;

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

  // 8)  Wram Up effect
  useEffect(() => {
    if (hasBootstrapped.current) return;
    hasBootstrapped.current = true;

    const wake = async () => {
      try {
        if (!API_BASE) return;

        const start = performance.now(); // ⏱️ Start timer
        console.log('🧊 Sending wake-up ping…');

        const res = await fetch(`${API_BASE}/ping`, {
          method: 'GET',
          cache: 'no-store',
          keepalive: true,
        });

        const duration = performance.now() - start; // ⏱️ End timer
        const result = await res.json(); // Just for debug, not required

        console.log(
          '✅ Warm-up ping sent',
          result,
          `(${duration.toFixed(1)}ms)`
        );
      } catch (e) {
        console.warn('Wake-up failed:', e);
      }
    };

    (async () => {
      await requestTokens();
      await wake();
    })();
  }, []);


  const addMessage = (role: Role, text: string) => {
    setMessages((m) => [...m, { id: crypto.randomUUID(), role, text }]);
  };

  // --- Uploads (mock Stage 1) ---
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFilePicker = () => fileInputRef.current?.click();
  

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);
    const items: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      status: 'uploaded',
    }));
    await new Promise((r) => setTimeout(r, 800));
    setUploads((u) => [...items, ...u]);
    setIsUploading(false);
    addMessage(
      'assistant',
      `✅ (Mock) ${files.length} file(s) sent to S3 bucket`
    );
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, []);
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // --- Send ---
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

  // Gate UI until tokens exist (when API is configured)
  if (API_BASE && (!userToken || !apiToken)) {
    return (
      <div className='flex justify-center items-center h-screen text-slate-300 text-lg'>
        🔐 Awaiting access…
      </div>
    );
  }

  return (
    <div className='theme-ai-dark'>
      <ThemeStyles />
      <GlowStyles />
      <div
        className='relative min-h-screen w-full p-4 md:p-8'
        style={{ background: 'var(--app)', color: 'var(--ink)' }}
      >
        {/* Glow edge at bottom */}
        <div
          aria-hidden
          className='pointer-events-none fixed inset-x-0 bottom-0 h-24'
        >
          <div
            className='absolute inset-x-10 bottom-6 h-20 blur-2xl opacity-60'
            style={{
              background:
                'radial-gradient(60% 140% at 50% 100%, rgba(56,189,248,0.35) 0%, rgba(29,78,216,0.25) 40%, rgba(2,6,23,0) 80%)',
            }}
          />
          <div className='absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400/50 via-indigo-400/60 to-fuchsia-400/50' />
        </div>

        <div className='mx-auto max-w-5xl relative'>
          {/* Header */}
          <div className='flex items-center gap-3 mb-4 '>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 0.7, opacity: 1 }}
              className='w-20 h-20 rounded-full flex items-center justify-center ring-2 ai-icon-glow'
              style={{
                background: 'var(--surface-2)',
                boxShadow: `
                  0 0 2px rgba(255, 255, 255, 0.25),
                  0 0 10px rgba(167, 139, 250, 0.35),
                  0 0 30px rgba(139, 92, 246, 0.25)
                `,
                borderColor: 'var(--edge)',
              }}
            >
              <img
                src='/src/assets/gpt-icon-white.png'
                alt='GPT Assistant Icon'
                className='mt-2 w-16 h-16 object-contain'
              />
            </motion.div>

            <div>
              <div className='text-xl font-semibold'>My GPT Assistant</div>
              <div className='text-sm' style={{ color: 'var(--muted)' }}>
                Chats • Upload images to S3 Bucket • Add calendar events
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {/* Left column */}
            <div className='md:col-span-1 space-y-4'>
              {/* S3 Bucket card with outer glow */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className='ai-glow-card p-4'
              >
                <div className='flex items-center gap-2 mb-3'>
                  <UploadCloud className='w-5 h-5' />
                  <div className='font-medium'>S3 Photo Bucket</div>
                </div>

                {/* Always-visible dotted drop area */}
                <div
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  className='ai-dash rounded-xl h-40 cursor-pointer grid place-items-center mb-3'
                  onClick={openFilePicker}
                  title='Drag & drop or click'
                >
                  {isUploading ? (
                    <div className='text-sm' style={{ color: 'var(--muted)' }}>
                      Uploading…
                    </div>
                  ) : (
                    <div
                      className='flex flex-col items-center gap-2'
                      style={{ color: 'var(--muted)' }}
                    >
                      <ImageIcon className='w-6 h-6' />
                      <div className='text-sm'>Drag & drop images here</div>
                      <div className='text-xs'>or click to select</div>
                    </div>
                  )}
                </div>

                <button
                  className='w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2'
                  onClick={openFilePicker}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--edge)',
                  }}
                >
                  <UploadCloud className='w-4 h-4' /> Choose image(s)
                </button>

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  multiple
                  className='hidden'
                  onChange={(e) => handleFiles(e.target.files)}
                />

                {/* Upload list */}
                <div className='mt-4 space-y-2 max-h-40 overflow-auto pr-1'>
                  {uploads.length === 0 ? (
                    <div className='text-xs' style={{ color: 'var(--muted)' }}>
                      No uploads yet.
                    </div>
                  ) : (
                    uploads.map((u) => (
                      <div
                        key={u.id}
                        className='flex items-center gap-2 text-xs rounded-lg px-2 py-2'
                        style={{ background: 'rgba(0,0,0,.25)' }}
                      >
                        <CheckCircle2 className='w-3.5 h-3.5' />
                        <div className='truncate'>{u.name}</div>
                        <div
                          className='ml-auto'
                          style={{ color: 'var(--muted)' }}
                        >
                          {Math.ceil(u.size / 1024)} KB
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>

              {/* Quick Calendar card with outer glow */}
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className='ai-glow-card p-4'
              >
                <div className='flex items-center gap-2 mb-3'>
                  <Calendar className='w-5 h-5' />
                  <div className='font-medium'>Quick Calendar</div>
                </div>
                <div className='text-sm'>
                  Type a natural sentence in chat like:
                </div>
                <div className='text-xs mt-1' style={{ color: 'var(--muted)' }}>
                  “Dentist on 9th Dec at 3pm for 30 minutes.”
                </div>
              </motion.div>
            </div>

            {/* Right: Chat panel with outer glow */}
            <div className='md:col-span-2 flex flex-col ai-glow-card overflow-hidden'>
              <div className='flex-1 overflow-auto p-4 space-y-3'>
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className='max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow'
                    style={{
                      background:
                        m.role === 'assistant'
                          ? 'var(--chat-assistant)'
                          : 'var(--chat-user)',
                      color:
                        m.role === 'assistant'
                          ? 'var(--chat-assistant-ink)'
                          : 'var(--chat-user-ink)',
                      marginLeft: m.role === 'assistant' ? undefined : 'auto',
                    }}
                  >
                    {m.text === '...' && isThinking ? (
                      <TypingDots />
                    ) : (
                      <span>{m.text}</span>
                    )}
                  </div>
                ))}
              </div>

              <div
                className='p-3'
                style={{ borderTop: '1px solid var(--edge)' }}
              >
                <div className='flex items-center gap-2'>
                  <button
                    className='hidden md:inline-flex ai-icon-btn px-3 py-2'
                    onClick={openFilePicker}
                    title='Upload image(s)'
                  >
                    <ImageIcon className='w-4 h-4' />
                  </button>

                  {/* Voice/Mic button */}
                  <button
  className={`hidden md:inline-flex ai-icon-btn px-3 py-2 ${
    isRecording ? 'border-green-400' : ''
  }`}
  onClick={() => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  }}
  title={isRecording ? 'Stop voice input' : 'Start voice input'}
>
  <Mic className='w-4 h-4' />
</button>


                  <input
                    className='flex-1 ai-input ai-input-glow px-3 py-2'
                    placeholder={'Ask anything… e.g., "Add dentist 9 Dec 3pm"'}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSend()}
                  />
                  <button
                    className='inline-flex items-center gap-1 ai-send px-3 py-2'
                    onClick={onSend}
                  >
                    <SendHorizontal className='w-4 h-4' /> Send
                  </button>
                </div>
                <div
                  className='mt-2 text-[11px]'
                  style={{ color: 'var(--muted)' }}
                >
                  This is a <strong>mock</strong> if no API is configured. Drag
                  & drop works on desktop; tap the bucket on mobile.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>{' '}
      {/* /app */}
    </div>
  );
}
