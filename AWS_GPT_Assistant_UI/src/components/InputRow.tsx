// src/components/InputRow.tsx
import { SendHorizontal, ImageIcon, Mic } from "lucide-react";

export interface InputRowProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  showUpload?: boolean;
  showMic?: boolean;
  isRecording?: boolean;          // ✅ add this
  recognitionRef?: any;           // ✅ add this
  openFilePicker?: () => void;    // ✅ add this
  buttonLabel?: string;
  helperText?: string;
}


export default function InputRow({
  placeholder = "Type something...",
  value,
  onChange,
  onSubmit,
  showUpload = true,
  showMic = true,
  isRecording,        // ✅ now defined
  recognitionRef,     // ✅ now defined
  openFilePicker,     // optional
  buttonLabel = "Send",
  helperText,
}: InputRowProps) {

  return (
    <div className="p-3 border-t border-slate-700/50">
      <div className="flex items-center gap-2">
        {/* Upload button */}
        {showUpload && (
          <button
            className="hidden md:inline-flex ai-icon-btn px-3 py-2"
            title="Upload attachment"
            onClick={openFilePicker} 
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        {/* Mic button */}
        {showMic && (
          <button
            className={`hidden md:inline-flex ai-icon-btn px-3 py-2 ${isRecording ? "bg-red-500" : ""}`}
            title={isRecording ? "Stop recording" : "Start recording"}
            onClick={() => {

              if (isRecording) {
                recognitionRef?.current?.stop?.();
              } else {
                recognitionRef?.current?.start?.();
              }
            }}

          >
            <Mic className="w-4 h-4" />
          </button>
        )}


        {/* Input field */}
        <input
          className="flex-1 ai-input ai-input-glow px-3 py-2"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />

        {/* Action button */}
        <button
          className="inline-flex items-center gap-1 ai-send px-3 py-2"
          onClick={onSubmit}
        >
          <SendHorizontal className="w-4 h-4" /> {buttonLabel}
        </button>
      </div>

      {/* Optional helper text */}
      {helperText && (
        <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
          {helperText}
        </div>
      )}
    </div>
  );
}
