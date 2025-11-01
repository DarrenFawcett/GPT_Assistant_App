import { useEffect, useState } from "react";

interface ChipRotatorWithButtonProps {
  items: { icon: string; label: string; text: string }[];
  interval?: number;
  header?: string; // 👈 optional header label
}

export default function ChipRotatorWithButton({
  items,
  interval = 15000,
  header = "",
}: ChipRotatorWithButtonProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % items.length),
      interval
    );
    return () => clearInterval(timer);
  }, [items, interval]);

  const active = items[index];

  return (
    <div className="flex items-center justify-between w-full">
      {/* Fixed header */}
      <h3 className="font-semibold pr-2 pb-1 whitespace-nowrap">{header}</h3>

      {/* Rotating section */}
      <div className="flex items-center gap-2 sm:gap-3 animate-fade">
        <button
          className="px-4 rounded-full border border-sky-400 text-sky-300 flex items-center gap-1"
        >
          <span>{active.icon}</span>
          <span>{active.label}</span>
        </button>

        <span
          className="text-sm italic px-3 py-1 rounded-md truncate"
          style={{
            background: "rgba(56,189,248,0.1)",
            color: "#38bdf8",
            fontSize: "clamp(0.7rem, 2vw, 0.9rem)",
            maxWidth: "clamp(150px, 40vw, 340px)", // 💡 more text space
            lineHeight: "1.3",
          }}
        >
          {active.text}
        </span>
      </div>
    </div>
  );
}
