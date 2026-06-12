import { create } from 'zustand';
import { DEFAULT_LOCALE, translate, type Locale, type MessageKey } from './messages';

// Current UI language. In-memory for the session (a hub kiosk picks a language
// per session). Components read strings via useT so switching locale re-renders.

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

export const useLocale = create<LocaleState>((set) => ({
  locale: DEFAULT_LOCALE,
  setLocale: (locale) => set({ locale }),
}));

export type TranslateFn = (key: MessageKey) => string;

/** Hook returning a translate function bound to the current locale. */
export function useT(): TranslateFn {
  const locale = useLocale((s) => s.locale);
  return (key) => translate(locale, key);
}
