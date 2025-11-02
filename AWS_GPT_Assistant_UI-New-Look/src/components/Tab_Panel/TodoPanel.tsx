import { useState } from "react";
import PanelFrame from "../Main_UI/PanelFrame";
import ChatMessages from "../Chat_UI/ChatMessages"; // ✅ temporarily reuse message bubbles
import InputRow from "../Input_Row/InputRow";
import { useSmartSend } from "../../hooks/useSmartSend";

export default function TodoPanel() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "📝 Hi! I’m kAI — ready to capture your tasks and ideas." }
  ]);

  const [isThinking, setIsThinking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  // 💬 Send a text to the To-Do Lambda
  const sendText = async (text: string) => {
    setMessages((p) => [...p, { role: "user", text }]);
    setIsThinking(true);
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE + "/todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", text: data.reply || "🤔 No response from To-Do Lambda." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "⚠️ Error contacting To-Do Lambda." }]);
    } finally {
      setIsThinking(false);
    }
  };

  // ⚙️ Smart send hook handles uploads and status toggles
  const handleSend = useSmartSend({
    tab: "todo",
    user: "df_001",
    files,
    setFiles,
    setMessages,
    sendText,
    setIsUploading,
  });

  return (
    <PanelFrame
      top={<div className="text-sky-400 font-semibold">🧩 To-Do Panel (Stable Build)</div>}
      left={
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages messages={messages} isThinking={isThinking} />
          </div>

          <div>
            <InputRow
              onSendText={handleSend}
              isBusy={isThinking || isUploading}
              placeholder="Add a new task or idea..."
            />
          </div>
        </div>
      }
      right={
        <div className="flex items-center justify-center h-full text-gray-400 italic border border-sky-800/40 rounded-2xl p-4">
          💡 Right panel reserved for linked To-Do + Ideas view
        </div>
      }
    />
  );
}
