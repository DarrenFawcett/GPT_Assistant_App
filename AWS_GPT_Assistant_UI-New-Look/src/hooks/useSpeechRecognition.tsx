import { useEffect } from 'react';

export function useSpeechRecognition(
  isRecording: boolean,
  setInput: React.Dispatch<React.SetStateAction<string>>,
  recognitionRef: React.MutableRefObject<any>
) {
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('❌ SpeechRecognition API not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onend = () => {
      if (isRecording) recognition.start();
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech error:', event.error);
    };

    recognitionRef.current = recognition;
  }, [isRecording]);
}
