import { useState } from "react";
import { uploadToS3 } from "../utils/uploadToS3";
import { confirmUpload } from "../utils/confirmUpload";

export function useS3Uploader(tabName: string) {
  const [isProcessing, setProcessing] = useState(false);

  async function handleS3Upload(file: File, user = "df_001", message = "") {
    setProcessing(true);
    try {
      const { upload_id } = await uploadToS3(file, user, tabName, message);
      await new Promise((res) => setTimeout(res, 2000));

      let confirm = await confirmUpload(user, upload_id, tabName);
      await new Promise((res) => setTimeout(res, 1500)); // allow DynamoDB update
      confirm = await confirmUpload(user, upload_id, tabName);

      return confirm;
    } catch (err) {
      console.error("❌ Upload failed:", err);
      return { status: "error", message: "Upload failed" };
    } finally {
      setProcessing(false);
    }
  }

  return { handleS3Upload, isProcessing };
}
