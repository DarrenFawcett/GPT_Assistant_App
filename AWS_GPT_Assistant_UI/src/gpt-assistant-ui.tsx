// ---🔗 React + Animation Core ---
import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// ---📦 Icons from Lucide ---
import {
  UploadCloud,
  Calendar,
  ImageIcon,
  SendHorizontal,
  CheckCircle2,
  Mic,
} from 'lucide-react';

// ---🎨 Global Styles + Branding ---
import { ThemeStyles, GlowStyles } from './styles/ThemeStyles';
import { AssistantIcon } from './styles/gpt-assistant-ui';
import BottomGlow from './styles/BottomGlow';

// ---🧠 Custom Hooks ---
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTokens } from './hooks/useTokens';
import { useWakeUpPing } from './hooks/useWakeUpPing';
import { useChatLogic } from './hooks/useChatLogic';
import { useUploads } from './hooks/useUploads';

// ---🧱 Components ---
import TopTabs from './components/TopTabs.tsx';
import TabContent from './components/TabContent';
import SideInfoCard from './components/SideInfoCard';
import UploadPanel from './components/UploadPanel.tsx';

// ---🌍 Environment ---
const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
async function sendToApi(message: string, endpoint: string) {
  const url = `${API_BASE?.replace(/\/+$/, '')}/${endpoint}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* -----------------------------------------------
 🔁 Main Component
------------------------------------------------- */
export default function AssistantUI() {
  // 🟢 wake Lambda
  useWakeUpPing();

  // 🎙️ mic state
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 🔐 tokens
  const { userToken, apiToken } = useTokens();

  // 💬 chat logic
  const { messages, setInput, input, isThinking, addMessage } = useChatLogic();

  // 📁 uploads
  const { uploads, isUploading, fileInputRef, openFilePicker, handleFiles, onDrop, onDragOver } =
    useUploads();

  // 🧭 tabs
  const [activeTab, setActiveTab] = useState('chat');

  // 🔐 access gate
  if (API_BASE && (!userToken || !apiToken)) {
    return (
      <div className="flex justify-center items-center h-screen text-slate-300 text-lg">
        🔐 Awaiting access…
      </div>
    );
  }

  return (
    <div className="theme-ai-dark">
      <ThemeStyles />
      <GlowStyles />

      <div
        className="relative min-h-screen w-full p-4 md:p-8"
        style={{ background: 'var(--app)', color: 'var(--ink)' }}
      >
        <BottomGlow />

        <div className="mx-auto max-w-5xl relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <AssistantIcon />
            <div>
              <div className="text-xl font-semibold">kAI – Your AI Assistant</div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>
                Chat smarter • Stay organized • Get things done
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full px-4 mb-6">
            <TopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left */}
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

            {/* Right */}
            <div className="md:col-span-2">
              <TabContent
                activeTab={activeTab as TabType}
                chatProps={{
                  messages,
                  input,
                  setInput,
                  onSend: async (text: string) => {
                    addMessage({ role: "user", text });
                    setInput("");
                    try {
                      const data = await sendToApi(text, "chat");
                      addMessage({ role: "assistant", text: data.reply });
                    } catch {
                      addMessage({ role: "assistant", text: "❌ Chat API failed" });
                    }
                  },
                  isThinking,
                  isRecording,
                  recognitionRef,
                  openFilePicker,
                }}
                calendarProps={{
                  messages,
                  input,
                  setInput,
                  onSend: async (text: string) => {
                    addMessage({ role: "user", text });
                    setInput("");
                    try {
                      const data = await sendToApi(text, "calendar");
                      addMessage({ role: "assistant", text: data.reply });
                    } catch {
                      addMessage({ role: "assistant", text: "❌ Calendar API failed" });
                    }
                  },
                  isThinking,
                  isRecording,
                  recognitionRef,
                  openFilePicker,
                }}
                todoProps={{
                  messages,
                  input,
                  setInput,
                  onSend: async (text: string) => {
                    addMessage({ role: "user", text });
                    setInput("");
                    try {
                      const data = await sendToApi(text, "todo");
                      addMessage({ role: "assistant", text: data.reply });
                    } catch {
                      addMessage({ role: "assistant", text: "❌ To-Do API failed" });
                    }
                  },
                  isThinking,
                }}
                notesProps={{
                  messages,
                  input,
                  setInput,
                  onSend: async (text: string) => {
                    addMessage({ role: "user", text });
                    setInput("");
                    try {
                      const data = await sendToApi(text, "notes");
                      addMessage({ role: "assistant", text: data.reply });
                    } catch {
                      addMessage({ role: "assistant", text: "❌ Notes API failed" });
                    }
                  },
                  isThinking,
                }}
                emailProps={{
                  messages,
                  input,
                  setInput,
                  onSend: async (text: string) => {
                    addMessage({ role: "user", text });
                    setInput("");
                    try {
                      const data = await sendToApi(text, "email");
                      addMessage({ role: "assistant", text: data.reply });
                    } catch {
                      addMessage({ role: "assistant", text: "❌ Email API failed" });
                    }
                  },
                  isThinking,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
