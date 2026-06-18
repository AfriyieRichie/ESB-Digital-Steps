import type { SubjectId } from './subjects';

// The competency framework: every recorded skill maps to one of these ids.
// A competency (a.k.a. skill) is the atomic, reportable unit of learning. It
// belongs to a subject and a strand (the topic within that subject). Only the
// digital-literacy competencies are defined in this first slice (the 11 from
// the product spec); reading/writing/numeracy keep the same shape and are added
// as those subjects get content.
//
// `strand` references an id in data/strands.ts. `prerequisites` lists the skill
// ids that should be mastered first (used by the sequencing engine in a later
// slice); it is empty for the foundational skills.

export interface Competency {
  id: string;
  subject: SubjectId;
  strand: string;
  label: string;
  prerequisites: readonly string[];
}

// --- Digital literacy: the 11 competencies (source of truth) -----------------
const DIGITAL_COMPETENCIES: readonly Competency[] = [
  // Strand: Using the device (d_use)
  { id: 'u_parts', subject: 'digital', strand: 'd_use', label: 'Knows the main parts of the device', prerequisites: [] },
  { id: 'u_power', subject: 'digital', strand: 'd_use', label: 'Turns the screen on and off', prerequisites: [] },
  { id: 'u_tap', subject: 'digital', strand: 'd_use', label: 'Taps and selects on screen', prerequisites: [] },
  { id: 'u_drag', subject: 'digital', strand: 'd_use', label: 'Drags and moves things', prerequisites: ['u_tap'] },
  { id: 'u_type', subject: 'digital', strand: 'd_use', label: 'Finds letters and types', prerequisites: ['u_tap'] },
  { id: 'n_open', subject: 'digital', strand: 'd_use', label: 'Opens and closes an activity', prerequisites: ['u_tap'] },
  // Strand: Care & responsibility (d_care)
  { id: 'c_hold', subject: 'digital', strand: 'd_care', label: 'Holds and carries the device safely', prerequisites: [] },
  { id: 'c_food', subject: 'digital', strand: 'd_care', label: 'Keeps food and water away', prerequisites: [] },
  { id: 'c_share', subject: 'digital', strand: 'd_care', label: 'Takes turns and shares', prerequisites: [] },
  { id: 'c_report', subject: 'digital', strand: 'd_care', label: 'Reports a problem honestly', prerequisites: [] },
  { id: 'c_return', subject: 'digital', strand: 'd_care', label: 'Returns the device after use', prerequisites: [] },
  // Using the device, deeper (d_use) — bands 1-3
  { id: 'u_icons', subject: 'digital', strand: 'd_use', label: 'Knows common icons', prerequisites: [] },
  { id: 'u_search', subject: 'digital', strand: 'd_use', label: 'Searches for information', prerequisites: [] },
  // Coding & computational thinking (d_code) — bands 2-5
  { id: 'dc_sequence', subject: 'digital', strand: 'd_code', label: 'Orders steps in a sequence', prerequisites: [] },
  { id: 'dc_loops', subject: 'digital', strand: 'd_code', label: 'Uses loops to repeat', prerequisites: [] },
  { id: 'dc_logic', subject: 'digital', strand: 'd_code', label: 'Uses if/then conditions', prerequisites: [] },
  { id: 'dc_algorithm', subject: 'digital', strand: 'd_code', label: 'Understands algorithms & AI', prerequisites: [] },
  // Online safety (d_safety) — bands 2-5
  { id: 'ds_link', subject: 'digital', strand: 'd_safety', label: 'Spots safe & unsafe links', prerequisites: [] },
  { id: 'ds_etiquette', subject: 'digital', strand: 'd_safety', label: 'Is kind & safe online', prerequisites: [] },
  { id: 'ds_password', subject: 'digital', strand: 'd_safety', label: 'Protects passwords & privacy', prerequisites: [] },
  { id: 'ds_misinfo', subject: 'digital', strand: 'd_safety', label: 'Spots misinformation & ads', prerequisites: [] },
  { id: 'ds_footprint', subject: 'digital', strand: 'd_safety', label: 'Manages a digital footprint', prerequisites: [] },
];

