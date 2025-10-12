export async function uploadDirectToS3(file: File, presignedUrl: string) {
  try {
    const res = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!res.ok) throw new Error("Failed to upload file to S3");

    console.log("✅ Uploaded to:", presignedUrl.split("?")[0]);
    return presignedUrl.split("?")[0]; // clean URL
  } catch (err) {
    console.error("❌ Upload failed:", err);
    throw err;
  }
}
