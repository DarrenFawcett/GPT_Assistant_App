// src/App.tsx
import { useState } from "react";
import gptIconWhite from "./assets/gpt-icon-white.png";
import TopTabs from "./components/TopTabs";
import TabContent from "./components/TabContent";
import SideInfoCard from "./components/SideInfoCard";
import UploadPanel from "./components/UploadPanel";
import { ThemeStyles, GlowStyles } from "./styles/ThemeStyles";
import BottomGlow from "./styles/BottomGlow";
import { motion } from "framer-motion";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "calendar" | "todo" | "notes" | "email">("chat");

  return (
    <div className="theme-ai-dark">
      {/* Inject global theme + glow styles */}
      <ThemeStyles />
      <GlowStyles />

      <div
        className="relative min-h-screen w-full p-4 md:p-8"
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
          <div className="w-full px-4 mb-6">
            <TopTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Grid Layout */}
          <TabContent activeTab={activeTab} />

        </div>
      </div>
    </div>
  );
}
