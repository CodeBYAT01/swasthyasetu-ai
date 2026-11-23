import { LANGUAGES } from '../utils/constants';

/*
 * Abstract speech service. The browser implementation is used when available;
 * a Kannada/Hindi model service can be dropped in behind the same interface.
 */
export const speechService = {
  isSupported() {
    return typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  },

  languageCode(language) {
    return LANGUAGES.find((item) => item.code === language)?.speech || 'en-IN';
  },

  createRecognizer({ language = 'en', onResult, onError, onEnd } = {}) {
    const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!Recognition) return null;
    const recognizer = new Recognition();
    recognizer.lang = this.languageCode(language);
    recognizer.continuous = false;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;
    recognizer.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interimText += result[0].transcript;
      }
      onResult?.({ finalText, interimText });
    };
    recognizer.onerror = (event) => onError?.(event.error || 'Speech recognition error');
    recognizer.onend = () => onEnd?.();
    return recognizer;
  },
};
