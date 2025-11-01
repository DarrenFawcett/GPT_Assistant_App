import { useState } from "react";
import PanelFrame from "../Main_UI/PanelFrame";
import ChatMessages from "../Chat_UI/ChatMessages";
import InputRow from "../Input_Row/InputRow";
import UploadPanel from "../Widgets/S3_Uploader/FileUploadPanel"; // ✅ same component

export default function TaxClaimPanel() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    {
      role: "assistant",
      text: "🧾 Hi! I’m kAI — here to help you upload and track receipts for your tax claims.",
    },
  ]);

  const [isThinking, setIsThinking] = useState(false);

  // 🧠 Handles sending a message (later you can tie to your tax Lambda)
  const sendText = async (text: string) => {
    setMessages((p) => [...p, { role: "user", text }]);
    setIsThinking(true);

    try {
      // placeholder for now — in future: TAX_LAMBDA_URL
      setMessages((p) => [
        ...p,
        { role: "assistant", text: `📊 Noted! "${text}" will be processed soon.` },
      ]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: "assistant", text: "⚠️ Error processing your tax data." },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <PanelFrame
      top={
        <div className="text-amber-400 font-semibold">
          💼 Tax Claim — Upload Receipts & Track Deductions
        </div>
      }
      left={
        <div className="flex flex-col h-full">
          {/* 💬 Message area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <ChatMessages messages={messages} isThinking={isThinking} />
          </div>

          {/* ✍️ Input area */}
          <div>
            <InputRow
              onSendText={sendText}
              isBusy={isThinking}
              placeholder='e.g. "Add my tool receipt from today"'
            />
          </div>
        </div>
      }
      right={
        <div className="flex flex-col gap-4">
          {/* 🧾 S3 Upload (Receipts Mode) */}
          <UploadPanel type="receipts" />
        </div>
      }
    />
  );
}
