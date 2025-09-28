// src/components/TopTabs.tsx
import {
  MessageSquare,
  CalendarDays,
  ListTodo,
  NotebookText,
  Mail,
} from 'lucide-react';

const tabOptions = [
  { name: 'Chat', icon: <MessageSquare className="w-4 h-4" /> },
  { name: 'Calendar', icon: <CalendarDays className="w-4 h-4" /> },
  { name: 'To-Do', icon: <ListTodo className="w-4 h-4" /> },
  { name: 'Notes', icon: <NotebookText className="w-4 h-4" /> },
  { name: 'Email', icon: <Mail className="w-4 h-4" /> },
];

export default function TopTabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}) {
  return (
    <div className="flex justify-center gap-3 mt-2 mb-4">
      {tabOptions.map((tab) => {
        const key = tab.name.toLowerCase().replace(/-/g, '');
        return (
          <button
            key={tab.name}
            onClick={() => {
              setActiveTab(key);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === key
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'text-gray-300 hover:bg-[#1d2330]'
            }`}
          >
            {tab.icon}
            <span>{tab.name}</span>
          </button>
        );
      })}
    </div>
  );
}
