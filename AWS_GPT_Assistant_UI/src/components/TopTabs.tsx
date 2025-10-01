import {
  MessageSquare,
  CalendarDays,
  ListTodo,
  NotebookText,
  Mail,
} from "lucide-react";
import React from "react";

export type TabType = "chat" | "calendar" | "todo" | "notes" | "email";

const tabOptions: { name: string; key: TabType; icon: React.ReactNode }[] = [
  { name: "Chat", key: "chat", icon: <MessageSquare className="w-4 h-4" /> },
  { name: "Calendar", key: "calendar", icon: <CalendarDays className="w-4 h-4" /> },
  { name: "To-Do", key: "todo", icon: <ListTodo className="w-4 h-4" /> },
  { name: "Notes", key: "notes", icon: <NotebookText className="w-4 h-4" /> },
  { name: "Email", key: "email", icon: <Mail className="w-4 h-4" /> },
];

export default function TopTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: TabType;
  setActiveTab: React.Dispatch<React.SetStateAction<TabType>>;
}) {
  return (
    <div
      className="
        flex flex-wrap justify-center gap-2 mt-2 mb-4
        sm:flex-nowrap sm:gap-3
      "
    >
      {tabOptions.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 sm:gap-2
            ${activeTab === tab.key
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              : "text-gray-300 hover:bg-[#1d2330]"
            }
          `}
        >
          {tab.icon}
          <span>{tab.name}</span>
        </button>
      ))}
    </div>
  );
}
