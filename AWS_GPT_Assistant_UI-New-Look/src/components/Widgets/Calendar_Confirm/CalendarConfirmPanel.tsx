import { useState } from "react";

export default function CalendarConfirmPanel({
  event,
  isBusy,
  onConfirm,
}: {
  event?: { date?: string; summary?: string };
  isBusy?: boolean;
  onConfirm?: (date: string, message: string) => void;
}) {
  // ------------------------
  // 🧠 Switch: default vs. preview
  // ------------------------
  if (!event) return <CalendarConfirmPanelDefault />;

  return (
    <div
      className="relative border border-emerald-500/60 rounded-2xl p-6 bg-black/20 text-center
                 shadow-[0_0_12px_rgba(16,185,129,0.3)]
                 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition"
    >
      {/* 🌟 Top Glow Bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl
                      bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90" />

      <p className="text-emerald-400 font-semibold text-lg mb-5 flex items-center justify-center gap-2">
        📅 Add to Calendar
      </p>

      {/* 🗓️ Event Details */}
      <div className="space-y-2 text-gray-300 mb-6">
        <p className="text-base">
          <span className="font-semibold text-white">Date:</span>{" "}
          {event.date || "Unknown"} — All Day
        </p>
        <p className="text-base">
          <span className="font-semibold text-white">Event:</span>{" "}
          {event.summary || "No details"}
        </p>
      </div>

      {/* ✅ Confirm Button */}
      <button
        disabled={isBusy}
        onClick={() => {
          if (onConfirm) onConfirm(event.date || "", event.summary || "");
        }}
        className={`w-full py-2.5 rounded-lg text-white font-semibold 
                    ${isBusy ? "bg-gray-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-400"}
                    transition shadow-md hover:shadow-lg`}
      >
        {isBusy ? "Saving..." : "Confirm"}
      </button>
    </div>
  );
}

// --------------------
// 💤 Default Widget (no event yet)
// --------------------
function CalendarConfirmPanelDefault() {
  return (
    <div
      className="relative border border-emerald-500/40 rounded-2xl p-6 bg-black/20 text-center
                 shadow-[0_0_8px_rgba(16,185,129,0.2)] 
                 hover:shadow-[0_0_14px_rgba(16,185,129,0.4)]"
    >
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl 
                      bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />
      <p className="text-emerald-400 font-semibold text-lg mb-2">📅 Add to Calendar</p>
      <p className="text-gray-400 text-sm mb-4">No event selected yet.</p>
      <button
        onClick={() => {
          const input = document.querySelector('input[type="text"], textarea');
          if (input) (input as HTMLElement).focus();
        }}
        className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
      >
        Ask kAI
      </button>
    </div>
  );
}
