import React from "react";

export function TypingDots({ color = "#fff" }: { color?: string }) {
  return (
    <div className="flex items-center justify-center space-x-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="dot inline-block w-[6px] h-[6px] rounded-full animate-bounce"
          style={{
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
