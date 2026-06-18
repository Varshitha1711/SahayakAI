import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Standard Web Speech API recognition types
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceAssistant({ onCommand, activeLanguage }) {
  const { t } = useTranslation();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const recognitionRef = useRef(null);

  // Map chosen language code to Web Speech locales
  const getSpeechLocale = (lang) => {
    switch (lang) {
      case 'hi': return 'hi-IN';
      case 'te': return 'te-IN';
      case 'kn': return 'kn-IN';
      default: return 'en-IN';
    }
  };

  useEffect(() => {
    if (!SpeechRecognition) {
      setErrorMsg('Web Speech API is not supported in this browser.');
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = getSpeechLocale(activeLanguage);

    rec.onstart = () => {
      setIsListening(true);
      setErrorMsg('');
      setTranscript('');
    };

    rec.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      setTranscript(resultText);
      if (onCommand) {
        onCommand(resultText);
      }
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMsg('Microphone access denied.');
      } else {
        setErrorMsg(`Error: ${event.error}`);
      }
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [activeLanguage, onCommand]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Update language dynamically in case it changed
        recognitionRef.current.lang = getSpeechLocale(activeLanguage);
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={toggleListening}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
          isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse-ring' 
            : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 hover:scale-105'
        }`}
        title="Speak to Sahayak"
      >
        {isListening ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      {isListening && (
        <span className="text-xs font-bold text-gradient-gold animate-bounce-dot uppercase tracking-widest">
          Listening... Speak now
        </span>
      )}
      
      {transcript && !isListening && (
        <div className="glass px-4 py-2 rounded-xl text-xs text-indigo-200 text-center max-w-xs animate-slide-up">
          <span className="font-semibold text-amber-400">You said:</span> "{transcript}"
        </div>
      )}
      
      {errorMsg && (
        <div className="text-[11px] text-red-400 text-center font-medium">
          {errorMsg}
        </div>
      )}
    </div>
  );
}

let activeAudio = null;

// Helper to chunk long text into <= 180 chars for Google Translate TTS API limits
function splitTextIntoChunks(text, maxLength = 180) {
  if (!text) return [];
  const words = text.split(' ');
  const chunks = [];
  let currentChunk = '';
  
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = word;
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + word : word;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

function nativeSpeakFallback(text, lang, onEnd) {
  const utterance = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const searchLang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : lang === 'kn' ? 'kn-IN' : 'en-IN';
  let voice = voices.find(v => v.lang.includes(searchLang)) || voices.find(v => v.lang.startsWith(lang));
  if (voice) utterance.voice = voice;
  utterance.lang = searchLang;
  utterance.rate = 0.95;
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
}

/**
 * Text-to-Speech helper utility using browser native speechSynthesis.
 */
export function speakText(text, lang = 'en', onEnd = null) {
  // 1. Cancel native speech synthesis
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  
  // 2. Stop HTML Audio if active
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  
  const targetLang = lang.split('-')[0].toLowerCase();
  
  // Use native browser SpeechSynthesis for English
  if (targetLang === 'en') {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    let voice = voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-US'));
    if (voice) utterance.voice = voice;
    utterance.lang = 'en-IN';
    utterance.rate = 0.95;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
    return;
  }
  
  // For te, hi, kn: Use Google Translate TTS via HTML5 Audio to bypass missing local OS voice packs
  const chunks = splitTextIntoChunks(text, 180);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }
  
  let currentChunkIndex = 0;
  
  const playNextChunk = () => {
    if (currentChunkIndex >= chunks.length) {
      if (onEnd) onEnd();
      return;
    }
    
    const chunkText = chunks[currentChunkIndex];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=gtx&q=${encodeURIComponent(chunkText)}`;
    
    const audio = new Audio(url);
    activeAudio = audio;
    
    audio.onended = () => {
      currentChunkIndex++;
      playNextChunk();
    };
    
    audio.onerror = (e) => {
      console.error('Google TTS Audio playback error, falling back to native TTS:', e);
      nativeSpeakFallback(text, targetLang, onEnd);
    };
    
    audio.play().catch(err => {
      console.warn('Audio autoplay failed, falling back to native TTS:', err);
      // Log available voices to help verify browser settings
      const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
      console.log('Available browser voices:', voices.map(v => `${v.name} (${v.lang})`));
      nativeSpeakFallback(text, targetLang, onEnd);
    });
  };
  
  playNextChunk();
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
}


