// src/components/UploadPanel.tsx
import { UploadCloud, ImageIcon, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRef } from "react";

type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: "queued" | "uploading" | "uploaded" | "error";
};

type Props = {
  uploads?: UploadItem[];
  isUploading?: boolean;
  handleFiles?: (files: FileList | null) => void;
};

export default function UploadPanel({
  uploads = [],
  isUploading = false,
  handleFiles = () => {},
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="ai-glow-card p-4"
    >
      {/* Title */}
      <div className="flex items-center gap-2 mb-3">
        <UploadCloud className="w-5 h-5" />
        <div className="font-medium">S3 Photo Bucket</div>
      </div>

      {/* Desktop drag-drop zone */}
      <div
        className="hidden md:grid ai-dash rounded-xl h-40 cursor-pointer place-items-center mb-3"
        onClick={openFilePicker}
        title="Drag & drop or click"
      >
        {isUploading ? (
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            Uploading…
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-2"
            style={{ color: "var(--muted)" }}
          >
            <ImageIcon className="w-6 h-6" />
            <div className="text-sm">Drag & drop images here</div>
            <div className="text-xs">or click to select</div>
          </div>
        )}
      </div>

      {/* Mobile button */}
      <div className="flex md:hidden mb-3">
        <button
          className="w-full rounded-xl py-3 text-sm flex items-center justify-center gap-2"
          onClick={openFilePicker}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--edge)",
          }}
        >
          <UploadCloud className="w-4 h-4" /> Choose image(s)
        </button>
      </div>

      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Upload list */}
      <div className="mt-4 space-y-2 max-h-40 overflow-auto pr-1">
        {uploads.length === 0 ? (
          <div className="text-xs" style={{ color: "var(--muted)" }}>
            No uploads yet.
          </div>
        ) : (
          uploads.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 text-xs rounded-lg px-2 py-2"
              style={{ background: "rgba(0,0,0,.25)" }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <div className="truncate">{u.name}</div>
              <div className="ml-auto" style={{ color: "var(--muted)" }}>
                {Math.ceil(u.size / 1024)} KB
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
