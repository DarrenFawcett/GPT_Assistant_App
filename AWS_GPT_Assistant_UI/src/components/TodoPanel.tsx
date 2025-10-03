import { useRef, useState } from "react";
import InputRow from "./InputRow";
import { TypingDots } from "../styles/ThemeStyles";
import { TODO_URL } from "../config/api";
import { ListTodo } from "lucide-react";

function TaskCard({
  title,
  due,
  status,
  onSelect,
  isSelected,
}: {
  title: string;
  due: string;
  status: string;
  onSelect?: (taskTitle: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {/* Task Info */}
      <div className="pl-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs opacity-70">
          Due: {due} • Status: {status}
        </div>
      </div>

      {/* Circle Select Button */}
      <button
        onClick={() => onSelect?.(title)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition
          ${isSelected
            ? "bg-sky-500 border border-sky-500 text-white"
            : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
          }`}
      >
        {isSelected && ""}
      </button>
    </div>
  );
}

interface TaskMessage {
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
  const [messages, setMessages] = useState<TaskMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [selectedTask, setSelectedTask] = useState<string | null>(null); // <-- holds selected

  const fileInputRef = useRef<HTMLInputElement>(null);

  const addTask = async () => {
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
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();

      const replyText =
        data.reply ||
        (data.tasks?.length
          ? data.tasks.map((t: any) => `✅ ${t}`).join("\n")
          : "⚠️ No reply from server");

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

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `📷 Uploaded: ${file.name}` },
      ]);
    }
  };

  return (
    <div className="px-2 py-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4 jutsify-between">
          {/* To-Do Tips */}
          <div className="ai-glow-card rounded-2xl p-4"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            <div className="flex items-center gap-2 mb-2">
              <ListTodo className="w-5 h-5 text-sky-400" />
              <h3 className="font-semibold">
                To-Do Tips <span className="font-normal opacity-80 text-sm">· Add / Edit / Delete / Complete</span>
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">Add Buy milk</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">Edit Schedule car service</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">Complete the Finish portfolio site</span>
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
              placeholder='Add task… e.g., "Pay bills on Friday"'
              value={input}
              onChange={setInput}
              onSubmit={addTask}
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
            <h2 className="text-lg font-semibold pb-2">To-Do List</h2>
          </div>

          <TaskCard
            title="📌 Finish Portfolio Site"
            due="Tomorrow"
            status="In Progress"
            isSelected={selectedTask === "📌 Finish Portfolio Site"}
            onSelect={(task) => setSelectedTask(task)}
          />

          <TaskCard
            title="🛒 Buy Milk"
            due="Today"
            status="Pending"
            isSelected={selectedTask === "🛒 Buy Milk"}
            onSelect={(task) => setSelectedTask(task)}
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
