// src/components/EmailPanel.tsx
import { useRef, useState, useEffect } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { EMAIL_URL } from "../config/api";
import PanelTemplate from "./PanelTemplate";
import ChipRotatorWithButton from "./ChipRotator";

// ---------------------------
// ✅ EmailCard (for right column preview)
// ---------------------------
function EmailCard({
  subject,
  sender,
  status,
  onSelect,
  isSelected,
}: {
  subject: string;
  sender: string;
  status: string;
  onSelect?: (subject: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3 transition"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      <div className="pl-1">
        <div className="font-semibold">{subject}</div>
        <div className="text-xs opacity-70">
          From: {sender} • Status: {status}
        </div>
      </div>

      <button
        onClick={() => onSelect?.(subject)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition
          ${
            isSelected
              ? "bg-sky-500 border border-sky-500 text-white"
              : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
          }`}
      />
    </div>
  );
}

// ---------------------------
// ✅ EmailPanel Component
// ---------------------------
interface EmailMessage {
  role: "user" | "assistant";
  text: string;
}

export default function EmailPanel({
  isRecording,
  recognitionRef,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
}) {
  const [messages, setMessages] = useState<EmailMessage[]>([
    {
      role: "assistant",
      text: "📧 Hi! I can help you manage emails — try 'Compose email to John', 'Find unread', or 'Summarise inbox'.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<
    "compose" | "find" | "summarise" | "delete"
  >("compose");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ---------------------------
  // 📤 Handle submit
  // ---------------------------
  const handleSubmit = async () => {
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
          action: activeAction,
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      let replyText = data.reply || "✉️ Email action complete.";

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
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

  // ---------------------------
  // 📎 File handler
  // ---------------------------
  const openFilePicker = () => fileInputRef.current?.click();
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
    <PanelTemplate
      topExtra={
        <ChipRotatorWithButton
          header="Emails:"
          items={[
            { icon: "🖊️", label: "Compose", text: "Send update to John" },
            { icon: "🔍", label: "Find", text: "Search unread messages" },
            { icon: "🧠", label: "Summarise", text: "Summarise this week’s inbox" },
            { icon: "🗑️", label: "Delete", text: "Remove old drafts" },
          ]}
        />
      }
      actions={["compose", "find", "summarise", "delete"].map((action) => (
        <button
          key={action}
          onClick={() => setActiveAction(action as any)}
          className={`flex-1 text-center px-0 py-[0px] sm:py-[1px] rounded-full flex items-center justify-center gap-1 text-xs sm:text-sm transition
            ${
              activeAction === action
                ? "border-2 border-sky-400 text-sky-300"
                : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
            }`}
        >
          {action === "compose"
            ? "🖊️ Compose"
            : action === "find"
            ? "🔍 Find"
            : action === "summarise"
            ? "🧠 Summarise"
            : "🗑️ Delete"}
        </button>
      ))}
      rightColumn={
        <>
          <div className="flex justify-center items-center pb-2">
            <h2 className="text-lg font-semibold">Inbox Preview</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <EmailCard
              subject="Project Update"
              sender="John Doe"
              status="Unread"
              isSelected={selectedEmail === "Project Update"}
              onSelect={setSelectedEmail}
            />
            <EmailCard
              subject="AWS Billing Notice"
              sender="Amazon Web Services"
              status="Read"
              isSelected={selectedEmail === "AWS Billing Notice"}
              onSelect={setSelectedEmail}
            />
          </div>
        </>
      }
    >
      {/* 💬 Chat Section */}
      <div
        className="flex-1 overflow-y-auto space-y-3 custom-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
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

        <div ref={bottomRef} />
      </div>

      {/* ✍️ Input Row */}
      <InputRow
        placeholder={
          activeAction === "compose"
            ? 'Write email… e.g., "Draft reply to John about meeting"'
            : activeAction === "find"
            ? 'Search emails… e.g., "Unread from last week"'
            : activeAction === "summarise"
            ? 'Summarise… e.g., "Summarise inbox for today"'
            : 'Delete email… e.g., "Remove old draft"'
        }
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        showUpload
        showMic
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={openFilePicker}
        buttonLabel={activeAction === "compose" ? "Send" : "Go"}
      />
    </PanelTemplate>
  );
}
