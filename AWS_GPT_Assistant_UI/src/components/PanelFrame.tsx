import type { ReactNode } from "react";

interface PanelFrameProps {
  left: ReactNode;   // left side cards
  right: ReactNode;  // right side main panel
}

export default function PanelFrame({ left, right }: PanelFrameProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
      {/* LEFT COLUMN (each card already glows individually) */}
      <div className="md:col-span-1 space-y-4     ">
        {left}
      </div>

      {/* RIGHT COLUMN (glowing chat box) */}
      <div className="md:col-span-2 rounded-2xl p-4"
           style={{ background: "var(--panel)", color: "var(--ink)" }}>
        {right}
      </div>
    </div>
  );
}