// src/components/Tab_Panel/ChatPanel.tsx
import { useState } from "react";
import PanelFrame from "../Main_UI/PanelFrame";
import ChatMessages from "../Chat_UI/ChatMessages";
import InputRow from "../Input_Row/InputRow";
import { CHAT_URL } from "../../config/api";
import FileUploadPanel from "../Widgets/S3_Uploader/FileUploadPanel";
import { useSmartSend } from "../../hooks/useSmartSend";

export default function ChatPanel() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "👋 Hi! I’m kAI — here to help you chat, plan, and stay organised." }
  ]);

  const [isThinking, setIsThinking] = useState(false);   // chat-only dots
  const [isUploading, setIsUploading] = useState(false); // upload-only dots
  const [files, setFiles] = useState<File[]>([]);

  const sendText = async (text: string) => {
    setMessages((p) => [...p, { role: "user", text }]);
    setIsThinking(true);
    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", text: data.reply || "🤔 No response." }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", text: "⚠️ Error occurred while chatting." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSend = useSmartSend({
    tab: "chat",
    user: "df_001",
    files,
    setFiles,
    setMessages,
    sendText,
    setIsUploading, // 👈 the hook toggles this true/false around uploads
  });

  return (
    <PanelFrame
      top={<div className="text-sky-400 font-semibold">🔹 PanelFrame Test — Top Full Width</div>}
      left={
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages
              messages={messages}
              isThinking={isThinking}  
            />
          </div>
          <div>
            <InputRow
              onSendText={handleSend}
              isBusy={isThinking || isUploading} 
              placeholder='Add request here...'
            />
          </div>
        </div>
      }
      right={
        <div className="flex flex-col gap-4">
          <FileUploadPanel
            type="files"
            files={files}
            setFiles={setFiles}
            thinking={isUploading}   
          />
        </div>
      }
    />
  );
}
