import {
  MessageSquare,
  CalendarDays,
  ListTodo,
  NotebookText,
  Mail,
  ReceiptText, // 🧾 Tax Claim icon
} from "lucide-react";
import React from "react";

export type TabType = "chat" | "calendar" | "todo" | "ideas" | "email" | "taxclaim";

const tabOptions: { name: string; key: TabType; icon: React.ReactNode }[] = [
  { name: "Chat", key: "chat", icon: <MessageSquare className="w-4 h-4" /> },
  { name: "Calendar", key: "calendar", icon: <CalendarDays className="w-4 h-4" /> },
  { name: "To-Do", key: "todo", icon: <ListTodo className="w-4 h-4" /> },
  { name: "Ideas", key: "ideas", icon: <NotebookText className="w-4 h-4" /> },
  { name: "Email", key: "email", icon: <Mail className="w-4 h-4" /> },
  { name: "Tax Claim", key: "taxclaim", icon: <ReceiptText className="w-4 h-4" /> },
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
      className="flex flex-wrap justify-center gap-3 mt-2 mb-3 sm:flex-nowrap sm:gap-4"
    >
      {tabOptions.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          className={`relative px-3 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200
            ${
              activeTab === tab.key
                ? "text-cyan-400"
                : "text-gray-400 hover:text-gray-200"
            }
          `}
        >
          {tab.icon}
          <span>{tab.name}</span>

          {/* Underline indicator */}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-400 rounded-full transition-all duration-300"></span>
          )}
        </button>
      ))}
    </div>
  );
}
