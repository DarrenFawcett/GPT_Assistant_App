import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import StarterBubble from "./StarterBubble";
import { starterTexts } from "./StarterBubble";


interface ChatPanelProps {
  messages?: { id: string; role: "user" | "assistant"; text: string }[];
  input: string;
  setInput: (val: string) => void;
  onSend: (val: string) => void;
  isThinking?: boolean;
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
}

export default function ChatPanel({
  messages = [],
  input,
  setInput,
  onSend,
  isThinking,
  isRecording,
  recognitionRef,
  openFilePicker,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">

        {/* 👇 Starter bubble when empty */}
        {messages.length === 0 && (
          <StarterBubble text={starterTexts.todo} />
        )}
        

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

      {/* InputRow (reused across all tabs) */}
      <InputRow
        placeholder='Add task… e.g., "Pay bills on Friday"'
        value={input}
        onChange={setInput}
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
