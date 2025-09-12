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

import { ThemeStyles, GlowStyles, TypingDots } from './styles/ThemeStyles';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTokens } from './hooks/useTokens';
import { useWakeUpPing } from './hooks/useWakeUpPing';
import { useChatLogic } from './hooks/useChatLogic';
import { useUploads } from './hooks/useUploads';

// import Header from './components/Header';
// import BucketPanel from './components/BucketPanel';
// import CalendarPanel from './components/CalendarPanel';
// import ChatPanel from './components/ChatPanel';
// import InputBar from './components/InputBar';

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


export default function AssistantUI() {
   // Wake-up hook
  useWakeUpPing();

  // 1) Theme
  const [theme] = useState<'dark' | 'light'>('dark');

  // 2) Mic state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 3) Auth state – moved to custom hook!
  const { userToken, apiToken, setUserToken, setApiToken } = useTokens();

  // 5) Chat state
 const {
  messages,
  setInput,
  input,
  isThinking,
  onSend,
  addMessage,
} = useChatLogic();

  // --- Uploads (mock Stage 1) ---
  const {
  uploads,
  isUploading,
  fileInputRef,
  openFilePicker,
  handleFiles,
  onDrop,
  onDragOver,
} = useUploads(addMessage); // <- from useChatLogic

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
                    title={
                      isRecording ? 'Stop voice input' : 'Start voice input'
                    }
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
