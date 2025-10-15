import { useRef, useState, useEffect } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { useTempUpload } from "../hooks/useTempUpload";
import { uploadDirectToS3 } from "../utils/uploadToS3";

// Temporary presigned URL generator (until Lambda is live)
async function getPresignedUrl(fileName: string, folderType: string): Promise<string> {
  return `https://kai-assistant-data-2448.s3.eu-west-2.amazonaws.com/user/df_001/uploads/${folderType}/${fileName}`;
}

// ---------------------------
// 📏 Responsive screen size hook
// ---------------------------
function useScreenSize() {
  const [screen, setScreen] = useState<"sm" | "md" | "lg">("lg");

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen("sm");
      else if (w < 1024) setScreen("md");
      else setScreen("lg");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screen;
}

// 🔧 Height presets
const HEIGHTS = {
  sm: { chat: "42vh", upload: "140px" },
  md: { chat: "52vh", upload: "200px" },
  lg: { chat: "63.5vh", upload: "240px" },
};

interface ClaimMessage {
  role: "user" | "assistant";
  text: string;
}

export default function TaxClaimPanel() {
  const [messages, setMessages] = useState<ClaimMessage[]>([
    {
      role: "assistant",
      text: "💼 Welcome to your Tax Claim tab. Upload your receipts or invoices here, and I’ll log them under your tax claim records in S3.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const screen = useScreenSize();
  const h = HEIGHTS[screen];

  // 🔧 useTempUpload now targets the 'receipts' folder
  const {
    tempFiles,
    handleFilePick,
    handleFileChange,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeTempFile,
    clearTempFiles,
    fileInputRef,
    isDragging,
  } = useTempUpload("receipts");

  const handleSend = async () => {
    const text = input.trim();
    const hasFile = tempFiles.length > 0;

    if (!text && !hasFile) return;

    setMessages((prev) => [...prev, { role: "user", text: text || "(file upload)" }]);
    setInput("");
    setIsThinking(true);

    try {
      const uploadedFiles: string[] = [];

      if (hasFile) {
        for (const file of tempFiles) {
          const presignedUrl = await getPresignedUrl(file.name, "receipts");

          // 🔧 Metadata now uses tab: "taxclaim"
          const metadata = {
            user: "df_001",
            tab: "taxclaim",
            message: text || "no message provided",
            timestamp: new Date().toISOString(),
            original_name: file.name,
            upload_id: `df_001_${new Date().toISOString().replace(/[:.]/g, "-")}_${file.name}`,
          };

          console.log("🧾 TaxClaim Metadata:", metadata);

          await uploadDirectToS3(file, presignedUrl, metadata);
          uploadedFiles.push(file.name);
        }

        // 🧠 Confirmation message for tax claim uploads
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "🧾 Receipt uploaded successfully — stored under Tax Claims in S3." },
        ]);
        return;
      }

      // If no file, just store text note as placeholder
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "🗒️ Note added — you can attach receipts later." },
      ]);
    } catch (err) {
      console.error("❌ TaxClaim upload error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error uploading tax document." },
      ]);
    } finally {
      setIsThinking(false);
      clearTempFiles();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2 py-4 h-full">
      {/* Main Panel */}
      <div
        className="order-2 md:order-none md:col-span-2 flex flex-col ai-glow-card rounded-2xl p-2"
        style={{
          color: "var(--ink)",
          background: "var(--surface-2)",
          height: h.chat,
          minHeight: "300px",
        }}
      >
        <div className="flex-1 overflow-auto space-y-3 min-h-0">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
              style={{
                background:
                  m.role === "assistant"
                    ? "var(--chat-assistant)"
                    : "var(--chat-user)",
                color:
                  m.role === "assistant"
                    ? "var(--chat-assistant-ink)"
                    : "var(--chat-user-ink)",
                marginLeft: m.role === "assistant" ? undefined : "auto",
              }}
            >
              {m.text}
            </div>
          ))}

          {isThinking && (
            <div
              className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
              style={{
                background: "var(--chat-assistant)",
                color: "var(--chat-assistant-ink)",
              }}
            >
              <TypingDots />
            </div>
          )}
        </div>

        <div className="mt-4">
          <InputRow
            placeholder="Add a note about this receipt..."
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            showUpload
            openFilePicker={handleFilePick}
            buttonLabel="Save"
          />
        </div>
      </div>

      {/* Upload Panel */}
      <div className="order-1 md:order-none md:col-span-1 flex flex-col gap-4">
        <div
          className="ai-glow-card rounded-2xl p-4"
          style={{ background: "var(--surface-2)", color: "var(--ink)" }}
        >
          <div className="font-semibold mb-2">🧾 Tax Claim Uploads</div>
          <div className="text-sm opacity-80 mb-3 hidden md:block">
            Upload receipts or invoices for your tax records
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition flex flex-col items-center justify-center gap-2
              ${
                isDragging
                  ? "border-sky-400 bg-sky-500/10"
                  : tempFiles.length > 0
                  ? "border-green-400 bg-green-500/5"
                  : "border-[rgba(255,255,255,0.3)] hover:border-sky-400/60"
              }`}
            style={{ minHeight: h.upload }}
          >
            <div className="text-sm hidden md:block">
              Drag & drop receipts here
            </div>
            <button
              onClick={handleFilePick}
              className="px-4 py-1 rounded-lg mb-1"
              style={{ background: "var(--chip)", color: "var(--chip-ink)" }}
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              hidden
              onChange={handleFileChange}
            />
            {tempFiles.length > 0 && (
              <div className="text-xs text-sky-300 mb-2 w-full">
                {tempFiles.map((f) => (
                  <div
                    key={f.name}
                    className="flex justify-between items-center bg-sky-500/10 rounded-md px-2 py-1 mb-1"
                  >
                    <span>📎 {f.name}</span>
                    <button
                      onClick={() => removeTempFile(f.name)}
                      className="text-red-400 hover:text-red-500 ml-2"
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-1 justify-center">
              {[".jpg", ".png", ".pdf", ".docx"].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
