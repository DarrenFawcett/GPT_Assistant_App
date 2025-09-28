// src/components/EmailPanel.tsx
import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { EMAIL_URL } from "../config/api";
import { starterTexts } from "./StarterBubble";

interface EmailMessage {
  role: "user" | "assistant";
  text: string;
}

interface EmailPanelProps {
  isRecording?: boolean;
  recognitionRef?: any;
}

export default function EmailPanel({
  isRecording,
  recognitionRef,
}: EmailPanelProps) {
  const [messages, setMessages] = useState<EmailMessage[]>([
    { role: "assistant", text: starterTexts.email },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 👇 upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Debug log

  const addEmail = async () => {
    const text = input.trim();
    if (!text) return;


    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(EMAIL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "Email",
          message: text,
        }),
      });

      const data = await res.json();

      const replyText = data.reply || "⚠️ No reply from Email server";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: replyText },
      ]);
    } catch (err) {
      console.error("❌ Email API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to Email API" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // 👇 open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // 👇 handle file chosen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `📎 Attached: ${file.name}` },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
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

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Input row */}
      <InputRow
        placeholder='Write an email… e.g., "Send update to Sarah about AWS project"'
        value={input}
        onChange={setInput}
        onSubmit={addEmail}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker} // ✅ wired
        buttonLabel="Send"
        helperText="Drafts/Replies appear above."
      />
    </div>
  );
}
