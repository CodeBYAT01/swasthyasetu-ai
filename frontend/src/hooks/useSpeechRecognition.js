import { useCallback, useEffect, useRef, useState } from 'react';
import { speechService } from '../services/speechService';

export function useSpeechRecognition({ language = 'en', onFinal } = {}) {
  const recognizerRef = useRef(null);
  const timerRef = useRef(null);
  const transcriptRef = useRef('');
  const [state, setState] = useState('ready'); // ready | recording | processing | transcript
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscriptState] = useState('');
  const [interim, setInterim] = useState('');
  const [error, setError] = useState('');
  const supported = speechService.isSupported();

  const setTranscript = useCallback((value) => {
    transcriptRef.current = value;
    setTranscriptState(value);
    setState((current) => (current === 'recording' || current === 'processing'
      ? current
      : value.trim() ? 'transcript' : 'ready'));
  }, []);

  useEffect(() => () => {
    recognizerRef.current?.abort?.();
    clearInterval(timerRef.current);
  }, []);

  const stop = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    try {
      recognizerRef.current?.stop?.();
    } catch {
      // Recognition may already have ended.
    }
    recognizerRef.current = null;
    setInterim('');
    setState((current) => (current === 'recording' ? 'processing' : current));
    setTimeout(() => {
      setState(transcriptRef.current.trim() ? 'transcript' : 'ready');
    }, 650);
  }, []);

  const start = useCallback(() => {
    setError('');
    setSeconds(0);
    clearInterval(timerRef.current);
    const recognizer = speechService.createRecognizer({
      language,
      onResult: ({ finalText, interimText }) => {
        if (finalText) {
          const next = [transcriptRef.current.trim(), finalText.trim()].filter(Boolean).join(' ');
          transcriptRef.current = next;
          setTranscriptState(next);
          onFinal?.(next);
        }
        setInterim(interimText);
      },
      onError: (message) => {
        setError(message === 'not-allowed'
          ? 'Microphone permission was denied. Use manual text entry instead.'
          : `Speech recognition: ${message}. Manual text entry is available.`);
        stop();
      },
      onEnd: () => {
        setInterim('');
      },
    });

    if (!recognizer) {
      setError('Browser speech recognition is unavailable. Use manual text entry or the sample utterance.');
      return false;
    }
    recognizerRef.current = recognizer;
    try {
      recognizer.start();
      setState('recording');
      timerRef.current = setInterval(() => setSeconds((value) => value + 1), 1000);
      return true;
    } catch {
      setError('The microphone could not be started. Use manual text entry instead.');
      setState('ready');
      return false;
    }
  }, [language, onFinal, stop]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    try { recognizerRef.current?.abort?.(); } catch { /* noop */ }
    recognizerRef.current = null;
    transcriptRef.current = '';
    setTranscriptState('');
    setInterim('');
    setSeconds(0);
    setError('');
    setState('ready');
  }, []);

  return { state, setState, seconds, transcript, setTranscript, interim, error, start, stop, reset, supported };
}
