// IMPORTS
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

// HOOKS
import { ThemeStyles, GlowStyles, TypingDots } from './styles/ThemeStyles';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTokens } from './hooks/useTokens';
import { useWakeUpPing } from './hooks/useWakeUpPing';
import { useChatLogic } from './hooks/useChatLogic';
import { useUploads } from './hooks/useUploads';

// COMPONENTS
import TopTabs from './components/TopTabs.tsx';
import ChatPanel from './components/ChatPanel';
import CalendarPanel from './components/CalendarPanel';
import TodoPanel from './components/TodoPanel';
import NotesPanel from './components/NotesPanel';
import EmailPanel from './components/EmailPanel';
import TabContent from './components/TabContent';
import SideInfoCard from './components/SideInfoCard';
import UploadPanel from './components/UploadPanel.tsx';


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

const [activeTab, setActiveTab] = useState('Chat');


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

            <div className="w-full px-4 mb-6">
              <div className="mt-6">
                <TopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
                <TabContent activeTab={activeTab} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Left column */}
              <div className="md:col-span-1 space-y-4">
                <SideInfoCard activeTab={activeTab} />
                <UploadPanel
                  uploads={uploads}
                  isUploading={isUploading}
                  fileInputRef={fileInputRef}
                  openFilePicker={openFilePicker}
                  handleFiles={handleFiles}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                />
              </div>  

              {/* Right column */}
              <ChatPanel
                messages={messages}
                input={input}
                setInput={setInput}
                onSend={onSend}
                isThinking={isThinking}
                isRecording={isRecording}
                setIsRecording={setIsRecording}
                recognitionRef={recognitionRef}
                openFilePicker={openFilePicker}
              />
            </div>

        </div>
      </div>{' '}
      {/* /app */}
    </div>
  );
}
