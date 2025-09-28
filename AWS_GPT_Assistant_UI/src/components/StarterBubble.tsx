// src/components/StarterBubble.tsx
export const starterTexts = {
  chat: "💬 How can I assist you today?",
  calendar: "📅 How can I help with your calendar?",
  todo: "✅ What task would you like to add?",
  notes: "📝 Ready to jot something down?",
  email: "📧 How can I assist you with email today?",
};

interface StarterBubbleProps {
  text: string;
}

export default function StarterBubble({ text }: StarterBubbleProps) {
  return (
    <div
      className="max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow"
      style={{
        background: "var(--chat-assistant)",
        color: "var(--chat-assistant-ink)",
      }}
    >
      <span>{text}</span>
    </div>
  );
}
