import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";
import CalendarPanel from "./CalendarPanel";
import TodoPanel from "./TodoPanel";
import NotesPanel from "./NotesPanel";
import EmailPanel from "./EmailPanel";
import TaxClaimPanel from "./TaxClaimPanel"; // 🧾 new import

// add "taxclaim"
type TabType = "chat" | "calendar" | "todo" | "notes" | "email" | "taxclaim";

// ✨ Reusable animation variants
const variants = {
  slideFade: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.18, ease: "easeOut" },
  },
  scalePop: {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.2, ease: "easeOut" },
  },
  swipeSlide: {
    initial: { x: 40, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
    transition: { duration: 0.25, ease: "easeInOut" },
  },
  gentleFade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
  flip3D: {
    initial: { rotateY: 20, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

export default function TabContent({ activeTab }: { activeTab: TabType }) {
  const panels = useMemo(
    () => ({
      chat: <ChatPanel />,
      calendar: <CalendarPanel />,
      todo: <TodoPanel />,
      notes: <NotesPanel />,
      email: <EmailPanel />,
      taxclaim: <TaxClaimPanel />, // 🧾 added
    }),
    []
  );

  const currentVariant = variants.flip3D;

  return (
    <div className="relative h-full rounded-xl overflow-hidden p-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={currentVariant.initial}
          animate={currentVariant.animate}
          exit={currentVariant.exit}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="h-full"
        >
          {panels[activeTab]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
