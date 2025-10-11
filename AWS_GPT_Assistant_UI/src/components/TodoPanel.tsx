// src/components/ToDoPanel.tsx
import { useRef, useState, useEffect } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { TODO_URL } from "../config/api";
import PanelTemplate from "./PanelTemplate";
import ChipRotatorWithButton from "./ChipRotator";

// ✅ Task Card
function TaskCard({
  title,
  due,
  status,
  completed,
  onSelect,
  isSelected,
}: {
  title: string;
  due: string;
  status: string;
  completed?: boolean;
  onSelect?: (taskTitle: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-4 py-3 flex justify-between items-center mb-3 transition duration-300 ${
        completed ? "opacity-60" : "opacity-100"
      }`}
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {/* Task Info */}
      <div className="pl-1">
        <div
          className={`font-semibold ${
            completed ? "line-through text-gray-400" : ""
          }`}
        >
          {title}
        </div>
        <div className="text-xs opacity-70">
          Due: {due} • Status: {status}
        </div>
      </div>

      {/* Circle Select Button */}
      <button
        onClick={() => onSelect?.(title)}
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

// ✅ Message type
interface TodoMessage {
  role: "user" | "assistant";
  text: string;
}

export default function ToDoPanel({
  isRecording,
  recognitionRef,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
}) {
  const [messages, setMessages] = useState<TodoMessage[]>([
    {
      role: "assistant",
      text: "👋 Ready to plan your day? Try things like 'Add buy milk', 'Edit gym time', or 'Complete project report'.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<
    "add" | "edit" | "complete" | "delete"
  >("add");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  const handleSubmit = async () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(TODO_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "To-Do",
          action: activeAction,
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      let replyText = "🤔 No response.";

      if (data.todo_added)
        replyText = `✅ Added: ${data.todo_added.title || text}`;
      else if (data.reply) replyText = data.reply;
      else if (data.tasks?.length)
        replyText = data.tasks.map((t: any) => `📝 ${t}`).join("\n");

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      console.error("❌ To-Do API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to To-Do API" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  // ✅ Toggle complete visual
  const toggleComplete = (title: string) => {
    setCompletedTasks((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  return (
    <PanelTemplate
      topExtra={
        <ChipRotatorWithButton
          header="Tasks:"
          items={[
            { icon: "➕", label: "Add", text: "Finish AWS notes" },
            { icon: "✏️", label: "Edit", text: "Update car insurance" },
            { icon: "✅", label: "Complete", text: "Push GitHub updates" },
            { icon: "🗑️", label: "Delete", text: "Remove old reminders" },
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
            <h2 className="text-lg font-semibold">To-Do List</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            <TaskCard
              title="📌 Finish Portfolio Site"
              due="Tomorrow"
              status="In Progress"
              completed={completedTasks.includes("📌 Finish Portfolio Site")}
              isSelected={selectedTask === "📌 Finish Portfolio Site"}
              onSelect={(t) => {
                if (activeAction === "complete") toggleComplete(t);
                setSelectedTask(t);
              }}
            />
            <TaskCard
              title="🛒 Buy Milk"
              due="Today"
              status="Pending"
              completed={completedTasks.includes("🛒 Buy Milk")}
              isSelected={selectedTask === "🛒 Buy Milk"}
              onSelect={(t) => {
                if (activeAction === "complete") toggleComplete(t);
                setSelectedTask(t);
              }}
            />
            <TaskCard
              title="💪 Gym Session"
              due="Friday"
              status="Planned"
              completed={completedTasks.includes("💪 Gym Session")}
              isSelected={selectedTask === "💪 Gym Session"}
              onSelect={(t) => {
                if (activeAction === "complete") toggleComplete(t);
                setSelectedTask(t);
              }}
            />
          </div>
        </>
      }
    >
      {/* 💬 Chat Area */}
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

      <InputRow
        placeholder={`${
          activeAction === "add"
            ? 'Add task… e.g., "Pay bills Friday"'
            : activeAction === "edit"
            ? 'Edit task… e.g., "Change gym to 6pm"'
            : activeAction === "complete"
            ? 'Mark complete… e.g., "Finish report"'
            : 'Delete task… e.g., "Remove old item"'
        }`}
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
