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

## 1a. Developmental bands, tracks & the difficulty ladder

**Five bands** span ages ~4–16 (`data/db.ts` `Band = 1..5`): 1 Early childhood
(4–6) · 2 Early elementary (6–8) · 3 Upper elementary (8–11) · 4 Middle school
(11–14) · 5 Early high school (14–16). Grade seeds the starting band
(`learner/placement.ts`), then mastery adapts it.

**Tracks (subjects)** — `data/subjects.ts`: reading, writing, numeracy, science,
digital, logic, social ("My world"), sel ("Feelings & friends"), arts. Each has
a **strand** taxonomy (`data/strands.ts`) aligned to the framework (e.g. reading
→ print / comprehension / vocabulary; numeracy → number / operations / geometry /
data; digital → use / care / coding / safety). Competencies + lessons are
authored onto this skeleton.

**Difficulty scales on several axes at once** (`data/difficulty.ts`), not one
number:
- **Bloom's cognitive level** (recall → apply → analyze → create) is the spine;
  `item.bloom` carries it, `defaultBloomForBand` sets the band expectation.
- **Fine-grained `difficulty` 1–5** within a band breaks ties (`difficultyScore`).
- Scaffolding, step count, and text/number load grow with the band in content.

**Mastery gates, not age locks.** A skill is mastered at ~80% accuracy over
enough recent attempts (`data/mastery.ts`); a learner advances when the gate is
met, can accelerate, or repeat. **Spaced repetition** (`sequencing/review.ts`, a
Leitner scheduler) resurfaces mastered facts/vocabulary so they stick.

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
  done / available / locked; a lesson unlocks once its prerequisites are
  mastered. Gating is **band-aware**: a lesson is only locked behind
  prerequisites that are themselves taught at the learner's band, so a learner
  placed at a higher band (assumed to have the foundations) is never stranded.
  The journey map renders these states.

---

## 4. Engagement: the village world (offline) — DONE

- **Per-learner progress state** *(Dexie v3 `learnerProgress`)* — XP, spendable
  **stars**, lifetime stars, lessons completed, skills mastered, **streak**,
  last-active day.
- **Awards/badges** *(`gamification/badges.ts` + `awards` table)* — First Steps,
  Sharp Mind, On a Roll (3-day streak), Star Gatherer, Rising Star. Awarded the
  first time a rule qualifies; idempotent.
- **Grow-a-village** *(`gamification/village.ts` + `inventory` table)* — stars
  buy **cosmetic-only** pieces (shea tree, hut, well, goat, market…). Calm,
  collectible, entirely on-device.
- **Reward store** — the Village screen shows the village scene plus a "Star
  shop"; the reward screen reports stars/XP/streak/new badges after each
  activity. Pure maths in `gamification/economy.ts`; Dexie service in
  `gamification/progress.ts`.

The Guide character (`pedagogy/`) narrates and celebrates throughout.

---

## 5. Reporting

The facilitator dashboard and funder export are computed from the attempt log:
mastery % and accuracy per skill, time-on-task, streak, last-seen, and
**per-strand** roll-ups, with the existing learners × competencies grid as the
at-a-glance view.

**Funder export (DONE)** — `data/export.ts` collects every learner's mastery,
accuracy, time-on-task, streak, stars/XP, and badges into a **CSV** (wide grid:
a 1/0 column per competency + summary metrics) and a full **JSON** snapshot.
Serialisation is pure and unit-tested (`exportModel.ts`); the facilitator
downloads it with `ui/download.ts` — a Blob + anchor click, no network, no
popup, so it works over file:// and in a sandbox where allowed.

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
5. **Village gamification** *(DONE)* — XP / streak / badges + the village world +
   reward store.
6. **i18n + audio** *(infrastructure DONE)* — `i18n/` message catalogue (English
   complete) + `useT`, wired through the core UI; `audio/` synthesised earcons
   (correct/wrong/reward/pop via Web Audio — no asset files, fully offline) with
   a mute toggle. **Still needed from the field:** real translations for the
   target language(s) and recorded voice narration (the `audio/voice.ts` clip
   path is reserved for these).

---

## 6a. Data sharing & sync (the adapter seam)

Each device stores its data in IndexedDB. Sharing that data across the hub's
tablets is pulled behind a small seam so the transport can be chosen later
without rewriting features:

- `data/backup.ts` — `snapshotHubData()` (serialise the device's syncable
  records) and `mergeHubData()` (idempotent merge: learners upserted, competency
  events unioned keeping the earliest, progress last-writer-wins,
  awards/inventory unioned). File export/import are thin wrappers over these.
- `data/sync/` — `SyncAdapter` (`pull()` / `push()`), a `runSync(adapter)`
  engine (pull → merge → snapshot → push; converges every device to the same
  data because the merge is idempotent and order-independent), and a
  `MemorySyncAdapter` reference/test implementation.

**What ships now:** file-based transfer (facilitator export → import via USB),
which is the manual form of the same primitive. **What plugs in later, with no
feature rewrite:**
- a **Kolibri adapter** — store/read the snapshot via Kolibri's per-user state
  channel and let Kolibri's device-to-device + Data Portal sync carry it (the
  app is built to run as a Kolibri HTML5App); or
- a **LAN adapter** — push/pull to a hub device over the local network.

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
