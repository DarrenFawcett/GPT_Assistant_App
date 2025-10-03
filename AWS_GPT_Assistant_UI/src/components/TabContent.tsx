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
        <div className=" rounded-xl overflow-hidden h-full p-4">
          <ChatPanel />
        </div>
      );
    case "calendar":
      return (
        <div className=" rounded-xl overflow-hidden h-full p-4">
          <CalendarPanel />
        </div>
      );
    case "todo":
      return (
        <div className="rounded-xl overflow-hidden h-full p-4">
          <TodoPanel />
        </div>
      );
    case "notes":
      return (
        <div className=" rounded-xl overflow-hidden h-full p-4">
          <NotesPanel />
        </div>
      );
    case "email":
      return (
        <div className=" rounded-xl overflow-hidden h-full p-4">
          <EmailPanel />
        </div>
      );
    default:
      return (
        <div className=" rounded-xl overflow-hidden h-full p-4">
          {/* fallback if needed */}
        </div>
      );
  }
}
