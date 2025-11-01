export async function uploadToS3(
  file: File,
  user: string,
  tab: string,
  message: string,
  meta: Record<string, string> = {},
  tags: Record<string, string> = {}
) {
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const safeFileName = file.name
    ? file.name.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "")
    : "unknown-file";

  const uploadId = `${user}_${now}_${safeFileName}`;
  const folder = tab === "claimtax" ? "receipts" : "documents";
  const key = `user/${user}/uploads/${folder}/${uploadId}`;
  const uploadUrl = `https://kai-assistant-data-2448.s3.eu-west-2.amazonaws.com/${key}`;

  // 👇 Force "Status=not_processed" no matter what was passed in
  const tagString =
    Object.entries({ Status: "not_processed", ...tags })
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v ?? "")}`)
      .join("&");

  // 🧼 Sanitizer for ASCII-safe headers
  const sanitizeHeaderValue = (v: any): string => {
    if (v === undefined || v === null) return "";
    return String(v).replace(/[^\x20-\x7E]/g, "-");
  };

  // ✅ Force message to override whatever was in meta
  const finalMeta = {
    ...meta,
    user,
    tab,
    message,
    upload_id: uploadId,
    original_name: safeFileName,
    timestamp: now,
  };

  const headers: Record<string, string> = {
    "Content-Type": sanitizeHeaderValue(file.type || "application/octet-stream"),
    ...Object.fromEntries(
      Object.entries(finalMeta).map(([k, v]) => [
        `x-amz-meta-${k}`,
        sanitizeHeaderValue(v),
      ])
    ),
  };

  try {
    const res = await fetch(`${uploadUrl}?${tagString}`, {
      method: "PUT",
      headers,
      body: file,
    });

    if (!res.ok) {
      console.error("❌ Upload failed:", res.status, res.statusText);
      throw new Error(`Upload failed: ${res.statusText}`);
    }

    console.log("✅ File uploaded to S3:", key);
    return {
      key,
      upload_id: uploadId,
      folder: "uploads",
      status: "uploaded",
      message: "✅ File uploaded to S3 successfully.",
    };
  } catch (err) {
    console.error("💥 Upload error:", err);
    throw err;
  }
}
