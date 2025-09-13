import { ImageIcon, Mic, SendHorizontal } from 'lucide-react';
import { TypingDots } from '../styles/ThemeStyles';

type Props = {
  messages: { id: string; role: string; text: string }[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  isThinking: boolean;
  isRecording: boolean;
  recognitionRef: any;
  openFilePicker: () => void;
};

export default function ChatPanel({
  messages,
  input,
  setInput,
  onSend,
  isThinking,
  isRecording,
  recognitionRef,
  openFilePicker,
}: Props) {
  return (
    <div className='md:col-span-2 flex flex-col ai-glow-card overflow-hidden'>
      <div className='flex-1 overflow-auto p-4 space-y-3'>
        {messages.map((m) => (
          <div
            key={m.id}
            className='max-w-[85%] rounded-2xl px-3 py-2 text-sm ai-bubble-glow'
            style={{
              background:
                m.role === 'assistant'
                  ? 'var(--chat-assistant)'
                  : 'var(--chat-user)',
              color:
                m.role === 'assistant'
                  ? 'var(--chat-assistant-ink)'
                  : 'var(--chat-user-ink)',
              marginLeft: m.role === 'assistant' ? undefined : 'auto',
            }}
          >
            {m.text === '...' && isThinking ? <TypingDots /> : <span>{m.text}</span>}
          </div>
        ))}
      </div>

      <div className='p-3' style={{ borderTop: '1px solid var(--edge)' }}>
        <div className='flex items-center gap-2'>
          <button
            className='hidden md:inline-flex ai-icon-btn px-3 py-2'
            onClick={openFilePicker}
            title='Upload image(s)'
          >
            <ImageIcon className='w-4 h-4' />
          </button>

          <button
            className={`hidden md:inline-flex ai-icon-btn px-3 py-2 ${
              isRecording ? 'border-green-400' : ''
            }`}
            onClick={() => {
              if (!recognitionRef.current) return;
              if (isRecording) {
                recognitionRef.current.stop();
              } else {
                recognitionRef.current.start();
              }
            }}
            title={isRecording ? 'Stop voice input' : 'Start voice input'}
          >
            <Mic className='w-4 h-4' />
          </button>

          <input
            className='flex-1 ai-input ai-input-glow px-3 py-2'
            placeholder={'Ask anything… e.g., "Add dentist 9 Dec 3pm"'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSend()}
          />

          <button
            className='inline-flex items-center gap-1 ai-send px-3 py-2'
            onClick={onSend}
          >
            <SendHorizontal className='w-4 h-4' /> Send
          </button>
        </div>

        <div className='mt-2 text-[11px]' style={{ color: 'var(--muted)' }}>
          Drag & drop works on desktop; tap the bucket on mobile.
        </div>
      </div>
    </div>
  );
}
