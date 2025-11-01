import { useState } from "react";
import PanelFrame from "../Main_UI/PanelFrame";
import ChatMessages from "../Chat_UI/ChatMessages";
import InputRow from "../Input_Row/InputRow";
import { CALENDAR_URL } from "../../config/api";
import CalendarConfirmPanel from "../Widgets/Calendar_Confirm/CalendarConfirmPanel";


export default function CalendarPanel() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([
    { role: "assistant", text: "📅 Hi! I’m kAI — ready to check or add your calendar events." },
  ]);

  const [isThinking, setIsThinking] = useState(false);
  const [eventPreview, setEventPreview] = useState(null);

  // 🧠 Send text to Calendar Lambda
  const sendText = async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsThinking(true);

    try {
      const res = await fetch(CALENDAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "calendar",
          messages: [
            { role: "user", content: text }
          ]
        }),

      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply || data.message || "Please check the confirm display for your event." },
      ]);
    } catch (err) {
      console.error("Calendar error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error occurred while talking to calendar." },
      ]);
    } finally {
      setIsThinking(false);
    }
  };


  return (
    <PanelFrame
      top={<div className="text-green-400 font-semibold">🗓️ Calendar Panel — Top Header</div>}
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
              onSendText={sendText}
              isBusy={isThinking}
              placeholder="Ask about your schedule or add a new event..."
            />
          </div>
        </div>
      }
      right={
        <div className="flex flex-col gap-4">
          <CalendarConfirmPanel
            isBusy={isThinking}
            // event={{
            //   date: "7th September 2026",
            //   summary: "Car MOT due on 31 October",
            // }}
            onConfirm={(date, message) => {
              sendText(`Add event on ${date}: ${message}`);
            }}
          />
        </div>
      }


    />
  );
}
