import React from "react";

export default function FileDropZone({
  isDragging,
  tempFiles,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFilePick,
  handleFileChange,
  removeTempFile,
  fileInputRef,
  minHeight = "200px",
}: any) {
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-2
        ${
          isDragging
            ? "border-sky-400 bg-sky-500/10"
            : tempFiles.length > 0
            ? "border-green-400 bg-green-500/5"
            : "border-[rgba(255,255,255,0.3)] hover:border-sky-400/60"
        }`}
      style={{ minHeight }}
    >
      <div className="text-sm hidden md:block">Drag & drop files here</div>
      <button
        onClick={handleFilePick}
        className="px-4 py-1 rounded-lg mb-1"
        style={{ background: "var(--chip)", color: "var(--chip-ink)" }}
      >
        Choose File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx"
        hidden
        onChange={handleFileChange}
      />
      {tempFiles.length > 0 && (
        <div className="text-xs text-sky-300 mb-2 w-full">
          {tempFiles.map((f: any) => (
            <div
              key={f.name}
              className="flex justify-between items-center bg-sky-500/10 rounded-md px-2 py-1 mb-1"
            >
              <span>📎 {f.name}</span>
              <button
                onClick={() => removeTempFile(f.name)}
                className="text-red-400 hover:text-red-500 ml-2"
              >
                ✖
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-1 justify-center">
        {[".jpg", ".png", ".pdf", ".docx"].map((ext) => (
          <span
            key={ext}
            className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs"
          >
            {ext}
          </span>
        ))}
      </div>
    </div>
  );
}
