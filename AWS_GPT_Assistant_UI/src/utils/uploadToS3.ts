// src/utils/uploadToS3.ts
export async function uploadDirectToS3(
  file: File,
  presignedUrl: string,
  metadata: Record<string, string> = {}
) {
  const headers: Record<string, string> = {
    "Content-Type": file.type || "application/octet-stream",
  };

  // Add custom metadata headers
  for (const [key, value] of Object.entries(metadata)) {
    headers[`x-amz-meta-${key}`] = value;
  }

  console.log("🚀 Uploading to S3:", presignedUrl);
  console.log("🧾 Metadata:", headers);

  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers,
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file to S3: ${res.status} ${res.statusText}`);
  }

  console.log("✅ Upload successful:", file.name);
}