// First numeracy and reading competencies — enough to anchor the Choose and
// Type activities with real content. These grow as the curriculum is authored.
// Reading spans phonics -> decoding/fluency -> comprehension -> analysis across
// the five bands. (Cross-band prerequisites are left light because the engine
// only gates on prerequisites taught at the learner's own band.)
const READING_COMPETENCIES: readonly Competency[] = [
  // Band 1 — phonemic awareness & print
  { id: 'r_letter', subject: 'reading', strand: 'r_print', label: 'Recognises letters', prerequisites: [] },
  { id: 'r_sound', subject: 'reading', strand: 'r_print', label: 'Matches sounds to letters', prerequisites: [] },
  { id: 'r_rhyme', subject: 'reading', strand: 'r_print', label: 'Hears rhyming words', prerequisites: [] },
  // Band 2 — decoding to fluency
  { id: 'r_word', subject: 'reading', strand: 'r_print', label: 'Reads simple words', prerequisites: ['r_letter'] },
  { id: 'r_family', subject: 'reading', strand: 'r_print', label: 'Reads word families', prerequisites: [] },
  { id: 'r_cloze', subject: 'reading', strand: 'r_comp', label: 'Completes a sentence in context', prerequisites: [] },
  // Band 3 — reading to learn
  { id: 'r_main', subject: 'reading', strand: 'r_comp', label: 'Finds the main idea', prerequisites: [] },
  { id: 'r_context', subject: 'reading', strand: 'r_vocab', label: 'Uses context clues', prerequisites: [] },
  { id: 'r_synonym', subject: 'reading', strand: 'r_vocab', label: 'Knows synonyms & antonyms', prerequisites: [] },
  // Band 4 — analysis
  { id: 'r_infer', subject: 'reading', strand: 'r_comp', label: 'Makes inferences', prerequisites: [] },
  { id: 'r_figurative', subject: 'reading', strand: 'r_vocab', label: 'Understands figurative language', prerequisites: [] },
  // Band 5 — critical reading
  { id: 'r_purpose', subject: 'reading', strand: 'r_comp', label: "Identifies author's purpose", prerequisites: [] },
  { id: 'r_evaluate', subject: 'reading', strand: 'r_comp', label: 'Evaluates arguments & evidence', prerequisites: [] },
];
// Writing climbs from building words -> sentences -> punctuation -> paragraphs
// -> essays -> structured arguments across the five bands.
const WRITING_COMPETENCIES: readonly Competency[] = [
  { id: 'w_word', subject: 'writing', strand: 'w_build', label: 'Builds simple words', prerequisites: [] },
  { id: 'w_sentence', subject: 'writing', strand: 'w_compose', label: 'Writes a complete sentence', prerequisites: [] },
  { id: 'w_punctuation', subject: 'writing', strand: 'w_compose', label: 'Uses capitals & punctuation', prerequisites: [] },
  { id: 'w_paragraph', subject: 'writing', strand: 'w_compose', label: 'Builds a clear paragraph', prerequisites: [] },
  { id: 'w_structure', subject: 'writing', strand: 'w_compose', label: 'Structures an essay', prerequisites: [] },
  { id: 'w_argue', subject: 'writing', strand: 'w_compose', label: 'Builds a structured argument', prerequisites: [] },
];
// Numeracy climbs counting -> operations -> fractions/data -> pre-algebra ->
// algebra/coordinates/statistics across the five bands.
const NUMERACY_COMPETENCIES: readonly Competency[] = [
  // Band 1 — number sense
  { id: 'm_count', subject: 'numeracy', strand: 'n_number', label: 'Counts objects to 10', prerequisites: [] },
  { id: 'm_numeral', subject: 'numeracy', strand: 'n_number', label: 'Recognises numerals', prerequisites: ['m_count'] },
  { id: 'm_compare', subject: 'numeracy', strand: 'n_number', label: 'Compares more & less', prerequisites: [] },
  { id: 'm_shape', subject: 'numeracy', strand: 'n_geometry', label: 'Names 2-D shapes', prerequisites: [] },
  // Band 2 — early operations
  { id: 'm_add', subject: 'numeracy', strand: 'n_ops', label: 'Adds within 20', prerequisites: ['m_count'] },
  { id: 'm_subtract', subject: 'numeracy', strand: 'n_ops', label: 'Subtracts within 20', prerequisites: [] },
  { id: 'm_place', subject: 'numeracy', strand: 'n_number', label: 'Understands tens & ones', prerequisites: [] },
  // Band 3 — operations & fractions
  { id: 'm_multiply', subject: 'numeracy', strand: 'n_ops', label: 'Multiplies single digits', prerequisites: [] },
  { id: 'm_fraction', subject: 'numeracy', strand: 'n_number', label: 'Understands simple fractions', prerequisites: [] },
  { id: 'm_data', subject: 'numeracy', strand: 'n_data', label: 'Reads a bar chart', prerequisites: [] },
  // Band 4 — pre-algebra
  { id: 'm_percent', subject: 'numeracy', strand: 'n_ops', label: 'Finds simple percentages', prerequisites: [] },
  { id: 'm_algebra1', subject: 'numeracy', strand: 'n_ops', label: 'Solves for an unknown', prerequisites: [] },
  { id: 'm_negative', subject: 'numeracy', strand: 'n_number', label: 'Uses negative numbers', prerequisites: [] },
  // Band 5 — algebra, geometry, statistics
  { id: 'm_linear', subject: 'numeracy', strand: 'n_ops', label: 'Solves linear equations', prerequisites: [] },
  { id: 'm_coordinate', subject: 'numeracy', strand: 'n_geometry', label: 'Plots coordinates', prerequisites: [] },
  { id: 'm_stats', subject: 'numeracy', strand: 'n_data', label: 'Finds mean & median', prerequisites: [] },
];

