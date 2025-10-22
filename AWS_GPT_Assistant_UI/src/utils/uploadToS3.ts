// src/utils/uploadToS3.ts
export async function uploadToS3(file: File, user: string, tab: string, message: string) {
  const now = new Date().toISOString().replace(/[:.]/g, "-");

  // 🧹 Sanitize file name — replace spaces and special chars
  const safeFileName = file.name
    .trim()
    .replace(/\s+/g, "-")       // replace spaces with dashes
    .replace(/[^a-zA-Z0-9.\-_]/g, ""); // remove any weird characters (optional)

  // 🧩 Use clean name in the upload ID
  const uploadId = `${user}_${now}_${safeFileName}`;
  const folder = tab === "claimtax" ? "receipts" : "documents";
  const key = `user/${user}/uploads/${folder}/${uploadId}`;

  console.log("🧠 Starting basic S3 upload...");
  console.log("🗂️ Upload key:", key);

  // ⚙️ TEMP — hardcode S3 direct path (no presigned URL or Lambda)
  const url = `https://kai-assistant-data-2448.s3.eu-west-2.amazonaws.com/${key}`;
  console.log("🧪 Using direct S3 URL:", url);

  // 🧾 Metadata headers
  const headers: Record<string, string> = {
    "Content-Type": file.type || "application/octet-stream",
    "x-amz-meta-user": user,
    "x-amz-meta-tab": tab,
    "x-amz-meta-message": message,
    "x-amz-meta-upload_id": uploadId,
    "x-amz-meta-original_name": safeFileName,
    "x-amz-meta-timestamp": now,
  };

  // 🧠 Upload the file directly
  console.log("📤 Uploading file to S3 (no API, no confirm)...");
  const res = await fetch(url, { method: "PUT", headers, body: file });

  if (!res.ok) {
    console.error("❌ Upload failed:", res.status, res.statusText);
    throw new Error(`Upload failed: ${res.statusText}`);
  }

  console.log("✅ File uploaded successfully:", key);

  // Return only upload info (no confirm)
  return {
    key,
    upload_id: uploadId,
    status: "uploaded",
    timestamp: now,
    message: "✅ File uploaded successfully to S3 (no confirm call).",
  };
}
