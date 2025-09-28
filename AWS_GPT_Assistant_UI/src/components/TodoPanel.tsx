import { useState } from "react";
import InputRow from "./InputRow";
import { TypingDots } from "../styles/ThemeStyles";
import { TODO_URL } from "../config/api";

interface TaskMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ToDoPanel({
  isRecording,
  recognitionRef,
  openFilePicker,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
}) {
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const addTask = async () => {
    const text = input.trim();
    if (!text) return;

    // user bubble
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    setIsThinking(true);
    try {
      const res = await fetch(TODO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "To-Do",
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        (data.tasks?.length
          ? data.tasks.map((t: any) => `✅ ${t}`).join("\n")
          : "⚠️ No reply from server");

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to To-Do API" },
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
          Add tasks like: “Buy milk” or “Finish portfolio site”
        </div>
      </div>

      {/* To-Do history */}
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
        placeholder='Add task… e.g., "Pay bills on Friday"'
        value={input}
        onChange={setInput}
        onSubmit={addTask}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Add"
        helperText="Click a task to mark it complete."
      />
    </div>
  );
}
