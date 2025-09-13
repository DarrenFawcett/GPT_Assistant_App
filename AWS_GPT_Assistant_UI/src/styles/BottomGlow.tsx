// src/components/BottomGlow.tsx
export default function BottomGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 bottom-0 h-24 z-[-1]"
    >
      <div
        className="absolute inset-x-10 bottom-6 h-20 blur-2xl opacity-60"
        style={{
          background:
            'radial-gradient(60% 140% at 50% 100%, rgba(56,189,248,0.35) 0%, rgba(29,78,216,0.25) 40%, rgba(2,6,23,0) 80%)',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-cyan-400/50 via-indigo-400/60 to-fuchsia-400/50" />
    </div>
  );
}
