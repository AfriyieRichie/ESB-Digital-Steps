import type { Band } from '../data/db';

// Initial placement from school grade (Teaching at the Right Level starts the
// child near their grade, then adapts). Grade 0 = kindergarten. Pure + testable.
// Facilitators can always override the suggested level in the form.

export function suggestBandForGrade(grade: number): Band {
  if (grade <= 2) return 1;
  if (grade <= 4) return 2;
  return 3;
}

/** Grades offered in the onboarding picker (0 = KG). */
export const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const;

export function gradeLabel(grade: number): string {
  return grade === 0 ? 'KG' : `Grade ${grade}`;
}
