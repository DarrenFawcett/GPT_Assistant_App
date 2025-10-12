import { useState, useRef } from "react";
import { uploadDirectToS3 } from "../utils/uploadToS3";

export function useTempUpload() {
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🧩 Add file to list (no upload yet)
  const addFile = (file: File) => {
    setTempFiles((prev) => [...prev, file]);
    console.log("📎 File ready for upload:", file.name);
  };

  // 📁 Manual picker
  const handleFilePick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(addFile);
  };

  // 🖱️ Drag/drop logic
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files || []);
    files.forEach(addFile);
  };

  // 🧹 Remove single file
  const removeTempFile = (name: string) => {
    setTempFiles((prev) => prev.filter((f) => f.name !== name));
  };

  // 🧼 Clear after send
  const clearTempFiles = () => {
    setTempFiles([]);
  };

  return {
    tempFiles,
    isDragging,
    fileInputRef,
    handleFilePick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeTempFile,
    clearTempFiles,
  };
}
