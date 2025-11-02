import { uploadToS3 } from "../utils/uploadToS3";
import { confirmUpload } from "../utils/confirmUpload";

export function useSmartSend({
  tab,
  user,
  files,
  setFiles,
  setMessages,
  sendText,
  setIsUploading,
}) {
  return async (text: string) => {
    try {
      const trimmedText = text.trim();
      const hasFiles = files && files.length > 0;
      if (!trimmedText && !hasFiles) return;

      // ----------------------------
      // 📂 FILE UPLOAD MODE
      // ----------------------------
      if (hasFiles) {
        console.log("📦 Detected files — sending to S3 only.");
        setIsUploading(true);

        setMessages((prev) => [
          ...prev,
          { role: "user", text: trimmedText },
          {
            role: "assistant",
            text: `⏳ Uploading ${
              files.length > 1
                ? `${files.length} file(s)`
                : `"${files[0].file.name}"`
            } to S3...`,
          },
        ]);

        for (const entry of files) {
          try {
            // 🧠 Generate a single, unique ID ONCE here
            const now = new Date().toISOString().replace(/[:.]/g, "-");
            const safeName = entry.file.name
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^a-zA-Z0-9.\-_]/g, "");
            const uploadId = `${user}_${now}_${safeName}`;
            console.log("🪪 Generated uploadId:", uploadId);

            // 🏷️ Store it in the meta so both functions share it
            entry.meta.upload_id = uploadId;

            // 🚀 Upload to S3
            const result = await uploadToS3(
              entry.file,
              entry.meta.user || user,
              entry.meta.tab || tab,
              trimmedText,
              entry.meta,
              entry.tags
            );

            console.log("✅ Upload complete:", result.key);

            // ⏱ Small delay before confirm (S3 metadata settle)
            await new Promise((r) => setTimeout(r, 3000));

            // 📡 Confirm with the exact same uploadId
            const confirm = await confirmUpload(
              entry.meta.user || user,
              uploadId, // ← SAME ONE
              entry.meta.tab || tab
            );

            console.log("📬 Confirm Lambda replied:", confirm);

            // 💬 Show Lambda message and S3 link in chat
            setMessages((p) => [
              ...p,
              {
                role: "assistant",
                text: `✅ ${confirm.message}${
                  confirm?.s3_link
                    ? `\n📎 [View uploaded file](${confirm.s3_link})`
                    : ""
                }`,
              },
            ]);
          } catch (err) {
            console.error("❌ Upload or confirm failed:", err);
            setMessages((p) => [
              ...p,
              {
                role: "assistant",
                text: `❌ Upload failed for ${entry.file.name}`,
              },
            ]);
          }
        }

        setFiles([]);
        setIsUploading(false);
        return;
      }

      // ----------------------------
      // 💬 TEXT MESSAGE MODE
      // ----------------------------
      await sendText(trimmedText);
    } catch (err) {
      console.error("💥 SmartSend error:", err);
      setMessages((p) => [
        ...p,
        { role: "assistant", text: "⚠️ Something went wrong while sending." },
      ]);
      setIsUploading(false);
    }
  };
}
