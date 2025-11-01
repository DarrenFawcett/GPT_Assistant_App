import { useState } from "react";
import { SendHorizontal } from "lucide-react";
import MicButton from "./MicButton";

export default function InputRow({
  placeholder = 'Ask anything… e.g. "Add dentist 9 Dec 3 pm"',
  onSendText,
  onUploadFiles,
  isBusy = false,
}: {
  placeholder?: string;
  onSendText?: (text: string) => void;
  onUploadFiles?: (files: File[]) => void;
  isBusy?: boolean;
}) {
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    const text = input.trim();
    if (!text) return;
    onSendText?.(text);
    setInput("");
  };

  return (
    <div
      className="
        flex flex-nowrap items-center gap-2
        p-2 sm:p-3 mt-auto
        bg-[rgba(12,18,30,0.9)]
        border-t border-slate-700/60
        backdrop-blur-sm rounded-b-2xl
        mt-4
      "
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" }}
    >
      {/* 🎙️ Mic */}
      <MicButton
        onTranscript={(spokenText) => setInput((prev) => (prev + spokenText).trim())}
      />


      {/* ✍️ Input field */}
      <div className="flex-1 min-w-[120px]">
        <input
          disabled={isBusy}
          className="
            w-full px-3 sm:px-4 py-[6px] sm:py-[7px]
            rounded-md bg-[rgba(20,26,40,0.8)] text-gray-100
            border border-slate-700/70 focus:border-cyan-400/60
            outline-none transition-all duration-200
          "
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>

      {/* 🚀 Send */}
      <button
        disabled={isBusy}
        className="
          shrink-0 inline-flex items-center gap-2 
          px-2.5 sm:px-3 py-2 
          rounded-md text-white font-medium 
          bg-gradient-to-b from-cyan-500 to-cyan-600
          hover:from-cyan-400 hover:to-cyan-500
          border border-cyan-400/30 active:scale-[0.98]
          transition-all duration-200
        "
        onClick={handleSubmit}
      >
        <SendHorizontal className="w-5 h-4" />
      </button>
    </div>
  );
}