// Science scales sensory exploration -> classification -> experiments &
// hypotheses -> discipline-specific concepts across the five bands.
const SCIENCE_COMPETENCIES: readonly Competency[] = [
  // Band 1
  { id: 'sci_senses', subject: 'science', strand: 'sci_observe', label: 'Uses the five senses', prerequisites: [] },
  { id: 'sci_living', subject: 'science', strand: 'sci_observe', label: 'Sorts living & non-living', prerequisites: [] },
  // Band 2
  { id: 'sci_animals', subject: 'science', strand: 'sci_observe', label: 'Groups animals & plants', prerequisites: [] },
  { id: 'sci_materials', subject: 'science', strand: 'sci_observe', label: 'Describes materials', prerequisites: [] },
  // Band 3
  { id: 'sci_states', subject: 'science', strand: 'sci_inquiry', label: 'Knows states of matter', prerequisites: [] },
  { id: 'sci_lifecycle', subject: 'science', strand: 'sci_observe', label: 'Understands life cycles', prerequisites: [] },
  { id: 'sci_method', subject: 'science', strand: 'sci_inquiry', label: "Follows an experiment's steps", prerequisites: [] },
  // Band 4
  { id: 'sci_hypothesis', subject: 'science', strand: 'sci_inquiry', label: 'Forms & tests a hypothesis', prerequisites: [] },
  { id: 'sci_forces', subject: 'science', strand: 'sci_inquiry', label: 'Understands forces & energy', prerequisites: [] },
  { id: 'sci_body', subject: 'science', strand: 'sci_observe', label: 'Knows human body systems', prerequisites: [] },
  // Band 5
  { id: 'sci_cells', subject: 'science', strand: 'sci_observe', label: 'Understands cells', prerequisites: [] },
  { id: 'sci_atoms', subject: 'science', strand: 'sci_inquiry', label: 'Understands atoms & matter', prerequisites: [] },
  { id: 'sci_energy', subject: 'science', strand: 'sci_inquiry', label: 'Understands energy & ecosystems', prerequisites: [] },
];

