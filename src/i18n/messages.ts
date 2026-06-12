// UI message catalogue. English is the complete reference locale. To add a
// language (e.g. a Ghanaian language for the hubs), add its code to LOCALES and
// a catalogue below with the same keys — missing keys fall back to English, so a
// partial translation is safe to ship. Lesson/content text is localised the same
// way at the content layer as that work lands.
//
// Audio narration is keyed off the same ids (see audio/voice.ts) so a locale can
// bring both text and voice.

export const LOCALES = [{ code: 'en', label: 'English' }] as const;

export type Locale = (typeof LOCALES)[number]['code'];

export const DEFAULT_LOCALE: Locale = 'en';

export type MessageKey =
  | 'app.title'
  | 'start.greeting'
  | 'start.play'
  | 'start.facilitator'
  | 'common.back'
  | 'common.home'
  | 'reward.title'
  | 'reward.visitVillage'
  | 'reward.backToJourney'
  | 'sound.on'
  | 'sound.off';

type Catalogue = Record<MessageKey, string>;

const en: Catalogue = {
  'app.title': 'ESB Digital Steps',
  'start.greeting': 'Hello! Ready to learn and play?',
  'start.play': 'Start learning',
  'start.facilitator': 'Facilitator',
  'common.back': 'Back',
  'common.home': 'Home',
  'reward.title': 'Well done!',
  'reward.visitVillage': 'Visit my village',
  'reward.backToJourney': 'Back to my journey',
  'sound.on': 'Sound on',
  'sound.off': 'Sound off',
};

export const MESSAGES: Record<Locale, Catalogue> = {
  en,
};

/** Look up a message for a locale, falling back to English, then the key. */
export function translate(locale: Locale, key: MessageKey): string {
  return MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
}
