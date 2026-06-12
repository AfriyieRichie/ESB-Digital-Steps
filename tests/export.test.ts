import { beforeEach, describe, expect, it } from 'vitest';
import {
  exportFilenameBase,
  toCsv,
  toJson,
  type ExportModel,
} from '../src/data/exportModel';
import { db, ensureSeedData } from '../src/data/db';
import { recordAttempt } from '../src/data/mastery';
import { applyActivityReward } from '../src/gamification/progress';
import { collectExport } from '../src/data/export';

const model: ExportModel = {
  exportedAt: '2026-06-12T09:00:00.000Z',
  hubName: 'Community Hub 1',
  competencyIds: ['u_power', 'u_tap', 'c_share'],
  learners: [
    {
      learnerId: 'learner-ama',
      name: 'Ama',
      band: 1,
      mastered: ['u_power', 'u_tap'],
      masteredCount: 2,
      totalCompetencies: 3,
      masteryPercent: 67,
      attempts: 12,
      correct: 11,
      accuracyPercent: 92,
      timeOnTaskSeconds: 84,
      streakDays: 2,
      stars: 7,
      xp: 20,
      badges: ['first_steps', 'sharp_mind'],
    },
  ],
};

describe('export model serialisation (pure)', () => {
  it('builds a CSV with competency columns and summary metrics', () => {
    const csv = toCsv(model);
    const [header, amaRow] = csv.split('\n');

    expect(header).toBe(
      'Learner ID,Name,Band,u_power,u_tap,c_share,Mastered,Total competencies,Mastery %,Attempts,Accuracy %,Time on task (s),Streak (days),Stars,XP,Badges',
    );
    // 1/0 per competency in column order, then the summary cells.
    expect(amaRow).toBe('learner-ama,Ama,1,1,1,0,2,3,67,12,92,84,2,7,20,first_steps sharp_mind');
  });

  it('escapes commas and quotes in names', () => {
    const csv = toCsv({
      ...model,
      learners: [{ ...model.learners[0]!, name: 'Ama "AB", Jr' }],
    });
    expect(csv.split('\n')[1]).toContain('"Ama ""AB"", Jr"');
  });

  it('round-trips through JSON', () => {
    expect(JSON.parse(toJson(model))).toEqual(model);
  });

  it('derives a dated filename base', () => {
    expect(exportFilenameBase(model.exportedAt)).toBe('esb-progress-2026-06-12');
  });
});

describe('collectExport (live Dexie)', () => {
  beforeEach(async () => {
    await Promise.all([
      db.competencyEvents.clear(),
      db.attempts.clear(),
      db.learnerProgress.clear(),
      db.awards.clear(),
    ]);
    await ensureSeedData();
  });

  it('reflects a learner’s mastery, accuracy, and rewards', async () => {
    // Master u_tap for Ama via the attempt log, then bank a reward.
    for (let i = 0; i < 5; i += 1) {
      await recordAttempt('learner-ama', ['u_tap'], { correct: true, ms: 400, lessonId: 'tap' });
    }
    await applyActivityReward('learner-ama', { newlyMastered: 1 });

    const bundle = await collectExport(Date.parse('2026-06-12T09:00:00.000Z'));
    const ama = bundle.model.learners.find((l) => l.learnerId === 'learner-ama');

    expect(ama?.mastered).toContain('u_tap');
    expect(ama?.accuracyPercent).toBe(100);
    expect(ama?.stars).toBeGreaterThan(0);
    expect(bundle.filenameBase).toBe('esb-progress-2026-06-12');
    // The CSV has a header plus one row per seeded learner.
    expect(bundle.csv.split('\n').length).toBe(1 + bundle.model.learners.length);
  });
});
