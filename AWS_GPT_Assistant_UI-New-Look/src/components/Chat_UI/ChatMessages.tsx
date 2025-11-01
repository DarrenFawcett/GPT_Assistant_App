import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { TypingDots } from "./TypingDots";


export default function ChatMessages({
  messages = [],
  isThinking = false,
  isUploading = false,     
}: {
  messages: { role: string; text: string }[];
  isThinking?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 👋 Default dummy messages for preview
  const displayMessages =
    messages.length > 0
      ? messages
      : [
          {
            role: "assistant",
            text: "👋 Hi! I’m kAI — here to help you chat, plan, and stay organised.",
          },
        ];

  // 🔄 Auto-scroll to bottom when new messages appear
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages, isThinking]);

  return (
    <div
      className="flex flex-col px-4 pt-4 pb-2 overflow-y-auto"
      style={{
        height: "100%",
        scrollbarWidth: "none", // Firefox
        msOverflowStyle: "none", // IE
      }}
    >
      {/* 👇 Hide scrollbar visually (Chrome/Webkit) */}
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      <div className="flex flex-col gap-4">
        {displayMessages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`px-4 py-2 border shadow-[0_3px_12px_rgba(0,0,0,0.35)]
                  transition-all duration-300 break-words
                  ${
                    isUser
                      ? "bg-[rgba(56,189,248,0.15)] text-sky-100 border-sky-600/50 rounded-[18px] rounded-br-none text-right"
                      : "bg-[rgba(255,255,255,0.07)] text-slate-100 border-slate-700/60 rounded-[18px] rounded-bl-none text-left"
                  }`}
                style={{
                  maxWidth: "90%",
                  backdropFilter: "blur(10px) saturate(160%)",
                  WebkitBackdropFilter: "blur(10px) saturate(160%)",
                  lineHeight: "1.55",
                }}
              >
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="px-2">
            <div className="inline-block px-4 py-2 border border-slate-700/50 rounded-[18px] rounded-bl-none bg-[rgba(255,255,255,0.07)] text-slate-300">
              <TypingDots />
            </div>
          </div>
        )}

        {/* 👇 Auto-scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
