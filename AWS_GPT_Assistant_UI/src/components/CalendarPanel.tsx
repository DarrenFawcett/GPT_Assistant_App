// src/components/CalendarPanel.tsx
import { useRef, useState } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CALENDAR_URL } from "../config/api";

function EventCard({
  title,
  time,
  status,
  onSelect,
  isSelected,
}: {
  title: string;
  time: string;
  status: string;
  onSelect?: (eventTitle: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-4 py-3 flex justify-between items-center mb-3"
      style={{ background: "rgba(255,255,255,0.05)" }}
    >
      {/* Event Info */}
      <div className="pl-1">
        <div className="font-semibold">{title}</div>
        <div className="text-xs opacity-70">
          {time} • Status: {status}
        </div>
      </div>

      {/* Circle Select Button */}
      <button
        onClick={() => onSelect?.(title)}
        className={`w-5 h-5 rounded-full flex items-center justify-center transition
          ${isSelected
            ? "bg-sky-500 border border-sky-500 text-white"
            : "border border-sky-400 text-sky-400 hover:bg-sky-500 hover:text-white"
          }`}
      >
        {isSelected && ""}
      </button>
    </div>
  );
}


interface CalendarMessage {
  role: "user" | "assistant";
  text: string;
}

export default function CalendarPanel({
  isRecording,
  recognitionRef,
}: {
  isRecording?: boolean;
  recognitionRef?: any;
}) {
  const [messages, setMessages] = useState<CalendarMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeAction, setActiveAction] = useState<"add" | "find" | "sum" | null>("add"); 

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const addMessage = async () => {
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setIsThinking(true);

    try {
      const res = await fetch(CALENDAR_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: "Calendar",
          messages: [{ role: "user", content: text }],
        }),
      });

      const data = await res.json();
      let replyText: string;

      if (data.calendar_added) {
        const card = Array.isArray(data.calendar_added)
          ? data.calendar_added[0]
          : data.calendar_added;
        replyText = `✅ ${card.title} — ${card.subtitle}`;
      } else if (data.reply) {
        replyText = data.reply;
      } else if (data.event) {
        const ev = data.event;
        replyText = `📅 ${ev.summary} — ${formatDate(
          ev.start?.dateTime || ev.start?.date
        )}`;
      } else if (data.events?.length) {
        replyText = data.events
          .map(
            (ev: any) =>
              `📅 ${ev.summary} — ${formatDate(
                ev.start?.dateTime || ev.start?.date
              )}`
          )
          .join("\n");
      } else if (data.error) {
        replyText = `⚠️ ${data.error}`;
      } else {
        replyText = "🤔 I couldn’t find any events that match.";
      }

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (err) {
      console.error("❌ Calendar API error:", err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "⚠️ Error talking to Calendar API" },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMessages((prev) => [
        ...prev,
        { role: "user", text: `📷 Uploaded: ${file.name}` },
      ]);
    }
  };

  return (
    <div className="px-2 py-4 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* LEFT COLUMN (Help + Chat) */}
        <div className="flex flex-col gap-2 justify-between">

          {/* Calendar Help */}
          <div className="ai-glow-card rounded-2xl p-4"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            
            {/* Header with icon + title + subtitle */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sky-400 text-lg">📅</span>
              <h3 className="font-semibold">
                Calendar Help <span className="font-normal opacity-80 text-sm">· Add / Edit / Delete</span>
              </h3>
            </div>

            {/* Example chips */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Holiday 24 Dec - 1 Jan
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Meet John tomorrow 10am
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 text-xs italic">
                Dentist Mon 9 Dec 3pm
              </span>
            </div>
          </div>

        {/* Action buttons */}
        <div className="flex gap-8">
          <button
            onClick={() => setActiveAction("add")}
            className={`ml-4 flex-1 text-center px-1  rounded-full py-1 flex items-center justify-center gap-1 transition
              ${activeAction === "add"
                ? "border-2 border-sky-400 text-sky-300"
                : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
              }`}
          >
            ➕ Add
          </button>

          <button
            onClick={() => setActiveAction("find")}
            className={`flex-1 text-center px-1 rounded-full py-1 flex items-center justify-center gap-1 transition
              ${activeAction === "find"
                ? "border-2 border-sky-400 text-sky-300"
                : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
              }`}
          >
            🔍 Find
          </button>

          <button
            onClick={() => setActiveAction("sum")}
            className={`mr-4 flex-1 text-center px-1 rounded-full py-1 flex items-center justify-center gap-1 transition
              ${activeAction === "sum"
                ? "border-2 border-sky-400 text-sky-300"
                : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
              }`}
          >
            ∑ Sum
          </button>
        </div>



          {/* Chat box */}
          <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[282px]"
            style={{ background: "var(--surface-2)", color: "var(--ink)" }}>
            
            {/* Scrollable history */}
            <div className="flex-1 overflow-auto space-y-3 min-h-0">
              {messages.map((m, idx) => (
                <div key={idx}
                  className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
                  style={{
                    background: m.role === "assistant" ? "var(--chat-assistant)" : "var(--chat-user)",
                    color: m.role === "assistant" ? "var(--chat-assistant-ink)" : "var(--chat-user-ink)",
                    marginLeft: m.role === "assistant" ? undefined : "auto",
                  }}>
                  {m.text}
                </div>
              ))}
              {isThinking && (
                <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
                  style={{ background: "var(--chat-assistant)", color: "var(--chat-assistant-ink)" }}>
                  <TypingDots />
                </div>
              )}
            </div>

            <InputRow
              placeholder='Add event… e.g., "Meeting with John tomorrow at 10am"'
              value={input}
              onChange={setInput}
              onSubmit={addMessage}
              showUpload
              showMic
              isRecording={isRecording}
              recognitionRef={recognitionRef}
              openFilePicker={() => fileInputRef.current?.click()}
              buttonLabel="Add"
            />
          </div>
        </div>

        {/* RIGHT COLUMN (Event List) */}
        <div className="ai-glow-card rounded-2xl p-2 flex flex-col flex-1 min-h-[425px]">
          <div className="flex pt-1 justify-center items-center">
            <h2 className="text-lg font-semibold pb-2">Upcoming Events</h2>
          </div>

          {/* Example Events */}
          <EventCard
            title="🦷 Dentist Appointment"
            time="Mon 9 Dec, 3:00–3:30pm"
            status="Confirmed"
            isSelected={selectedEvent === "🦷 Dentist Appointment"}
            onSelect={setSelectedEvent}
          />

          <EventCard
            title="📞 Call with John"
            time="Tue 10 Dec, 11:00am"
            status="Tentative"
            isSelected={selectedEvent === "📞 Call with John"}
            onSelect={setSelectedEvent}
          />
        </div>
      </div>
    </div>
  );
}