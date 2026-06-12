import type { Band } from '../data/db';

// Initial placement from school grade (Teaching at the Right Level starts the
// child near their grade, then adapts). Grade 0 = kindergarten. Pure + testable.
// Facilitators can always override the suggested level in the form.
//
// Bands: 1 Early childhood (4–6) · 2 Early elementary (6–8) · 3 Upper elementary
// (8–11) · 4 Middle school (11–14) · 5 Early high school (14–16).

export function suggestBandForGrade(grade: number): Band {
  if (grade <= 1) return 1;
  if (grade <= 3) return 2;
  if (grade <= 5) return 3;
  if (grade <= 8) return 4;
  return 5;
}

/** Grades offered in the onboarding picker (0 = KG, up to grade 10). */
export const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function gradeLabel(grade: number): string {
  return grade === 0 ? 'KG' : `Grade ${grade}`;
}
