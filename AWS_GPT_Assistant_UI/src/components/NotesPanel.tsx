import { useRef, useState } from "react";
import InputRow from "./InputRow";
import { TypingDots } from "../styles/ThemeStyles";
import { NotebookText } from "lucide-react";
import { NOTES_URL } from "../config/api"; // (you can add this later)

function NoteCard({
  title,
  date,
  snippet,
  onSelect,
  isSelected,
}: {
  title: string;
  date: string;
  snippet: string;
  onSelect?: (noteTitle: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {/* Note Info */}
      <div className="pl-1 flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs opacity-70 mb-1">{date}</div>
        <div className="text-xs opacity-70 italic truncate">{snippet}</div>
      </div>

      {/* Select Button */}
      <button
        onClick={() => onSelect?.(title)}
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

interface NoteMessage {
  role: "user" | "assistant";
  text: string;
}

export default function NotesPanel({
  isRecording,
  recognitionRef,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
}) {
  const [messages, setMessages] = useState<NoteMessage[]>([
    {
      role: "assistant",
      text: "📝 Hi! I’m kAI — here to help you jot down notes, summaries, or ideas. Try something like 'Create a note about today’s meeting' or 'Show my notes from this week.'",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addNote = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(NOTES_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "Notes",
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      const replyText = data.reply || "✅ Note saved successfully.";
      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      console.error("❌ Notes API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to Notes API" },
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

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4 justify-between">
          
          {/* Notes Tips */}
          <div className="ai-glow-card rounded-2xl p-4"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            <div className="flex items-center gap-2 mb-2">
              <NotebookText className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold">
                Notes Help <span className="font-normal opacity-80 text-sm">· Add / View / Organise</span>
              </h3>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Create note about meeting
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Show my ideas list
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Summarise project notes
              </span>
            </div>
          </div>

          {/* Chat box */}
          <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[322px]"
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
              placeholder='Add note… e.g., "Remember to review AWS billing summary"'
              value={input}
              onChange={setInput}
              onSubmit={addNote}
              showUpload
              showMic
              isRecording={isRecording}
              recognitionRef={recognitionRef}
              openFilePicker={openFilePicker}
              buttonLabel="Add"
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[425px]">
          <div className="flex pt-1 justify-center items-center">
            <h2 className="text-lg font-semibold pb-2">Saved Notes</h2>
          </div>

          <NoteCard
            title="💡 Project Ideas"
            date="Oct 4, 2025"
            snippet="Brainstorming AI-assistant layout and linking across tabs..."
            isSelected={selectedNote === "💡 Project Ideas"}
            onSelect={setSelectedNote}
          />

          <NoteCard
            title="🗓️ Meeting Summary"
            date="Oct 3, 2025"
            snippet="Discussed timeline, Lambda fixes, and UI spacing improvements..."
            isSelected={selectedNote === "🗓️ Meeting Summary"}
            onSelect={setSelectedNote}
          />
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}
