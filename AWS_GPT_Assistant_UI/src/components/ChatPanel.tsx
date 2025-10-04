// src/components/ChatPanel.tsx
import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CHAT_URL } from "../config/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ChatPanel({ onSend }: { onSend?: (val: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "👋 Hi! I’m kAI — here to help you chat, plan, and stay organised. Ask me anything below, or drop a PDF on the right if you’d like me to save it to S3 for documentation — I’ll file it under whatever you request.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 🎤 Mic state
  const [isRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 📁 File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFilePick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) console.log("📁 File selected:", file.name);
  };

  const addMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    onSend?.(text);

    setIsThinking(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "Chat",
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();

      if (data.calendar_added) {
        const card = Array.isArray(data.calendar_added)
          ? data.calendar_added[0]
          : data.calendar_added;
        const replyText = `✅ ${card.title} — ${card.subtitle}`;
        setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
      } else if (data.events) {
        const list = data.events.map((e: any) => `• ${e.title}`).join("\n");
        setMessages((prev) => [...prev, { role: "assistant", text: list }]);
      } else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      } else if (data.error) {
        setMessages((prev) => [...prev, { role: "assistant", text: `⚠️ ${data.error}` }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to GPT" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2 py-4 h-full">

      {/* Chat box */}
      <div
        className="order-2 md:order-none md:col-span-2 flex flex-col ai-glow-card rounded-2xl p-2 min-h-[400px]"
        style={{ color: "var(--ink)", background: "var(--surface-2)" }}
      >
        {/* History */}
        <div className="flex-1 overflow-auto space-y-3 min-h-0">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
              style={{
                background: m.role === "assistant" ? "var(--chat-assistant)" : "var(--chat-user)",
                color: m.role === "assistant" ? "var(--chat-assistant-ink)" : "var(--chat-user-ink)",
                marginLeft: m.role === "assistant" ? undefined : "auto",
              }}
            >
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
              style={{ background: "var(--chat-assistant)", color: "var(--chat-assistant-ink)" }}
            >
              <TypingDots />
            </div>
          )}
        </div>

        {/* Input row */}
        <div className="mt-4">
          <InputRow
            placeholder='Ask anything… e.g., "Add dentist 9 Dec 3pm"'
            value={input}
            onChange={setInput}
            onSubmit={addMessage}
            showUpload
            showMic
            isRecording={isRecording}
            recognitionRef={recognitionRef}
            openFilePicker={handleFilePick}
            buttonLabel="Send"
          />
        </div>
      </div>

      {/* RIGHT-SIDE COLUMN (Quick Chat + S3 Upload) */}
      <div className="order-1 md:order-none md:col-span-1 flex flex-col gap-4">
        {/* Quick Chat */}
        <div
          className="ai-glow-card rounded-2xl p-4"
          style={{ background: "var(--surface-2)", color: "var(--ink)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-yellow-400">💡</span>
            <h3 className="font-semibold">
              Quick Chat <span className="font-normal opacity-80 text-sm">· Try these</span>
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
              What’s the weather like tomorrow?
            </span>
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
              Tell me a joke
            </span>
            <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
              Add dentist 9 Dec 3 pm
            </span>
          </div>
        </div>

        {/* S3 Upload Bucket */}
        <div
          className="ai-glow-card rounded-2xl p-4 min-h-[auto] md:min-h-[270px]"
          style={{ background: "var(--surface-2)", color: "var(--ink)" }}
        >
          <div className="font-semibold mb-2">☁️ S3 Upload Bucket</div>
          <div className="text-sm opacity-80 mb-3 hidden md:block">
            Upload images, PDFs, or docs directly to S3
          </div>
          {/* Upload Zone */}
          <div
            className="border-2 border-dashed rounded-xl p-4 text-center hover:opacity-100 transition
                      flex flex-col items-center justify-center gap-2 min-h-[130px]"
            style={{ borderColor: "rgba(255,255,255,0.3)" }}
          >
            <div className="text-sm hidden md:block">Drag & drop files here</div>
            <button
              onClick={handleFilePick}
              className="px-4 py-1 rounded-lg mb-1"
              style={{ background: "var(--chip)", color: "var(--chip-ink)" }}
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              hidden
              onChange={handleFileChange}
            />
            {/* File types inside box */}
            <div className="flex flex-wrap gap-2 mt-1 justify-center">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs">.jpg</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs">.png</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs">.pdf</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs">.docx</span>
            </div>
          </div>
          {/* Pulse line (mobile only) */}
          <div className="h-[2px] bg-sky-400/40 mt-3 animate-pulse rounded-full md:hidden"></div>
        </div>

      </div>
    </div>
  );
}
