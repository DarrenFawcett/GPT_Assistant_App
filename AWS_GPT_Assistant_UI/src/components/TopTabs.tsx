// TopTabs.tsx
import { useState } from 'react';

const tabs = ['Chat', 'Calendar', 'To‑Do', 'Notes', 'Email'];

export default function TopTabs({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="flex gap-4 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-xl shadow-md text-sm font-medium transition-all duration-200
            ${activeTab === tab
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
              : 'bg-[#151a25] text-gray-300 hover:bg-[#1d2330]'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
