import { uid } from './id';

/*
 * Demonstration-only symptom extractor. It uses simple keyword matching for
 * English, Kannada and Hindi. A production build should replace this module
 * with a validated multilingual clinical NLP service; every extracted item is
 * shown to the worker for explicit review before it can be confirmed.
 */
const KEYWORDS = [
  { label: 'Fever', terms: ['fever', 'temperature', 'ಜ್ವರ', 'ಶಾಖ', 'बुखार', 'ज्वर'] },
  { label: 'Cough', terms: ['cough', 'khansi', 'ಕೆಮ್ಮು', 'कूख', 'खाँसी'] },
  { label: 'Breathlessness', terms: ['breathless', 'shortness of breath', 'difficulty breathing', 'ಉಸಿರಾಟ', 'ಉಸಿರು', 'सांस', 'श्वास'] },
  { label: 'Chest pain', terms: ['chest pain', 'chest discomfort', 'ಎದೆ ನೋವು', 'ಎದೆ', 'छाती', 'सीने'] },
  { label: 'Headache', terms: ['headache', 'head pain', 'ತಲೆನೋವು', 'सिरदर्द'] },
  { label: 'Body ache', terms: ['body ache', 'muscle pain', 'ದೇಹ ನೋವು', 'शरीर दर्द'] },
  { label: 'Fatigue', terms: ['fatigue', 'weakness', 'tired', 'ಆಯಾಸ', 'ದಣಿವು', 'थकान', 'कमजोरी'] },
  { label: 'Nausea', terms: ['nausea', 'vomiting', 'vomit', 'ವಾಂತಿ', 'ಓಕರಿಕೆ', 'उल्टी', 'मिचली'] },
  { label: 'Diarrhoea', terms: ['diarrhoea', 'diarrhea', 'loose motion', 'ಅತಿಸಾರ', 'दस्त'] },
  { label: 'Abdominal pain', terms: ['abdominal pain', 'stomach pain', 'ಹೊಟ್ಟೆ ನೋವು', 'पेट दर्द'] },
  { label: 'Sore throat', terms: ['sore throat', 'throat pain', 'ಗಂಟಲು', 'गले'] },
  { label: 'Rash', terms: ['rash', 'skin eruption', 'ದದ್ದು', 'चकत्ते', 'दाने'] },
  { label: 'Dizziness', terms: ['dizzy', 'dizziness', ' vertigo', 'ತಲೆತಿರುಗುವಿಕೆ', 'चक्कर'] },
  { label: 'Confusion', terms: ['confusion', 'confused', 'altered mental', 'ಗೊಂದಲ', 'भ्रम'] },
];

const DURATION_PATTERNS = [
  { re: /(\d+)\s*(?:days?|din|ದಿನ|दिन)/i, unit: 'days' },
  { re: /(\d+)\s*(?:hours?|ghante|ಗಂಟೆ|घंटे)/i, unit: 'hours' },
  { re: /(\d+)\s*(?:weeks?|saptah|ವಾರ|सप्ताह)/i, unit: 'weeks' },
  { re: /(three|three\s*days|3)\s*days?/i, unit: 'days', value: 3 },
  { re: /two\s*days?/i, unit: 'days', value: 2 },
  { re: /one\s*day/i, unit: 'days', value: 1 },
];

export function extractDuration(text = '') {
  for (const pattern of DURATION_PATTERNS) {
    const match = text.match(pattern.re);
    if (match) return { value: match[1] || pattern.value || match[0], unit: pattern.unit };
  }
  return null;
}

export function extractSymptoms(text = '') {
  const lower = text.toLowerCase();
  const found = [];
  for (const entry of KEYWORDS) {
    const matchedTerm = entry.terms.find((term) => lower.includes(term.toLowerCase()));
    if (matchedTerm) {
      found.push({
        id: uid('symptom'),
        label: entry.label,
        duration: null,
        confidence: matchedTerm.length > 4 ? 'high' : 'medium',
        confirmed: false,
        source: 'extracted',
      });
    }
  }
  if (found.length) {
    const duration = extractDuration(text);
    if (duration) {
      found.forEach((symptom, idx) => {
        symptom.duration = idx === 0 || found.length === 1 ? `${duration.value} ${duration.unit}` : '';
      });
    }
  }
  return found;
}

export const SAMPLE_UTTERANCES = {
  en: {
    label: 'English sample',
    text: 'Patient has fever for three days and is experiencing cough.',
  },
  kn: {
    label: 'Kannada sample (ಕನ್ನಡ)',
    text: 'ರೋಗಿಗೆ ಮೂರು ದಿನಗಳಿಂದ ಜ್ವರ ಮತ್ತು ಕೆಮ್ಮು ಇದೆ. ಉಸಿರಾಟದ ತೊಂದರೆಯೂ ಸ್ವಲ್ಪ ಇದೆ.',
  },
  hi: {
    label: 'Hindi sample (हिन्दी)',
    text: 'रोगी को तीन दिन से बुखार है और खाँसी भी है। सांस लेने में भी थोड़ी कठिनाई है।',
  },
  emergency: {
    label: 'Emergency drill sample',
    text: 'Patient has severe chest pain and breathlessness since two hours.',
  },
};
