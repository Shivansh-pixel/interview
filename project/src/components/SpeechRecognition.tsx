import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface SpeechRecognitionProps {
  onSpeechResult: (text: string) => void;
  question: string;
}

const SpeechRecognition: React.FC<SpeechRecognitionProps> = ({ onSpeechResult, question }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Stop any active speech & recognition when the question changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    stopListening(); // Stop listening if a new question is asked
  }, [question]);

  // Start speech recognition manually
  const startListening = () => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true; // Continuous listening
    recognition.interimResults = true; // Show partial results

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      onSpeechResult(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopListening(); // Optional: stop on error
    };

    recognition.onend = () => {
      // Don't update state here — user controls that
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Stop recognition manually or when question changes
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const speech = new SpeechSynthesisUtterance(question);
      speech.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(speech);
      setIsSpeaking(true);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => isListening ? stopListening() : startListening()}
        variant="outline"
        className={isListening ? 'bg-red-100' : ''}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        {isListening ? 'Stop Recording' : 'Start Recording'}
      </Button>

      <Button onClick={toggleSpeech} variant="outline">
        {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {isSpeaking ? 'Stop Reading' : 'Read Question'}
      </Button>
    </div>
  );
};

export default SpeechRecognition;
