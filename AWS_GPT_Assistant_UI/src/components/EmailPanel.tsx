// src/components/EmailPanel.tsx
import { useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import StarterBubble from "./StarterBubble";
import { starterTexts } from "./StarterBubble";


interface EmailPanelProps {
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
  onSend?: (val: string) => void;
}

export default function EmailPanel({
  isRecording,
  recognitionRef,
  openFilePicker,
  onSend,
}: EmailPanelProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [input, setInput] = useState("");

  const addEmail = () => {
    const text = input.trim();
    if (!text) return;
    setEmails(prev => [...prev, text]);
    setInput("");
    onSend?.(text); // optional backend hook
  };

  return (
    <div className="flex flex-col h-full">
      {/* list OR starter bubble */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {emails.length === 0 ? (
          <StarterBubble text={starterTexts.email} />
        ) : (
          emails.map((mail, idx) => (
            <div
              key={idx}
              className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
              style={{
                background: "var(--chat-user)",
                color: "var(--chat-user-ink)",
              }}
            >
              {mail}
            </div>
          ))
        )}
      </div>

      {/* input row */}
      <InputRow
        placeholder='Write an email… e.g., "Send update to Sarah about AWS project"'
        value={input}
        onChange={setInput}
        onSubmit={addEmail}
        showUpload={true}
        showMic={true}
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel="Send"
        helperText="Drafts appear above. Hook backend later for real sending."
      />
    </div>
  );
}
