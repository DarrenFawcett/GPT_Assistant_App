// src/App.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import gptIconWhite from "./assets/gpt-icon-white.png";

// 🧱 Main layout components
import TopTabs from "./components/Main_UI/TopTabs";
import TabContent from "./components/Main_UI/TabContent";

// 💅 Styles
import { ThemeStyles, GlowStyles } from "./styles/ThemeStyles";
import BottomGlow from "./styles/BottomGlow";
import "./index.css";
import "./styles/scrollbar-chips.css";


// Debug environment check
console.log("🌍 Current API Base:", import.meta.env.VITE_API_BASE);
console.log("🧪 Environment Mode:", import.meta.env.MODE);

// Test Chat API connection
fetch(`${import.meta.env.VITE_API_BASE}/chat`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "chat",
    messages: [
      { role: "system", content: "You are a test assistant." },
      { role: "user", content: "Hello from dev!" }
    ]
  }),
})
  .then((res) => res.json())
  .then((data) => console.log("🧠 Chat Lambda response:", data))
  .catch((err) => console.error("❌ Chat Lambda error:", err));


// Main Function
export default function App() {
  const [activeTab, setActiveTab] = useState<
    "chat" | "calendar" | "todo" | "notes" | "email"
  >("chat");

  return (
    <div className="theme-ai-dark">
      {/* Inject global theme + glow styles */}
      <ThemeStyles />
      <GlowStyles />

      <div
        className="relative min-h-screen w-full px-3 py-3 sm:px-4 sm:py-0 md:p-8"
        style={{ background: "var(--app)", color: "var(--ink)" }}
      >
        {/* Background bottom glow */}
        <BottomGlow />

        <div className="mx-auto max-w-5xl relative">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-16 h-16 rounded-full flex items-center justify-center ring-2 ai-icon-glow overflow-hidden"
              style={{
                background: "var(--surface-2)",
                boxShadow: `
                  0 0 2px rgba(255, 255, 255, 0.25),
                  0 0 10px rgba(167, 139, 250, 0.35),
                  0 0 30px rgba(139, 92, 246, 0.25)
                `,
                borderColor: "var(--edge)",
              }}
            >
              <img
                src={gptIconWhite}
                alt="GPT Assistant Icon"
                className="w-16 h-16 mt-1 object-cover"
              />
            </motion.div>

            <div>
              <div className="text-xl font-semibold">kAI – Your AI Assistant</div>
              <div className="text-sm" style={{ color: "var(--muted)" }}>
                Chat smarter • Stay organized • Get things done
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="w-full px-4">
            <TopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Tab Panels */}
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
}
