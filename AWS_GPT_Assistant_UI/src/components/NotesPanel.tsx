// src/components/NotesPanel.tsx
import { useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { NOTES_URL } from "../config/api";
import { starterTexts } from "./StarterBubble";

interface NoteMessage {
  role: "user" | "assistant";
  text: string;
}

export default function NotesPanel({
  isRecording,
  recognitionRef,
  openFilePicker,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
}) {
  // 👇 initialize with welcome message so it always stays
  const [messages, setMessages] = useState<NoteMessage[]>([
    { role: "assistant", text: starterTexts.notes },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const addNote = async () => {
    const text = input.trim();
    if (!text) return;

    // user bubble
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    setIsThinking(true);
    try {
      const res = await fetch(NOTES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const replyText = data.reply || "⚠️ No reply from Notes Lambda";

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error saving note" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Notes list */}
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

      {/* InputRow */}
      <InputRow
        placeholder='Jot down a note… e.g., "Meeting takeaways"'
        value={input}
        onChange={setInput}
        onSubmit={addNote}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Save"
        helperText="Notes are saved above."
      />
    </div>
  );
}
