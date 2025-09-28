import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import StarterBubble from "./StarterBubble";
import { starterTexts } from "./StarterBubble";

export default function ChatPanel({
  messages = [],
  input = "",
  setInput,
  onSend,
  isThinking,
  isRecording,
  recognitionRef,
  openFilePicker,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      {/* "Poster" intro message — always visible at top */}
      <div className="p-4">
        <StarterBubble text={starterTexts.chat} />
      </div>

      {/* Actual chat history */}
      <div className="flex-1 overflow-auto px-4 space-y-3">
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

      {/* Input row */}
      <InputRow
        placeholder='Ask anything… e.g., "Add dentist 9 Dec 3pm"'
        value={input}
        onChange={(val) => setInput(val)}   // 👈 now it receives the string
        onSubmit={() => onSend(input)}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Send"
        helperText="Drag & drop works on desktop; tap the bucket on mobile."
      />

    </div>
  );
}
