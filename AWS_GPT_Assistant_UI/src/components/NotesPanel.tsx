import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import StarterBubble, { starterTexts } from "./StarterBubble";

interface NotesPanelProps {
  messages?: { id: string; role: "user" | "assistant"; text: string }[];
  input: string;
  setInput: (val: string) => void;
  onSend: (val: string) => void;
  isThinking?: boolean;
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
}

export default function NotesPanel({
  messages = [],
  input,
  setInput,
  onSend,
  isThinking,
  isRecording,
  recognitionRef,
  openFilePicker,
}: NotesPanelProps) {
  // 👇 Ensure starter text appears when empty
  const displayMessages =
    messages.length === 0
      ? [
          {
            id: "welcome-notes",
            role: "assistant" as const,
            text: starterTexts.notes,
          },
        ]
      : messages;

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {displayMessages.map((m) => (
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

      {/* InputRow */}
      <InputRow
        placeholder='Jot down a note… e.g., "Meeting takeaways"'
        value={input}
        onChange={setInput}
        onSubmit={() => onSend(input)}
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