// Logic & problem solving: pattern puzzles -> sequencing -> deduction &
// analogies -> multi-step & conditional reasoning -> argument analysis.
const LOGIC_COMPETENCIES: readonly Competency[] = [
  // Band 1
  { id: 'l_pattern1', subject: 'logic', strand: 'l_pattern', label: 'Continues a pattern', prerequisites: [] },
  { id: 'l_sort', subject: 'logic', strand: 'l_reason', label: 'Sorts and finds what does not belong', prerequisites: [] },
  // Band 2
  { id: 'l_sequence', subject: 'logic', strand: 'l_pattern', label: 'Finds the next in a sequence', prerequisites: [] },
  { id: 'l_oddone', subject: 'logic', strand: 'l_reason', label: 'Finds the odd one out', prerequisites: [] },
  // Band 3
  { id: 'l_analogy', subject: 'logic', strand: 'l_reason', label: 'Completes analogies', prerequisites: [] },
  { id: 'l_deduce', subject: 'logic', strand: 'l_reason', label: 'Uses clues to deduce', prerequisites: [] },
  // Band 4
  { id: 'l_multistep', subject: 'logic', strand: 'l_reason', label: 'Solves multi-step problems', prerequisites: [] },
  { id: 'l_conditional', subject: 'logic', strand: 'l_reason', label: 'Reasons with all / some / if-then', prerequisites: [] },
  // Band 5
  { id: 'l_argument', subject: 'logic', strand: 'l_reason', label: 'Judges if a conclusion follows', prerequisites: [] },
  { id: 'l_fallacy', subject: 'logic', strand: 'l_reason', label: 'Spots flaws in reasoning', prerequisites: [] },
];

// Social studies: family & community -> maps & geography -> history & timelines
// -> government, economy & civics -> analysing events & global citizenship.
const SOCIAL_COMPETENCIES: readonly Competency[] = [
  // Band 1
  { id: 'soc_helpers', subject: 'social', strand: 'soc_community', label: 'Knows community helpers', prerequisites: [] },
  // Band 2
  { id: 'soc_map', subject: 'social', strand: 'soc_world', label: 'Reads a simple map', prerequisites: [] },
  { id: 'soc_rules', subject: 'social', strand: 'soc_community', label: 'Knows community rules & jobs', prerequisites: [] },
  // Band 3
  { id: 'soc_geography', subject: 'social', strand: 'soc_world', label: 'Knows Ghana & the world', prerequisites: [] },
  { id: 'soc_past', subject: 'social', strand: 'soc_history', label: 'Understands the past & timelines', prerequisites: [] },
  // Band 4
  { id: 'soc_civics', subject: 'social', strand: 'soc_civics', label: 'Understands government & rights', prerequisites: [] },
  { id: 'soc_economy', subject: 'social', strand: 'soc_civics', label: 'Understands needs, wants & trade', prerequisites: [] },
  // Band 5
  { id: 'soc_analysis', subject: 'social', strand: 'soc_history', label: 'Analyses causes & effects', prerequisites: [] },
  { id: 'soc_global', subject: 'social', strand: 'soc_civics', label: 'Understands global citizenship', prerequisites: [] },
];

export const COMPETENCIES: readonly Competency[] = [
  ...READING_COMPETENCIES,
  ...WRITING_COMPETENCIES,
  ...NUMERACY_COMPETENCIES,
  ...SCIENCE_COMPETENCIES,
  ...LOGIC_COMPETENCIES,
  ...SOCIAL_COMPETENCIES,
  ...DIGITAL_COMPETENCIES,
];

const COMPETENCY_BY_ID: ReadonlyMap<string, Competency> = new Map(
  COMPETENCIES.map((c) => [c.id, c]),
);

export function getCompetency(id: string): Competency {
  const competency = COMPETENCY_BY_ID.get(id);
  if (!competency) throw new Error(`Unknown competency: ${id}`);
  return competency;
}

export function isCompetencyId(id: string): boolean {
  return COMPETENCY_BY_ID.has(id);
}

export function competenciesForSubject(subject: SubjectId): readonly Competency[] {
  return COMPETENCIES.filter((c) => c.subject === subject);
}

export function competenciesForStrand(strandId: string): readonly Competency[] {
  return COMPETENCIES.filter((c) => c.strand === strandId);
}
