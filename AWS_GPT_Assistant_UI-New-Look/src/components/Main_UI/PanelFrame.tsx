import type { ReactNode } from "react";

interface PanelFrameProps {
  top?: ReactNode;   // full-width top bar
  left: ReactNode;   // left column (chat)
  right: ReactNode;  // right column (upload)
}

export default function PanelFrame({ top, left, right }: PanelFrameProps) {
  return (
    <div className="flex flex-col w-full">
      {/* 🟦 Top full-width bar */}
      {top && (
        <div
          className="rounded-2xl p-3 flex items-center justify-between"
          style={{
            background: "var(--panel)",
            color: "var(--ink)",
            minHeight: "75px",
          }}
        >
          {top}
        </div>
      )}

      {/* 🔹 Divider line under top bar */}
      <div className="border-t border-slate-700/80 my-3" />

      {/* 🔸 Fixed-height 50/50 split */}
      <div
        className="flex flex-row overflow-hidden"
        style={{ height: "500px" }}
      >
        {/* LEFT BOX */}
        <div
          className="flex flex-col flex-1 rounded-l-2xl p-2 pb-0 overflow-y-auto custom-scrollbar"
          style={{
            color: "var(--ink)",
            background: "var(--panel)",
          }}
        >
          {left}
        </div>

        {/* Divider between boxes */}
        <div className="w-px bg-slate-700" />

        {/* RIGHT BOX */}
        <div
          className="flex flex-col flex-1 rounded-r-2xl p-4 overflow-y-auto custom-scrollbar"
          style={{
            color: "var(--ink)",
            background: "var(--panel)",
          }}
        >
          {right}
        </div>
      </div>
    </div>
  );
}
