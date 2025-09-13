// ThemeStyles.tsx

import { motion } from 'framer-motion';

export function AssistantIcon() {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 0.7, opacity: 1 }}
      className='w-20 h-20 rounded-full flex items-center justify-center ring-2 ai-icon-glow'
      style={{
        background: 'var(--surface-2)',
        boxShadow: `
          0 0 2px rgba(255, 255, 255, 0.25),
          0 0 10px rgba(167, 139, 250, 0.35),
          0 0 30px rgba(139, 92, 246, 0.25)
        `,
        borderColor: 'var(--edge)',
      }}
    >
      <img
        src='/src/assets/gpt-icon-white.png'
        alt='GPT Assistant Icon'
        className='mt-2 w-16 h-16 object-contain'
      />
    </motion.div>
  );
}
