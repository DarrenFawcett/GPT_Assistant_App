import { useState } from "react";
import ChatPanel from "./ChatPanel";
import CalendarPanel from "./CalendarPanel";
import TodoPanel from "./TodoPanel";
import NotesPanel from "./NotesPanel";
import EmailPanel from "./EmailPanel";

type TabType = "chat" | "calendar" | "todo" | "notes" | "email";

export default function TabContent({ activeTab }: { activeTab: TabType }) {
  // 👇 separate states for each panel
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [calendarMessages, setCalendarMessages] = useState<any[]>([]);
  const [todoMessages, setTodoMessages] = useState<any[]>([]);
  const [notesMessages, setNotesMessages] = useState<any[]>([]);
  const [emailMessages, setEmailMessages] = useState<any[]>([]);

  switch (activeTab) {
    case "chat":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <ChatPanel
            messages={chatMessages}
            setInput={() => {}}
            onSend={(msg) =>
              setChatMessages([
                ...chatMessages,
                { id: Date.now(), role: "user", text: msg },
              ])
            }
          />
        </div>
      );
    case "calendar":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <CalendarPanel
            messages={calendarMessages}
            setInput={() => {}}
            onSend={(msg) =>
              setCalendarMessages([
                ...calendarMessages,
                { id: Date.now(), role: "user", text: msg },
              ])
            }
          />
        </div>
      );
    case "todo":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <TodoPanel
            messages={todoMessages}
            setInput={() => {}}
            onSend={(msg) =>
              setTodoMessages([
                ...todoMessages,
                { id: Date.now(), role: "user", text: msg },
              ])
            }
          />
        </div>
      );
    case "notes":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <NotesPanel
            messages={notesMessages}
            setInput={() => {}}
            onSend={(msg) =>
              setNotesMessages([
                ...notesMessages,
                { id: Date.now(), role: "user", text: msg },
              ])
            }
          />
        </div>
      );
    case "email":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <EmailPanel
            onSend={(msg) => setEmailMessages([...emailMessages, msg])}
          />
        </div>
      );
    default:
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          {/* fallback if needed */}
        </div>
      );
  }
}
