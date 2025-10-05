import { useRef, useState, useEffect } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { NOTES_URL } from "../config/api";
import PanelTemplate from "./PanelTemplate";
import ChipRotatorWithButton from "./ChipRotator";

// ✅ Message type
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
      text: "📝 Ready to jot down ideas? Try things like 'Add new note', 'Edit shopping list', or 'Delete old notes'.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeAction, setActiveAction] = useState<"add" | "edit" | "delete">("add");
  const [savedNotes, setSavedNotes] = useState<string[]>([
    "🧠 Study AWS SDK commands",
    "🪶 Write blog draft about AI",
    "🧾 Check grocery list",
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔹 API
  const handleSubmit = async () => {
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
          action: activeAction,
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      let replyText = "🤔 No response.";

      if (data.note_added) replyText = `✅ Added note: ${data.note_added.title || text}`;
      else if (data.reply) replyText = data.reply;
      else if (data.notes?.length)
        replyText = data.notes.map((n: any) => `🗒️ ${n}`).join("\n");

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);

      // 🧷 Simulate note handling for UI demo
      if (activeAction === "add") setSavedNotes((prev) => [...prev, text]);
      else if (activeAction === "delete")
        setSavedNotes((prev) => prev.filter((n) => !n.includes(text)));
      else if (activeAction === "edit")
        setSavedNotes((prev) =>
          prev.map((n) => (n === savedNotes[0] ? text : n))
        );
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

  useEffect(() => setInput(""), [activeAction]);

  return (
    <PanelTemplate
      topExtra={
        <ChipRotatorWithButton
          header="Notes:"
          items={[
            { icon: "➕", label: "Add", text: "Plan weekend ideas" },
            { icon: "✏️", label: "Edit", text: "Update AWS study list" },
            { icon: "✅", label: "Complete", text: "Mark project as done" },
            { icon: "🗑️", label: "Delete", text: "Clear old reminders" },
          ]}
        />
      }
      actions={["add", "edit", "complete", "delete"].map((action) => (
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
          {action === "add"
            ? "➕ Add"
            : action === "edit"
            ? "✏️ Edit"
            : action === "complete"
            ? "✅ Complete"
            : "🗑️ Delete"}
        </button>
      ))}

      rightColumn={
        <>
          <div className="flex justify-center items-center pb-2">
            <h2 className="text-lg font-semibold">Saved Notes</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {savedNotes.map((note, idx) => (
              <div
                key={idx}
                className="rounded-md px-3 py-2 text-sm"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  color: "var(--ink)",
                }}
              >
                {note}
              </div>
            ))}
          </div>
        </>
      }
    >
      {/* 💬 Chat / Notes Feed */}
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

      {/* 🧠 Input Row */}
      <InputRow
        placeholder={
          activeAction === "add"
            ? 'Add note… e.g., "Start blog draft about AI agents"'
            : activeAction === "edit"
            ? 'Edit note… e.g., "Update grocery list"'
            : activeAction === "complete"
            ? 'Complete note… e.g., "Mark project as done"'
            : 'Delete note… e.g., "Remove meeting notes"'
        }
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        showUpload
        showMic
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={() => fileInputRef.current?.click()}
        buttonLabel={activeAction === "add" ? "Add" : "Go"}
      />
    </PanelTemplate>
  );
}
