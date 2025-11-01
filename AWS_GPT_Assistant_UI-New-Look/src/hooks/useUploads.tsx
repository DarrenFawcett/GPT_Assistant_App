// src/hooks/useUploads.ts
import { useState } from "react";
import { uploadToS3 } from "../utils/uploadToS3";

export function useUploads(user: string, tab: string) {
  const [uploads, setUploads] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;

    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const message = `Upload from ${tab}`;
        const result = await uploadToS3(file, user, tab, message);

        setUploads((prev) => [
          ...prev,
          { id: result.upload_id, name: file.name, size: file.size, status: "uploaded" },
        ]);
      } catch (err) {
        console.error("❌ Upload failed:", err);
        setUploads((prev) => [
          ...prev,
          { id: file.name, name: file.name, size: file.size, status: "error" },
        ]);
      }
    }

    setIsUploading(false);
  }

  return { uploads, isUploading, handleFiles };
}
