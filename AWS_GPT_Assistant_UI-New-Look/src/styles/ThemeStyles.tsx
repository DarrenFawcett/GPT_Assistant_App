export function ThemeStyles() {
  return (
    <style>{`
      .theme-ai-dark {
        --app: radial-gradient(1400px 800px at 50% -50%, #2d2940d2 0%, #111421bf 60%, #0c101c 100%);
        --ink: #e9eaf7;
        --muted: #a1a8bd;
        --card: #191d2c;
        --surface: #141827;
        --surface-2: #101421;
        --edge: rgba(255, 255, 255, 0.06);
        --shadow: 0 8px 24px rgba(10, 12, 20, 0.7);
        --accent: #a78bfa;
        --accent-2: #2241eeff;

        --chat-user: linear-gradient(135deg, rgba(124,58,237,0.9), rgba(167,139,250,0.9));
        --chat-assistant: linear-gradient(135deg, rgba(79,70,229,0.9), rgba(129,140,248,0.9));
        --chat-user-ink: #fff;
        --chat-assistant-ink: #fff;
        
        --chip: rgba(139, 92, 246, 0.15);
        --success: #22c55e;
        --warning: #f59e0b;
        --glow: 0 0 18px rgba(167, 139, 250, 0.6);
      }
    `}</style>
  );
}

/* ---------- Extra UI styles (glow cards, dashed dropzone, inputs) ---------- */
export function GlowStyles() {
  return (
    <style>{`

      
     /* === Glow Card (outer panels) === */
// .ai-glow-card {
//   position: relative;
//   border-radius: 16px;
//   background: var(--surface-2);
//   border: 1px solid var(--edge);
//   box-shadow:
//     0 0 2px rgba(243, 232, 232, 0.7),
//     0 0 10px rgba(146, 139, 250, 0.35),
//     0 0 30px rgba(92, 100, 246, 0.25);
// }

// .ai-glow-card::before {
//   content: "";
//   position: absolute;
//   inset: -8px;
//   border-radius: inherit;
//   background: radial-gradient(
//     80% 80% at 50% 50%,
//     rgba(167, 139, 250, 0.7) 0%,
//     rgba(139, 92, 246, 0.35) 40%,
//     rgba(139, 92, 246, 0) 80%
//   );
//   z-index: -1;
//   filter: blur(45px);
//   opacity: 1;
// }

/* Dotted drop zone */
.ai-dash {
  border: 2px dashed rgba(148, 163, 184, 0.35);
}

// /* === Input + Buttons unified style === */
// .ai-input,
// .ai-icon-btn {
//   background: linear-gradient(135deg, #111a2f, #07162f); /* blue gradient */
//   border-radius: 12px;
//   border: 1px solid rgba(59, 130, 246, 0.6);
//   color: #ffffff;
//   box-shadow:
//     0 0 2px rgba(243, 232, 232, 0.7),
//     0 0 10px rgba(146, 139, 250, 0.35),
//     0 0 30px rgba(92, 100, 246, 0.25);
//   transition: all 0.2s ease;
// }

/* === Solid Send Button === */
.ai-send {
  background: #5538c8cc; /* solid violet-blue */
  border: 1px solid rgba(59, 130, 246, 0.9);
  color: #fff;
  border-radius: 12px;
  box-shadow:
    0 0 3px rgba(59, 130, 246, 0.7),
    0 0 8px rgba(92, 100, 246, 0.5);
  transition: all 0.2s ease;
}

/* === Hover + Focus States === */
.ai-input:focus,
.ai-icon-btn:hover,
.ai-send:hover {
  border-color: #fff;
  transform: translateY(-1px);
  box-shadow:
    0 0 4px rgba(59, 130, 246, 0.8),
    0 0 12px rgba(92, 100, 246, 0.5);
}

/* === Active click effect === */
.ai-send:active,
.ai-icon-btn:active {
  transform: translateY(1px);
}

/* === Chat bubble styling === */
.ai-bubble-glow {
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: var(--surface-2);
  border-radius: 12px;
}

/* === GPT Icon Glow (header icon) === */
.ai-icon-glow {
  border-radius: 50%;
  border: 2px solid rgba(59, 130, 246, 0.7);
  padding: 6px;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(59, 130, 246, 0.15),
    rgba(17, 24, 39, 0.95)
  );
  box-shadow:
    0 0 3px rgba(243, 232, 232, 0.7),
    0 0 10px rgba(146, 139, 250, 0.35),
    0 0 20px rgba(92, 100, 246, 0.25);
}



    `}</style>
  );
}

/* ---------- Typing dots (bounce) ---------- */
export function TypingDots() {
  return (
    <span className='inline-flex items-center gap-1 opacity-80'>
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '0ms' }}
      />
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '120ms' }}
      />
      <span
        className='w-1.5 h-1.5 rounded-full bg-current animate-bounce'
        style={{ animationDelay: '240ms' }}
      />
    </span>
  );
}