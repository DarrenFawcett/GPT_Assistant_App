import { useRef, useState, useEffect } from "react";
import { TypingDots } from "../styles/ThemeStyles";
import InputRow from "./InputRow";
import { CALENDAR_URL } from "../config/api";
import ChipRotatorWithButton from "./ChipRotator";
import PanelTemplate, { EventCard } from "./PanelTemplate";

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
  const [messages, setMessages] = useState<CalendarMessage[]>([
    {
      role: "assistant",
      text: "👋 Hi! I can help you manage your calendar — try something like 'Add dentist on Monday 3pm' or 'What’s on next week?'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<"add" | "find" | "sum">("add");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


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
      let replyText = "🤔 I couldn’t find any events that match.";

      if (data.calendar_added) {
        const card = Array.isArray(data.calendar_added)
          ? data.calendar_added[0]
          : data.calendar_added;
        replyText = `✅ ${card.title} — ${card.subtitle}`;
      } else if (data.reply) replyText = data.reply;
      else if (data.event)
        replyText = `📅 ${data.event.summary} — ${data.event.start?.dateTime || data.event.start?.date}`;
      else if (data.events?.length)
        replyText = data.events
          .map((ev: any) => `📅 ${ev.summary}`)
          .join("\n");

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

  return (
    <PanelTemplate
      topExtra={
        <ChipRotatorWithButton
          header="Calendar:"
          items={[
            { icon: "➕", label: "Add", text: "Dentist Mon 9 Dec 3pm" },
            { icon: "🔍", label: "Find", text: "Meeting with John" },
            { icon: "∑", label: "Sum", text: "Annual Leave" },
          ]}
        />
      }
      actions={["add", "find", "sum"].map((action) => (
        <button
          key={action}
          onClick={() => setActiveAction(action as any)}
          className={`flex-1 text-center px-3 rounded-full flex items-center justify-center gap-1 transition
            ${
              activeAction === action
                ? "border-2 border-sky-400 text-sky-300"
                : "border border-transparent text-gray-300 hover:border-sky-400 hover:text-sky-300"
            }`}
        >
          {action === "add"
            ? "➕ Add"
            : action === "find"
            ? "🔍 Find"
            : "∑ Sum"}
        </button>
      ))}
      rightColumn={
        <>
          <div className="flex justify-center items-center pb-2">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
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
        </>
      }
    >
      {/* Chat area */}
      <div
        className="flex-1 overflow-y-auto space-y-3 custom-scrollbar"
        style={{ scrollBehavior: "smooth" }}
      >
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

        <div ref={bottomRef} />
      </div>

      <InputRow
        placeholder={
          activeAction === "add"
            ? 'Add event… e.g., "Meeting with John tomorrow at 10am"'
            : activeAction === "find"
            ? 'Find event… e.g., "Dentist on Monday"'
            : activeAction === "sum"
            ? 'Check totals… e.g., "Annual leave this year"'
            : "Type your request..."
        }
        value={input}
        onChange={setInput}
        onSubmit={addMessage}
        showUpload
        showMic
        isRecording={isRecording}
        recognitionRef={recognitionRef}
        openFilePicker={() => fileInputRef.current?.click()}
        buttonLabel={
          activeAction === "add"
            ? "Add"
            : activeAction === "find"
            ? "Find"
            : activeAction === "sum"
            ? "Sum"
            : "Go"
        }
      />
    </PanelTemplate>
  );
}
