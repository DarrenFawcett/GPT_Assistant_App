import { useRef, useState, useEffect } from 'react';
import { TypingDots } from '../styles/ThemeStyles';
import InputRow from './InputRow';
import { CHAT_URL } from '../config/api';
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
  const [screen, setScreen] = useState<'sm' | 'md' | 'lg'>('lg');

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreen('sm');
      else if (w < 1024) setScreen('md');
      else setScreen('lg');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screen;
}

// Height presets
const HEIGHTS = {
  sm: { chat: '42vh', upload: '140px' },
  md: { chat: '52vh', upload: '200px' },
  lg: { chat: '63.5vh', upload: '240px' },
};

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export default function ChatPanel({
  onSend,
}: {
  onSend?: (val: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: '👋 Hi! I’m kAI — here to help you chat, plan, and stay organised. Ask me anything below, or drop a PDF on the right if you’d like me to save it to S3 for documentation — I’ll file it under whatever you request.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [isRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const screen = useScreenSize();
  const h = HEIGHTS[screen];
  const isLarge = screen === 'lg';

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
    uploadFileWithMetadata,  // 👈 add this line
  } = useTempUpload("documents");




  const handleSend = async () => {
  const text = input.trim();
  const hasFile = tempFiles.length > 0;

  // 🧠 1️⃣ User must enter message or attach file
  if (!text && !hasFile) return;

  setMessages((prev) => [...prev, { role: "user", text: text || "(file upload)" }]);
    setInput("");
    setIsThinking(true);

    try {
      const uploadedFiles: string[] = [];

      // 🗂️ 2️⃣ If a file is attached, handle upload
      if (hasFile) {
        for (const file of tempFiles) {
          const presignedUrl = await getPresignedUrl(file.name, "documents");

          // 🧾 Metadata
          const metadata = {
            user: "df_001",
            tab: "chat",
            message: text || "no message provided",
            timestamp: new Date().toISOString(),
            original_name: file.name,
            upload_id: `df_001_${new Date().toISOString().replace(/[:.]/g, "-")}_${file.name}`,
          };

          console.log("🧩 Metadata being sent:", metadata);

          await uploadDirectToS3(file, presignedUrl, metadata);
          uploadedFiles.push(file.name);
        }

        // ✅ Once upload done, stop here — Chat Lambda not needed
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: "✅ File uploaded successfully to S3 — metadata stored." },
        ]);
        return; // 🔥 skip Chat Lambda entirely
      }

      // 💬 3️⃣ Otherwise — standard chat message flow
      const payload = { tab: "Chat", message: text };
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      const reply = data.reply || "🤔 No clear reply.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error sending message" },
      ]);
    } finally {
      setIsThinking(false);
      clearTempFiles();
    }
  };



  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 px-2 py-4 h-full'>
      {/* Chat Box */}
      <div
        className='order-2 md:order-none md:col-span-2 flex flex-col ai-glow-card rounded-2xl p-2'
        style={{
          color: 'var(--ink)',
          background: 'var(--surface-2)',
          height: h.chat,
          minHeight: '300px',
        }}
      >
        <div className='flex-1 overflow-auto space-y-3 min-h-0'>
          {messages.map((m, idx) => (
            <div
              key={idx}
              className='max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow'
              style={{
                background:
                  m.role === 'assistant'
                    ? 'var(--chat-assistant)'
                    : 'var(--chat-user)',
                color:
                  m.role === 'assistant'
                    ? 'var(--chat-assistant-ink)'
                    : 'var(--chat-user-ink)',
                marginLeft: m.role === 'assistant' ? undefined : 'auto',
              }}
            >
              {m.text}
            </div>
          ))}

          {isThinking && (
            <div
              className='max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow'
              style={{
                background: 'var(--chat-assistant)',
                color: 'var(--chat-assistant-ink)',
              }}
            >
              <TypingDots />
            </div>
          )}
        </div>

        <div className='mt-4'>
          <InputRow
            placeholder='Ask anything… e.g., "Add dentist 9 Dec 3pm"'
            value={input}
            onChange={setInput}
            onSubmit={handleSend}
            showUpload
            showMic
            isRecording={isRecording}
            recognitionRef={recognitionRef}
            openFilePicker={handleFilePick}
            buttonLabel='Send'
          />
        </div>
      </div>

      {/* Right Column */}
      <div className='order-1 md:order-none md:col-span-1 flex flex-col gap-4'>
        {/* Quick Chat */}
        <div
          className='ai-glow-card rounded-2xl p-4'
          style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
        >
          <div className='flex items-center gap-2 mb-2'>
            <span className='text-yellow-400'>💡</span>
            <h3 className='font-semibold'>
              Quick Chat{' '}
              <span className='font-normal opacity-80 text-sm'>
                · Try these
              </span>
            </h3>
          </div>

          <div className='flex flex-wrap gap-2'>
            {[
              'What’s the weather like tomorrow?',
              'Tell me a joke',
              'Add dentist 9 Dec 3pm',
            ].map((t) => (
              <span
                key={t}
                className='px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic'
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Upload Box */}
        <div
          className='ai-glow-card rounded-2xl p-4'
          style={{ background: 'var(--surface-2)', color: 'var(--ink)' }}
        >
          <div className='font-semibold mb-2'>☁️ S3 Upload Bucket</div>
          <div className='text-sm opacity-80 mb-3 hidden md:block'>
            Upload images, PDFs, or docs directly to S3
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
            style={{
              minHeight: h.upload,
            }}
          >

            <div className='text-sm hidden md:block'>
              Drag & drop files here
            </div>
            <button
              onClick={handleFilePick}
              className='px-4 py-1 rounded-lg mb-1'
              style={{ background: 'var(--chip)', color: 'var(--chip-ink)' }}
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*,.pdf,.doc,.docx'
              hidden
              onChange={handleFileChange}
            />
            {tempFiles.length > 0 && (
              <div className='text-xs text-sky-300 mb-2 w-full'>
                {tempFiles.map((f) => (
                  <div
                    key={f.name}
                    className='flex justify-between items-center bg-sky-500/10 rounded-md px-2 py-1 mb-1'
                  >
                    <span>📎 {f.name}</span>
                    <button
                      onClick={() => removeTempFile(f.name)}
                      className='text-red-400 hover:text-red-500 ml-2'
                    >
                      ✖
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className='flex flex-wrap gap-2 mt-1 justify-center'>
              {['.jpg', '.png', '.pdf', '.docx'].map((ext) => (
                <span
                  key={ext}
                  className='px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs'
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>

          <div className='h-[2px] bg-sky-400/40 mt-3 animate-pulse rounded-full md:hidden'></div>
        </div>
      </div>
    </div>
  );
}
