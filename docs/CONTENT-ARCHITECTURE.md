# Content & Learning Architecture

How ESB Digital Steps organises *what* children learn and *how* the software
delivers, adapts, motivates, and reports on it. This is the shared reference for
the content model and the infrastructure beneath it.

It is informed by a review of established children's learning software
(Khan Academy Kids, Duolingo / Duolingo ABC, Prodigy, ABCmouse and other
Wirecutter picks; Night Zookeeper; AdaptedMind) and adapted to our
non-negotiables: **fully offline, single-folder, on-device data, low-spec,
TaRL** (see `CLAUDE.md`).

---

## 1. What we took from existing software

| Pattern (seen across the references) | How we apply it |
| --- | --- |
| Deep content hierarchy: *Subject → Topic/Strand → Skill → Lesson → Item* | We adopt the same spine. **Skill = our competency** (the funder-facing unit). |
| Mastery by repetition + review, not one-and-done (AdaptedMind, Prodigy) | We log **every attempt** and *derive* mastery; a `CompetencyEvent` is written once mastery is earned. Light spaced review. |
| A visible progression **path** with placement + unlock (all) | Per `(subject, band)` ordered lessons; placement at the right level (TaRL); unlock-on-mastery. |
| **Item bank** separate from the interaction (AdaptedMind) | Activities are generic engines that render **items** (data). New content = new JSON, no new code. |
| One strong **narrative world** + collectibles (Night Zookeeper) | A *grow-a-village/garden* world: earn stars → place huts, trees, animals. Offline, cosmetic-only. |
| Short, low-stakes sessions, instant feedback, friendly guide | Lessons are 3–7 min; encourage over fail; the Guide character speaks. |
| Parent/teacher dashboards from the activity log | Facilitator dashboard: mastery %, accuracy, time-on-task, streak, per-strand. |

---

## 2. The content model

```
Subject        reading · writing · numeracy · digital
 └─ Strand     a topic within a subject (e.g. Numeracy → "Counting")
     └─ Skill  the atomic, reportable unit  ==  Competency
         └─ Lesson   a short session (3–7 min) targeting one or a few skills
             └─ Step  one interaction, by activity type (tap / choose / type …)
                 └─ Item   one question / target + its answer data
```

- **Subject** — `data/subjects.ts`. The four foundations.
- **Strand** — `data/strands.ts`. A subject's topics. Digital starts with
  *Using the device* and *Care & responsibility*.
- **Skill / Competency** — `data/competencies.ts`. Each references a `strand`
  and may list `prerequisites`. This is what the funder report counts.
- **Lesson** — `content/<subject>/…json`, validated by `content/schema.ts`.
  A lesson lists the `skills` it covers and an ordered list of `steps`.
- **Step** — one activity instance: `{ activityType, config }`. The config is
  the activity-specific payload (for `tap`, `{ count }`; for item-based
  activities, `{ items: [...] }`).
- **Item** — one unit of content an activity renders (a prompt + choices +
  answer, etc.). Lives inside a step's config (and, later, in shared item
  banks). Item **schemas** are defined now (`chooseItem`, `typeItem`) and ready
  for the activities that consume them.

### Content vs. stored data — a deliberate split

> **Content** (subjects, strands, skills, lessons, items) is **bundled and
> Zod-validated**, never in Dexie. **Stored data** (what a child did) lives in
> **Dexie** only.

This matters because:
- Content must ship **inside the offline bundle** (no fetch, works from a USB
  stick / Kolibri iframe). Putting it in Dexie would mean seeding content into
  every device's database for no benefit.
- Dexie stays exactly what the funders own: **the record of each child's
  learning** — learners, attempts, mastery, sessions. Small, portable, ours.

So "Content model v2" expands the **content** layer. The Dexie schema gains the
**state** tables (`Attempt`, `LearnerProgress`, …) in the next slice, where they
are actually used.

---

## 3. Mastery & progression (infrastructure)

- **Attempt log** *(slice #2 — DONE, Dexie v2)* — one row per item/action
  attempt: `{ learnerId, skillId, lessonId, itemId?, correct, ms, at }`
  (`data/attempts.ts`). The raw evidence; an action fans out into one row per
  skill it evidences.
- **Derived mastery** *(slice #2 — DONE)* — `data/mastery.ts`: a skill is
  *mastered* at ≥ `MASTERY_ACCURACY` (0.8) over ≥ `MASTERY_MIN_ATTEMPTS` (4)
  attempts. Crossing the threshold writes the idempotent `CompetencyEvent` — our
  milestone, now *earned by evidence* rather than a single tap. Activities report
  evidence via the `onAttempt` contract; `ActivityScreen` logs it and counts
  newly-mastered skills for the reward. The facilitator view shows mastery %,
  accuracy, and time-on-task. *Light spaced review is still to come.*
- **Placement + adaptive band** *(slice #4 — DONE)* — initial placement is the
  seeded band; `readyForNextBand` flags when a learner has mastered every lesson
  at their band (TaRL) and surfaces a "ready for Level N+1" banner.
- **Progression path** *(slice #4 — DONE)* — `sequencing/progression.ts` (pure,
  unit-tested) orders each band's lessons into per-subject tracks and marks each
  done / available / locked; a lesson unlocks once its skills' prerequisites are
  mastered. The journey map renders these states.

---

## 4. Engagement: the village world (offline)

- **Per-learner progress state** *(slice #5 — Dexie)* — XP, stars, **streak**,
  last-active.
- **Awards/badges** — milestones (first lesson, strand complete, 5-day streak).
- **Grow-a-village** — stars buy **cosmetic-only** village pieces (huts, trees,
  animals, a market). Locally relevant, calm, collectible; entirely on-device.
- **Reward store** — spend stars on village pieces and avatar cosmetics.

The Guide character (`pedagogy/`) narrates and celebrates throughout.

---

## 5. Reporting

The facilitator dashboard and funder export are computed from the attempt log:
mastery % and accuracy per skill, time-on-task, streak, last-seen, and
**per-strand** roll-ups, with the existing learners × competencies grid as the
at-a-glance view.

---

## 6. Build order (each slice ships on its own)

1. **Content model v2** *(DONE)* — Strand + Lesson-with-steps + Item in the
   Zod content layer; migrate the Tap lesson; step runner. No Dexie change.
2. **Attempt log + derived mastery** *(DONE)* — Dexie v2 (`Attempt`); mastery
   service; dashboard shows accuracy / mastery % / time-on-task.
3. **More activity types** consuming items — **Choose + Type (with on-screen
   keyboard) DONE**, with the first real numeracy (count), reading (type the
   letter), and digital (parts) lessons; Drag and Match still to come.
4. **Progression engine** *(DONE)* — placement, path map, unlock-on-mastery.
5. **Village gamification** — XP / streak / badges + the village world + reward
   store.
6. **i18n + audio** — local message and audio bundles per locale.

---

## 7. Adding content (the authoring contract)

To add a lesson, drop a JSON file under `content/<subject>/` and ensure:
- `subject` and `strand` exist and the strand belongs to the subject;
- every id in `skills` exists in the competency framework;
- each `step.activityType` has a registered activity, and its `config` matches
  that activity's schema.

A malformed lesson **throws a clear, lesson-identifying error at load** — it
never renders a blank screen. Adding a new **activity type** = add its step
variant to `content/schema.ts`, implement the `activities/engine.types.ts`
contract in its own folder, and register it in `activities/registry.ts`.
Nothing else changes.
