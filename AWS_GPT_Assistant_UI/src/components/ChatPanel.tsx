import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CHAT_URL } from "../config/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ChatPanel({ onSend }: { onSend?: (val: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 🎤 Mic state
  const [isRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // 📁 File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilePick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("📁 File selected:", file.name);
      // 👉 later: upload to S3
    }
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

      // ✅ Handle calendar add response
      if (data.calendar_added) {
        const card = Array.isArray(data.calendar_added)
          ? data.calendar_added[0]
          : data.calendar_added;
        const replyText = `✅ ${card.title} — ${card.subtitle}`;
        setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
      }
      // 📅 Handle events list
      else if (data.events) {
        const list = data.events.map((e: any) => `• ${e.title}`).join("\n");
        setMessages((prev) => [...prev, { role: "assistant", text: list }]);
      }
      // 💬 Handle plain reply
      else if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
      }
      // ⚠️ Handle errors
      else if (data.error) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `⚠️ ${data.error}` },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to GPT" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Intro bubble */}
      <div className="p-4">
        <div
          className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
          style={{
            background: "var(--chat-assistant)",
            color: "var(--chat-assistant-ink)",
          }}
        >
          How can I assist you today?
        </div>
      </div>

      {/* Chat history */}
      <div className="flex-1 overflow-auto px-4 space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
            style={{
              background:
                m.role === "assistant"
                  ? "var(--chat-assistant)"
                  : "var(--chat-user)",
              color:
                m.role === "assistant"
                  ? "var(--chat-assistant-ink)"
                  : "var(--chat-user-ink)",
              marginLeft: m.role === "assistant" ? undefined : "auto",
            }}
          >
            {m.text}
          </div>
        ))}

        {isThinking && (
          <div
            className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
            style={{
              background: "var(--chat-assistant)",
              color: "var(--chat-assistant-ink)",
            }}
          >
            <TypingDots />
          </div>
        )}
      </div>

            {/* Input row */}
      <InputRow
        placeholder='Ask anything… e.g., "Add dentist 9 Dec 3pm"'
        value={input}
        onChange={setInput}
        onSubmit={addMessage}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={handleFilePick}
        buttonLabel="Send"
        helperText="Type your message and hit send."
      />
    </div>
  );
}

