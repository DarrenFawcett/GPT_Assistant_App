import { useState, useRef } from "react";
import { uploadToS3 } from "../utils/uploadToS3";

export function useTempUpload(folderType: "documents" | "receipts") {
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

  // 🧠 Upload with auto metadata
  const uploadFileWithMetadata = async (file: File) => {
    try {
      console.log("🪄 Uploading to S3:", file.name);
      const result = await uploadToS3(file, "df_001", folderType, "manual upload");
      console.log("✅ Upload complete:", result);
    } catch (err) {
      console.error("❌ Upload error:", err);
    }
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
    uploadFileWithMetadata,
    removeTempFile,
    clearTempFiles,
  };
}
