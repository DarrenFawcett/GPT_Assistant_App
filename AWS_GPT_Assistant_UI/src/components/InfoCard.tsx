// src/components/InfoCard.tsx
export default function InfoCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="p-4 rounded-xl border border-white/10 bg-[#121826] text-white shadow-md mb-4">
      <div className="flex items-center gap-2 mb-2 text-lg font-semibold">
        <span className="text-2xl">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="text-sm text-gray-400 whitespace-pre-line">{text}</p>
    </div>
  );
}
