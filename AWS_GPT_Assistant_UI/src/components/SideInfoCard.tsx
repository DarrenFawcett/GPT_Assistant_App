import {
  Calendar as CalendarIcon,
  ClipboardList,
  StickyNote,
  Mail,
  Bot,
} from 'lucide-react';

function SideInfoCard({ activeTab }: { activeTab: string }) {
  const cardBase = 'mt-4 p-4 rounded-xl border border-slate-700 ai-glow-card';
  const titleStyle = 'text-white font-semibold mb-2 flex items-center gap-2';
  const textStyle = 'text-slate-300 text-sm';
  const hintStyle = 'text-slate-400 text-xs block mt-1';

  if (activeTab === 'Chat') {
    return (
      <div className={cardBase}>
        <div className={titleStyle}>
          <Bot className="w-4 h-4" />
          Quick Chat
        </div>
        <div className={textStyle}>
          Type a natural sentence in chat like:
          <em className={hintStyle}>
            “What’s the weather like tomorrow?”<br />
          </em>
        </div>
      </div>
    );
  }

  if (activeTab === 'Calendar') {
    return (
      <div className={cardBase}>
        <div className={titleStyle}>
          <CalendarIcon className="w-4 h-4" />
          📅 Calendar Help
        </div>
        <div className={textStyle}>
          Add events like:
          <em className={hintStyle}>
            “Holiday from 24 Dec to 1 Jan”<br />
            “Call with John tomorrow at 10am”
          </em>
        </div>
      </div>
    );
  }

  if (activeTab === 'To-Do') {
    return (
      <div className={cardBase}>
        <div className={titleStyle}>
          <ClipboardList className="w-4 h-4" />
          📝 To-Do Tips
        </div>
        <div className={textStyle}>
          Add tasks like:
          <em className={hintStyle}>
            “Buy milk, Schedule car service, Finish portfolio site.”
          </em>
        </div>
      </div>
    );
  }

  if (activeTab === 'Notes') {
    return (
      <div className={cardBase}>
        <div className={titleStyle}>
          <StickyNote className="w-4 h-4" />
          ✏️ Notes Tips
        </div>
        <div className={textStyle}>
          Log thoughts, ideas, or reminders like:
          <em className={hintStyle}>
            “Reflect on week’s goals”<br />
            “Idea for new project: AI Email sorter”
          </em>
        </div>
      </div>
    );
  }

  if (activeTab === 'Email') {
    return (
      <div className={cardBase}>
        <div className={titleStyle}>
          <Mail className="w-4 h-4" />
          📧 Email Tips
        </div>
        <div className={textStyle}>
          Draft or review emails like:
          <em className={hintStyle}>
            “Send email to Sarah about the AWS project.”<br />
            “Check if invoice was received.”
          </em>
        </div>
      </div>
    );
  }

  return null;
}

export default SideInfoCard;
