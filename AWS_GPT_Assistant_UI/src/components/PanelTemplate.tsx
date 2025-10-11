import React, { useState, useEffect } from "react";

// ---------------------------
// 📏 Responsive width detection
// ---------------------------
function useScreenSize() {
  const [screen, setScreen] = useState<"sm" | "md" | "lg">("lg");

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("sm");
      else if (w < 1024) setScreen("md");
      else setScreen("lg");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screen;
}

// ---------------------------
// 🎛️ Height presets (vh = viewport height)
// ---------------------------
const HEIGHTS = {
  sm: { left: "36vh", right: "36vh" },   // 📱 Mobile
  md: { left: "45vh", right: "45vh" },   // 💻 Tablet
  lg: { left: "48vh", right: "63vh" },   // 🖥️ Desktop
};

// ---------------------------
// ✅ EventCard reusable component
// ---------------------------
export function EventCard({
  title,
  time,
  status,
  onSelect,
  isSelected,
}: {
  title?: string;
  time: string;
  status: string;
  onSelect?: (eventTitle: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      <div className="pl-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs opacity-70">
          {time} • Status: {status}
        </div>
      </div>

      <button
        onClick={() => title && onSelect?.(title)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition ${
          isSelected
            ? "bg-sky-500 border border-sky-500 text-white"
            : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
        }`}
      />
    </div>
  );
}

// ---------------------------
// ✅ Panel Template
// ---------------------------
interface PanelTemplateProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  rightColumn?: React.ReactNode;
  actions?: React.ReactNode;
  topExtra?: React.ReactNode;
}

export default function PanelTemplate({
  title = "",
  subtitle,
  children,
  rightColumn,
  actions,
  topExtra,
}: PanelTemplateProps) {
  const screen = useScreenSize();
  const h = HEIGHTS[screen];

  return (
    <div className="px-2 sm:py-4 h-full">
      <div
        className={`grid gap-4 items-start ${
          screen === "lg" || screen === "md"
            ? "grid-cols-2"
            : "grid-cols-1"
        }`}
      >
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-2 relative pt-2 sm:pt-0">
          {/* Header */}
          <div
            className="ai-glow-card rounded-2xl p-4"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">
                {title}
                {subtitle && (
                  <span className="font-normal opacity-80 text-sm px-6">
                    {subtitle}
                  </span>
                )}
              </h3>
            </div>
            {topExtra}
          </div>

          {actions && (
            <div className="flex gap-4 px-4 justify-center">{actions}</div>
          )}

          {/* Main Panel */}
          <div
            className="ai-glow-card rounded-2xl flex flex-col justify-between relative overflow-hidden"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink)",
              height: h.left,
              padding: "10px 10px 0px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{
                scrollBehavior: "smooth",
                paddingBottom: "0.5rem",
                paddingTop: "0.25rem",
              }}
            >
              {Array.isArray(children) ? children.slice(0, -1) : children}
            </div>

            {/* Input row or bottom section */}
            <div style={{ marginTop: "0.25rem" }}>
              {Array.isArray(children) ? children[children.length - 1] : null}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        {rightColumn && (
          <div
            className="ai-glow-card rounded-2xl flex flex-col justify-between"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink)",
              height: h.right, // ✅ synced height
              padding: "10px 10px 0px", // ✅ same as left
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {rightColumn}
          </div>
        )}
      </div>
    </div>
  );
}
