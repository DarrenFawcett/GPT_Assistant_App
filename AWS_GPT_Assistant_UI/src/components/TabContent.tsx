// src/components/TabContent.tsx
import ChatPanel from "./ChatPanel";
import CalendarPanel from "./CalendarPanel";
import TodoPanel from "./TodoPanel";
import NotesPanel from "./NotesPanel";
import EmailPanel from "./EmailPanel";

type TabType = "chat" | "calendar" | "todo" | "notes" | "email";

export default function TabContent({ activeTab }: { activeTab: TabType }) {
  switch (activeTab) {
    case "chat":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <ChatPanel />
        </div>
      );
    case "calendar":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <CalendarPanel />
        </div>
      );
    case "todo":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <TodoPanel />
        </div>
      );
    case "notes":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <NotesPanel />
        </div>
      );
    case "email":
      return (
        <div className="ai-glow-card rounded-xl overflow-hidden h-full">
          <EmailPanel />
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
