import { useState, useRef } from "react";
import { uploadDirectToS3 } from "../utils/uploadToS3";

export function useTempUpload(folderType: "documents" | "receipts") {
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder structure for the uploads
  const folderPath = `user/df_001/uploads/${folderType}/`;

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

  // 🧠 Upload with auto metadata + unique ID
  const uploadFileWithMetadata = async (file: File) => {
    // Generate a unique ID (user + timestamp + cleaned filename)
    const uploadId = `df_001_${new Date().toISOString().replace(/[:.]/g, "-")}_${file.name.replace(/\s+/g, "_")}`;

    // Build presigned URL manually for now
    const presignedUrl = `https://kai-assistant-data-2448.s3.eu-west-2.amazonaws.com/${folderPath}${file.name}`;

    // Add metadata headers
    const metadata = {
      "x-amz-meta-user": "df_001",
      "x-amz-meta-tab": folderType === "documents" ? "chat" : "claims",
      "x-amz-meta-upload-id": uploadId,
      "x-amz-meta-timestamp": new Date().toISOString(),
      "x-amz-meta-original-name": file.name,
    };

    console.log("🪄 Uploading to S3:", uploadId);
    await uploadDirectToS3(file, presignedUrl, metadata);
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
    uploadFileWithMetadata, // ✅ New helper for upload
    removeTempFile,
    clearTempFiles,
  };
}
