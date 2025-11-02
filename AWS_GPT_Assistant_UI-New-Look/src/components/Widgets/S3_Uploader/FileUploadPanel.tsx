import { useRef, useState } from "react";
import { X, UploadCloud } from "lucide-react";

function UploadDots({ color = "#10B981" }) {
  const dotStyle: React.CSSProperties = {
    width: "6px",
    height: "6px",
    borderRadius: "9999px",
    backgroundColor: color,
  };

  return (
    <div className="flex items-center justify-center space-x-1 mt-2">
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            ...dotStyle,
            animation: "upload-pulse 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.15}s`,
            opacity: 0.6,
          }}
        />
      ))}
      <style>{`
        @keyframes upload-pulse {
          0% { transform: scale(0.7); opacity: 0.4; }
          25% { transform: scale(1.1); opacity: 1; }
          50% { transform: scale(0.8); opacity: 0.6; }
          75% { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(0.7); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

interface UploadPanelProps {
  type?: "files" | "receipts";
  files: any[];
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
  thinking?: boolean;
}

export default function FileUploadPanel({
  type = "files",
  files,
  setFiles,
  thinking = false,
}: UploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const config = {
    files: { label: "Upload Documents", color: "#10B981", tab: "chat" },
    receipts: { label: "Upload Receipts", color: "#F59E0B", tab: "claimtax" },
  }[type];

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const user = "df_001";
    const arr = Array.from(newFiles);
    const stagedFiles = arr.map((file) => {
      const now = new Date().toISOString();
      const uploadId = `${user}_${now.replace(/[:.]/g, "-")}_${file.name}`;
      return {
        file,
        meta: {
          user,
          tab: config.tab,
          upload_id: uploadId,
          original_name: file.name,
          timestamp: now,
          message: "Pending upload – will send on message send",
        },
        tags: { Status: "pending", GPT_Tags: "-", Tab: config.tab },
      };
    });
    setFiles((prev) => [...prev, ...stagedFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (name: string) =>
    setFiles((prev) => prev.filter((f) => f.file.name !== name));

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`rounded-2xl w-full overflow-hidden transition-all duration-300 ${
        isDragging ? "shadow-[0_0_25px_rgba(16,185,129,0.6)] scale-[1.02]" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      style={{
        background: "linear-gradient(180deg, var(--surface-1), var(--surface-2))",
        border: `1px solid ${config.color}40`,
        boxShadow: files.length
          ? `0 0 12px ${config.color}60`
          : `0 0 5px ${config.color}25`,
      }}
    >
      <div
        className="h-[4px]"
        style={{ background: `linear-gradient(90deg, ${config.color}, #34D399)` }}
      />

      <div
        className="p-4 flex flex-col items-center gap-1 cursor-pointer hover:bg-[rgba(255,255,255,0.02)] transition-all duration-200"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          id={`fileInput-${type}`}
          type="file"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {/* Upload icon + label inline */}
        <div className="flex items-center gap-3 text-center select-none">
          <UploadCloud color={config.color} size={28} strokeWidth={1.8} />
          <span
            className="font-semibold text-base tracking-wide"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>


        {/* Drop hint */}
        <p className="text-xs text-slate-400 italic">
          Drag & drop or click to browse
        </p>

        {/* Thinking or file list */}
        {thinking ? (
          <div className="mt-3 flex justify-center min-h-[32px]">
            <UploadDots color={config.color} />
          </div>
        ) : files.length > 0 ? (
          <div className="flex flex-col w-full max-w-[320px] text-sm gap-1 mt-3">
            {files.map((entry) => (
              <div
                key={entry.meta.upload_id}
                className="flex flex-col bg-[rgba(255,255,255,0.05)] border rounded-md px-2 py-[4px]"
                style={{ borderColor: `${config.color}40` }}
              >
                <div className="flex justify-between items-center">
                  <span className="truncate text-xs" style={{ color: config.color }}>
                    {entry.file.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(entry.file.name);
                    }}
                    className="hover:text-red-400 transition-colors"
                    style={{ color: config.color }}
                  >
                    <X size={12} />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-[2px]">
                  ID: {entry.meta.upload_id}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-[24px]" />
        )}
      </div>
    </div>
  );
}
