// src/components/MicButton.tsx
import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}


interface MicButtonProps {
  onTranscript?: (text: string) => void;
}

export default function MicButton({ onTranscript }: MicButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // @ts-ignore – Web Speech API
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("⚠️ Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-GB";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log("🎙️ Mic started listening...");
      setIsRecording(true);
    };

    recognition.onend = () => {
      console.log("🛑 Mic stopped listening.");
      setIsRecording(false);
    };

    recognition.onerror = (e: any) => {
      console.error("❌ Speech recognition error:", e);
      setIsRecording(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      console.log("✅ Transcript captured:", transcript);
      // Append instead of overwrite
      onTranscript?.(" " + transcript);
    };

    recognitionRef.current = recognition;
  }, [onTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) recognitionRef.current.stop();
    else recognitionRef.current.start();
  };

  return (
    <button
      onClick={toggleRecording}
      title={isRecording ? "Stop recording" : "Start recording"}
      className={`inline-flex ai-icon-btn items-center justify-center px-3 py-2 rounded-md transition-all duration-200
        ${
          isRecording
            ? "bg-red-500 text-white shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse"
            : "bg-sky-600/30 text-sky-300 hover:bg-sky-600/50 hover:text-sky-100"
        }`}
    >
      {isRecording ? <Square size={16} /> : <Mic size={16} />}
    </button>
  );
}
