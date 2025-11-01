// src/utils/confirmUpload.ts
export async function confirmUpload(
  user: string,
  uploadId: string,
  tab: string = "documents"
) {
  try {
    console.log("🔍 Starting confirm check...");

    const confirmUrl = `${import.meta.env.VITE_API_BASE}/confirm-upload?user=${encodeURIComponent(
      user
    )}&upload_id=${encodeURIComponent(uploadId)}&tab=${encodeURIComponent(tab)}`;

    console.log("📡 Calling Confirm Lambda:", confirmUrl);

    const res = await fetch(confirmUrl, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Confirm Lambda failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("✅ Confirm Lambda replied:", data);

    return {
      success: true,
      status: data.status || "unknown",
      message: data.message || "✅ Upload confirmed.",
      gpt_title: data.gpt_title || "",
      gpt_summary: data.gpt_summary || "",
      tab,
      upload_id: uploadId,
    };
  } catch (err) {
    console.error("⚠️ Confirm check failed:", err);
    return {
      success: false,
      status: "error",
      message: "⚠️ Failed to confirm upload.",
      error: String(err),
      upload_id: uploadId,
    };
  }
}
