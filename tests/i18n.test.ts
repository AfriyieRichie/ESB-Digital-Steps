import { describe, expect, it } from 'vitest';
import { MESSAGES, translate } from '../src/i18n/messages';

describe('i18n', () => {
  it('returns the message for the current locale', () => {
    expect(translate('en', 'start.play')).toBe('Start learning');
  });

  it('falls back to English for an unknown locale', () => {
    // Cast: deliberately exercising the fallback path with a non-existent locale.
    expect(translate('zz' as 'en', 'app.title')).toBe(MESSAGES.en['app.title']);
  });

  it('every catalogue has the same keys as English (no missing translations)', () => {
    const enKeys = Object.keys(MESSAGES.en).sort();
    for (const [locale, catalogue] of Object.entries(MESSAGES)) {
      expect(Object.keys(catalogue).sort(), `locale ${locale}`).toEqual(enKeys);
    }
  });
});
