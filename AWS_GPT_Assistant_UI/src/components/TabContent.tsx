// src/components/TabContent.tsx

import { Calendar, ClipboardList, Notebook, Mail, MessageCircle } from "lucide-react";

type TabType = "chat" | "calendar" | "todo" | "notes" | "email";

interface TabContentProps {
  activeTab: TabType;
}

export default function TabContent({ activeTab }: TabContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "chat":
        return (
          <div className="rounded-xl bg-[#0f1525] text-white p-6 text-xl font-semibold shadow-md">
            Chat
          </div>
        );

      case "calendar":
        return (
          <div className="rounded-xl bg-[#0f1525] text-white p-6 shadow-md">
            <div className="text-lg font-semibold flex items-center mb-2">
              <Calendar className="w-5 h-5 mr-2" />
              Quick Calendar
            </div>
            <p className="text-sm text-gray-300">
              Type a natural sentence in chat like:<br />
              <span className="italic text-white">“Dentist on 9th Dec at 3pm for 30 minutes.”</span>
            </p>
          </div>
        );

      case "todo":
        return (
          <div className="rounded-xl bg-[#0f1525] text-white p-6 shadow-md">
            <div className="text-lg font-semibold flex items-center mb-2">
              <ClipboardList className="w-5 h-5 mr-2" />
              Quick To-Do
            </div>
            <p className="text-sm text-gray-300">
              Add a to-do item by typing something like:<br />
              <span className="italic text-white">“Remind me to water the plants tomorrow.”</span>
            </p>
          </div>
        );

      case "notes":
        return (
          <div className="rounded-xl bg-[#0f1525] text-white p-6 shadow-md">
            <div className="text-lg font-semibold flex items-center mb-2">
              <Notebook className="w-5 h-5 mr-2" />
              Notes
            </div>
            <p className="text-sm text-gray-300">
              Write, review or search your saved thoughts. GPT can help summarize or rewrite.
            </p>
          </div>
        );

      case "email":
        return (
          <div className="rounded-xl bg-[#0f1525] text-white p-6 shadow-md">
            <div className="text-lg font-semibold flex items-center mb-2">
              <Mail className="w-5 h-5 mr-2" />
              Email
            </div>
            <p className="text-sm text-gray-300">
              Send short emails with your voice or message. GPT will format them properly.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="mt-4">{renderContent()}</div>;
}
