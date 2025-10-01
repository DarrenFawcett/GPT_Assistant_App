// src/components/CalendarPanel.tsx
import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CALENDAR_URL } from "../config/api";

interface CalendarMessage {
  role: "user" | "assistant";
  text: string;
}

export default function CalendarPanel({
  isRecording,
  recognitionRef,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
}) {
  const [messages, setMessages] = useState<CalendarMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  // 👇 upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Debug log props (like ChatPanel)

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const addMessage = async () => {
    const text = input.trim();
    if (!text) return;


    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(CALENDAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "Calendar",
          messages: [{ role: "user", content: text }],
        }),
      });

    const data = await res.json();
      let replyText: string;

      if (data.calendar_added) {
        // Normalize in case it's array or single object
        const card = Array.isArray(data.calendar_added)
          ? data.calendar_added[0]
          : data.calendar_added;
        replyText = `✅ ${card.title} — ${card.subtitle}`;
      } else if (data.reply) {
        replyText = data.reply;
      } else if (data.event) {
        const ev = data.event;
        replyText = `📅 ${ev.summary} — ${formatDate(
          ev.start?.dateTime || ev.start?.date
        )}`;
      } else if (data.events?.length) {
        replyText = data.events
          .map(
            (ev: any) =>
              `📅 ${ev.summary} — ${formatDate(
                ev.start?.dateTime || ev.start?.date
              )}`
          )
          .join("\n");
      } else if (data.error) {
        replyText = `⚠️ ${data.error}`;
      } else {
        replyText = "🤔 I couldn’t find any events that match.";
      }


      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      console.error("❌ Calendar API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to Calendar API" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // 👇 file upload helpers
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `📷 Uploaded: ${file.name}` },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <div
          className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
          style={{
            background: "var(--chat-assistant)",
            color: "var(--chat-assistant-ink)",
          }}
        >
          What event would you like me to add to your calendar?
        </div>
      </div>

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

      {/* Hidden upload input */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <InputRow
        placeholder='Add event… e.g., "Meeting with John tomorrow at 10am"'
        value={input}
        onChange={setInput}
        onSubmit={addMessage}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Add"
        helperText="Type a natural sentence and I’ll create a calendar event."
      />
    </div>
  );
}
