// Pure answer-checking for the Type activity, separated so it can be unit-tested
// without a DOM. Comparison is forgiving of case and surrounding whitespace —
// young children should not fail for typing "a" instead of "A".

export function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase();
}

export function isAnswerCorrect(input: string, answer: string): boolean {
  return input.trim().length > 0 && normalizeAnswer(input) === normalizeAnswer(answer);
}

/** Pick the on-screen keyboard layout that matches the expected answer. */
export function keyboardMode(answer: string): 'letters' | 'digits' {
  return /^[0-9]+$/.test(answer.trim()) ? 'digits' : 'letters';
}
