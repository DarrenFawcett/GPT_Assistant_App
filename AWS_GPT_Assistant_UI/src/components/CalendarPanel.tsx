// src/components/CalendarPanel.tsx
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import StarterBubble from "./StarterBubble";
import { starterTexts } from "./StarterBubble";

export default function CalendarPanel({
  messages = [],
  input = "",
  setInput,
  onSend,
  isThinking,
  isRecording,
  recognitionRef,
  openFilePicker,
}: Props) {
  // 🔑 If no messages, show the calendar starter text
  const showStarter = !messages || messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {showStarter && <StarterBubble text={starterTexts.calendar} />}

        {messages.map((m) => (
          <div
            key={m.id}
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
            <span>{m.text}</span>
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

      <InputRow
        placeholder='Add event… e.g., "Meeting with John tomorrow at 10am"'
        value={input}
        onChange={setInput}
        onSubmit={() => onSend(input)}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Add"
        helperText="Type natural text, and it will create a calendar event."
      />
    </div>
  );
}
