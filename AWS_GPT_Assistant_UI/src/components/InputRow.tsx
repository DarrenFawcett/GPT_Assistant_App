// src/components/InputRow.tsx
import { SendHorizontal, ImageIcon, Mic } from "lucide-react";

export interface InputRowProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  showUpload?: boolean;
  showMic?: boolean;
  isRecording?: boolean;
  recognitionRef?: any;
  openFilePicker?: () => void;
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
  isRecording,
  recognitionRef,
  openFilePicker,
  buttonLabel = "Send",
  helperText,
}: InputRowProps) {
  return (
    <div className="p-1 border-t pt-2 border-slate-700/50 md:mt-12">
      {/* Mobile layout (stacked) */}
      <div className="flex flex-col gap-2 md:hidden">
        {/* Input on top */}
        <input
          className="ai-input ai-input-glow px-3 py-2 w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />

        {/* Buttons row */}
        <div className="px-2 flex items-center justify-between">
          <div className="flex gap-6">
            {showUpload && (
              <button
                className="inline-flex ai-icon-btn px-5 py-2"
                title="Upload attachment"
                onClick={openFilePicker}
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}

            {showMic && (
              <button
                className={`inline-flex ai-icon-btn px-5 py-2 ${isRecording ? "bg-red-500" : ""}`}
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
          </div>

          {/* Send on right */}
          <button
            className="inline-flex items-center gap-1 ai-send px-3 py-2"
            onClick={onSubmit}
          >
            <SendHorizontal className="w-4 h-4" /> {buttonLabel}
          </button>
        </div>
      </div>

      {/* Desktop layout (same as before) */}
      <div className="hidden md:flex items-center gap-2">
        {showUpload && (
          <button
            className="inline-flex ai-icon-btn px-3 py-2"
            title="Upload attachment"
            onClick={openFilePicker}
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        )}

        {showMic && (
          <button
            className={`inline-flex ai-icon-btn px-3 py-2 ${isRecording ? "bg-red-500" : ""}`}
            title={isRecording ? "Stop recording" : "Start recording"}
            onClick={() => {
              if (isRecording) recognitionRef?.current?.stop?.();
              else recognitionRef?.current?.start?.();
            }}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        <input
          className="flex-1 ai-input ai-input-glow px-3 py-2"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
        />

        <button
          className="inline-flex items-center gap-1 ai-send px-3 py-2"
          onClick={onSubmit}
        >
          <SendHorizontal className="w-4 h-4" /> {buttonLabel}
        </button>
      </div>

      {helperText && (
        <div className="mt-2 text-[11px]" style={{ color: "var(--muted)" }}>
          {helperText}
        </div>
      )}
    </div>
  );
}
