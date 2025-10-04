import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { EMAIL_URL } from "../config/api"; // You can later hook this to your email lambda

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
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {/* Email Info */}
      <div className="pl-1">
        <div className="font-semibold">{subject}</div>
        <div className="text-xs opacity-70">
          From: {sender} • Status: {status}
        </div>
      </div>

      {/* Circle Select Button */}
      <button
        onClick={() => onSelect?.(subject)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition
          ${
            isSelected
              ? "bg-sky-500 border border-sky-500 text-white"
              : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
          }`}
      >
        {isSelected && ""}
      </button>
    </div>
  );
}

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
      text: "📧 Hi! I can help you draft, find, or organise your emails — try something like 'Write a reply to John about the meeting' or 'Show unread messages'.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAction, setActiveAction] = useState<"compose" | "find" | "delete" | null>("compose");

  const addMessage = async () => {
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
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      let replyText = data.reply || "✉️ Message processed.";

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
    <div className="px-2 py-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* LEFT COLUMN (Help + Chat) */}
        <div className="flex flex-col gap-2 justify-between">

          {/* Email Help */}
          <div className="ai-glow-card rounded-2xl p-4"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sky-400 text-lg">📬</span>
              <h3 className="font-semibold">
                Email Help <span className="font-normal opacity-80 text-sm">· Compose / Search / Delete</span>
              </h3>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Write email to John
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Find unread emails
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Delete draft
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-8">
            <button
              onClick={() => setActiveAction("compose")}
              className={`ml-4 flex-1 text-center px-1 rounded-full py-1 flex items-center justify-center gap-1 transition
                ${
                  activeAction === "compose"
                    ? "border-2 border-sky-400 text-sky-300"
                    : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
                }`}
            >
              🖊️ Compose
            </button>

            <button
              onClick={() => setActiveAction("find")}
              className={`flex-1 text-center px-1 rounded-full py-1 flex items-center justify-center gap-1 transition
                ${
                  activeAction === "find"
                    ? "border-2 border-sky-400 text-sky-300"
                    : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
                }`}
            >
              🔍 Find
            </button>

            <button
              onClick={() => setActiveAction("delete")}
              className={`mr-4 flex-1 text-center px-1 rounded-full py-1 flex items-center justify-center gap-1 transition
                ${
                  activeAction === "delete"
                    ? "border-2 border-sky-400 text-sky-300"
                    : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
                }`}
            >
              🗑️ Delete
            </button>
          </div>

          {/* Chat box */}
          <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[282px]"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            <div className="flex-1 overflow-auto space-y-3 min-h-0">
              {messages.map((m, idx) => (
                <div key={idx}
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
                  style={{
                    background: m.role === "assistant" ? "var(--chat-assistant)" : "var(--chat-user)",
                    color: m.role === "assistant" ? "var(--chat-assistant-ink)" : "var(--chat-user-ink)",
                    marginLeft: m.role === "assistant" ? undefined : "auto",
                  }}>
                  {m.text}
                </div>
              ))}
              {isThinking && (
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
                  style={{ background: "var(--chat-assistant)", color: "var(--chat-assistant-ink)" }}>
                  <TypingDots />
                </div>
              )}
            </div>

            <InputRow
              placeholder='Write email… e.g., "Draft message to John about project"'
              value={input}
              onChange={setInput}
              onSubmit={addMessage}
              showUpload
              showMic
              isRecording={isRecording}
              recognitionRef={recognitionRef}
              openFilePicker={() => fileInputRef.current?.click()}
              buttonLabel="Send"
            />
          </div>
        </div>

        {/* RIGHT COLUMN (Inbox Preview) */}
        <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[425px]">
          <div className="flex pt-1 justify-center items-center">
            <h2 className="text-lg font-semibold pb-2">Inbox Preview</h2>
          </div>

          {/* Example Emails */}
          <EmailCard
            subject="Meeting Recap"
            sender="John Doe"
            status="Unread"
            isSelected={selectedEmail === "Meeting Recap"}
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
      </div>
    </div>
  );
}
