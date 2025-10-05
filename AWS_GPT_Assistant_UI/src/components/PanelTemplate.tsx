import React, { ReactNode, useState, useEffect } from "react";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
}


// ---------------------------
// 🎛️ Height Config — tweak once, use everywhere
// ---------------------------
const HEIGHT_LEFT_DESKTOP = "48vh";         // 🖥️ desktop left panel height
const HEIGHT_RIGHT_DESKTOP = "63.5vh";      // 🖥️ desktop right panel height
const HEIGHT_LEFT_MOBILE = "36vh";          // 📱 mobile left panel height
const HEIGHT_MIN_RIGHT_MOBILE = "25vh";     // 📱 mobile min height
const HEIGHT_MAX_RIGHT_MOBILE = "40vh";     // 📱 mobile max height

// ---------------------------
// ✅ Reusable EventCard
// ---------------------------
export function EventCard({
  title,
  time,
  status,
  onSelect,
  isSelected,
}: {
  title: string;
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
        onClick={() => onSelect?.(title)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition
          ${
            isSelected
              ? "bg-sky-500 border border-sky-500 text-white"
              : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
          }`}
      />
    </div>
  );
}

// ---------------------------
// ✅ Panel Template Wrapper
// ---------------------------
interface PanelTemplateProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  rightColumn?: ReactNode;
  actions?: ReactNode;
  topExtra?: ReactNode;
}

export default function PanelTemplate({
  title,
  subtitle,
  children,
  rightColumn,
  actions,
  topExtra,
}: PanelTemplateProps) {
  const isMobile = useIsMobile();

  return (
    <div className="px-2  sm:py-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

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

          {actions && <div className="flex gap-4 px-4 justify-center">{actions}</div>}

          {/* Main Panel */}
          <div
            className="ai-glow-card rounded-2xl flex flex-col justify-between relative overflow-hidden"
            style={{
              background: "var(--surface-2)",
              color: "var(--ink)",
              minHeight: "300px",
              height: isMobile ? HEIGHT_LEFT_MOBILE : HEIGHT_LEFT_DESKTOP,
              padding: isMobile ? "10px 10px 0px" : "10px 10px 0px",
            }}
          >
            {/* Scrollable messages */}
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

            {/* Input row fixed bottom */}
            <div style={{ marginTop: "0.25rem" }}>
              {Array.isArray(children) ? children[children.length - 1] : null}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        {rightColumn && (
        <div
          className="ai-glow-card rounded-2xl p-2 flex flex-col justify-between"
          style={{
            background: "var(--surface-2)",
            color: "var(--ink)",
            minHeight: isMobile ? HEIGHT_MIN_RIGHT_MOBILE : HEIGHT_RIGHT_DESKTOP,
            maxHeight: isMobile ? HEIGHT_MAX_RIGHT_MOBILE : HEIGHT_RIGHT_DESKTOP,
            height: "auto", // ✅ let it grow until maxHeight
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
