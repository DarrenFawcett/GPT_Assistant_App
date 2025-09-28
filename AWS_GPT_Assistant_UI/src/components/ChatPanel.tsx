import { useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CHAT_URL } from "../config/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

interface ChatPanelProps {
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
  onSend?: (val: string) => void;
}

export default function ChatPanel({
  isRecording,
  recognitionRef,
  openFilePicker,
  onSend,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const addMessage = async () => {
    const text = input.trim();
    if (!text) return;

    // user bubble
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
      const replyText = data.reply || "⚠️ No reply from server";

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
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
      {/* Always-visible intro bubble */}
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
        openFilePicker={openFilePicker}
        buttonLabel="Send"
        helperText="Type your message and hit send."
      />
    </div>
  );
}
