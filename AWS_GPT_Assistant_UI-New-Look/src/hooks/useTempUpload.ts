import { useState, useRef } from "react";

export function useTempUpload(tabName: string) {
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 🧠 open file picker manually
  const handleFilePick = () => fileInputRef.current?.click();

  // 📁 handle standard file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setTempFiles(newFiles);
      console.log("📂 Added via picker:", newFiles);
    }
  };

  // 🧲 handle drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setTempFiles(newFiles);
      console.log("📥 Dropped files:", newFiles);
    }
  };

  // 🗑️ remove one file
  const removeTempFile = (index: number) => {
    console.log("🗑️ Removing file at index:", index);
    setTempFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔄 clear all
  const clearTempFiles = () => {
    setTempFiles([]);
    console.log("🧹 Cleared all temp files");
  };

  return {
    tempFiles,
    isDragging,
    handleFilePick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeTempFile,
    clearTempFiles,
    fileInputRef,
  };
}
