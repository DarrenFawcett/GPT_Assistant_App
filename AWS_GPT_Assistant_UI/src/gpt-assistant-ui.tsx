// ---🔗 React + Animation Core ---
import { useCallback, useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// ---📦 Icons from Lucide (used in buttons, tabs, etc) ---
import {
  UploadCloud,
  Calendar,
  ImageIcon,
  SendHorizontal,
  CheckCircle2,
  Mic,
} from 'lucide-react';

// ---🎨 Global Styles + Branding ---
import { ThemeStyles, GlowStyles, TypingDots } from './styles/ThemeStyles';
import { AssistantIcon } from './styles/gpt-assistant-ui';
import BottomGlow from './styles/BottomGlow'; // 🔆 Soft glow behind page

// ---🧠 Custom Hooks (Logic for state + actions) ---
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTokens } from './hooks/useTokens';                   // Auth tokens
import { useWakeUpPing } from './hooks/useWakeUpPing';           // Cold-start warm ping
import { useChatLogic } from './hooks/useChatLogic';             // Chat messages
import { useUploads } from './hooks/useUploads';                 // Upload handling

// ---🧱 Components (Visible UI elements) ---
import TopTabs from './components/TopTabs.tsx';
import ChatPanel from './components/ChatPanel';
import CalendarPanel from './components/CalendarPanel';
import TodoPanel from './components/TodoPanel';
import NotesPanel from './components/NotesPanel';
import EmailPanel from './components/EmailPanel';
import TabContent from './components/TabContent';
import SideInfoCard from './components/SideInfoCard';
import UploadPanel from './components/UploadPanel.tsx';

// ---📌 Shared Types ---
type Role = 'user' | 'assistant' | 'system';       // Who sent the message

type Message = {
  id: string;
  role: Role;
  text: string;
};

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
};

// ---🌍 Environment Variables (API URL etc) ---
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

/* -----------------------------------------------
 🔁 Main Component: AssistantUI
------------------------------------------------- */
export default function AssistantUI() {
  // 🟢 1. Wake up backend (avoid cold starts)
  useWakeUpPing();

  // 🎨 2. Theme (dark by default)
  const [theme] = useState<'dark' | 'light'>('dark');

  // 🎙️ 3. Mic + speech input state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 🔐 4. Tokens for API access (auth / identity)
  const { userToken, apiToken, setUserToken, setApiToken } = useTokens();

  // 💬 5. Chat logic (messages, input, reply, GPT state)
  const {
    messages,
    setInput,
    input,
    isThinking,
    onSend,
    addMessage,
  } = useChatLogic();

  // 📁 6. Upload state + file handling
  const {
    uploads,
    isUploading,
    fileInputRef,
    openFilePicker,
    handleFiles,
    onDrop,
    onDragOver,
  } = useUploads(addMessage);

  // 🧭 7. UI tab state (Chat / Calendar / Notes / etc.)
  const [activeTab, setActiveTab] = useState('Chat');

  // 🔐 8. Auth check gate – don't show UI until tokens are ready
  if (API_BASE && (!userToken || !apiToken)) {
    return (
      <div className='flex justify-center items-center h-screen text-slate-300 text-lg'>
        🔐 Awaiting access…
      </div>
    );
  }

  // ✅ 9. Render main UI
  return (
    <div className='theme-ai-dark'>
      <ThemeStyles />
      <GlowStyles />

      {/* Main Container */}
      <div
        className="relative min-h-screen w-full p-4 md:p-8"
        style={{ background: 'var(--app)', color: 'var(--ink)' }}
      >
        {/* ✨ Glow at bottom edge */}
        <BottomGlow />

        {/* Page Layout */}
        <div className='mx-auto max-w-5xl relative'>

          {/* 📌 Header */}
          <div className='flex items-center gap-3 mb-4'>
            <AssistantIcon />
            <div>
              <div className='text-xl font-semibold'>My GPT Assistant</div>
              <div className='text-sm' style={{ color: 'var(--muted)' }}>
                Chats • Upload images to S3 Bucket • Add calendar events
              </div>
            </div>
          </div>

          {/* 🧭 Tab Switcher (Chat / Calendar / etc.) */}
          <div className="w-full px-4 mb-6">
            <div className="mt-6">
              <TopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabContent activeTab={activeTab} />
            </div>
          </div>

          {/* 🔲 Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left Column: Info Cards + Upload */}
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

            {/* Right Column: Chat Panel */}
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
      </div>
    </div>
  );
}
