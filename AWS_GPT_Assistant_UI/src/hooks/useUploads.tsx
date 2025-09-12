import { useState, useRef, useCallback } from 'react';

export type UploadItem = {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'uploaded' | 'error';
};

export function useUploads(addMessage: (role: 'assistant' | 'user', text: string) => void) {
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setIsUploading(true);

    const items: UploadItem[] = Array.from(files).map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      status: 'uploaded',
    }));

    await new Promise((r) => setTimeout(r, 800));
    setUploads((u) => [...items, ...u]);
    setIsUploading(false);

    addMessage('assistant', `✅ (Mock) ${files.length} file(s) sent to S3 bucket`);
  };

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }, []);

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return {
    uploads,
    isUploading,
    fileInputRef,
    openFilePicker,
    handleFiles,
    onDrop,
    onDragOver,
  };
}
