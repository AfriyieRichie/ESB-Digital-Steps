# ESB Digital Steps

Offline, gamified learning software for children (~4–15) in rural community
learning hubs. It teaches foundational skills — **reading, writing, numeracy,
and digital literacy** — as games that meet each child at their level and grow
with their grade (Teaching at the Right Level). Every skill a child demonstrates
is recorded against a competency framework so facilitators and funders can see
real, per-child progress. **The data is ours** and lives on the device.

> Status: foundation slice. The architecture is subject-agnostic across all four
> subjects; the first concrete, playable activity is the digital-literacy "Tap".
> Reading / writing / numeracy and the other activity types are stubbed and
> ready to fill (see "What's stubbed" below).

## Non-negotiable constraints (read before adding anything)

1. **Fully offline at runtime.** No network calls, no CDN fonts/scripts/assets.
   Everything is bundled locally.
2. **Runs from a static folder.** Production build is a plain folder with
   `index.html` at the root, openable from a USB stick / `file://`, using
   **relative asset paths only**. Vite is configured with `base: './'`.
3. **Kolibri-droppable later.** The same `dist/` must be able to become a
   Kolibri HTML5App (ZIP of HTML/CSS/JS in a sandboxed iframe: no popups, no
   `alert`, relative paths). Don't break this; we don't build the packaging yet.
4. **No runtime server, no backend API, no remote DB.** All data is on-device
   (IndexedDB via Dexie).
5. **Touch + mouse/keyboard.** Use Pointer Events; provide an on-screen keyboard
   for typing activities (tablets may have no physical keyboard).
6. **Low-spec friendly.** Light bundle, avoid heavy dependencies.
7. **Child privacy.** Store only a first name + learning data. No accounts, no
   contact/personal data, no analytics that leave the device.
8. **Accessibility floor.** Large touch targets, visible keyboard focus,
   sufficient contrast, `prefers-reduced-motion` respected.

## Stack (decided — do not re-litigate)

- **TypeScript** (`strict`) + **React** + **Vite**.
- **Dexie** (IndexedDB) for all stored data — versioned schema + migrations.
  **Never use `localStorage` for the data layer.**
- **Zustand** for app/UI state.
- **Zod** to validate all lesson/content JSON at load time.
- **Vitest** for logic tests (data layer, scoring, sequencing) — no UI snapshots.
- **Plain CSS** with custom-property design tokens in `src/ui/tokens.css`.
  No Tailwind, no CSS framework. Components reference tokens, never raw hex.
- Audio = bundled local files referenced by relative path.

## Commands

```bash
npm install      # install deps
npm run dev      # local dev server
npm run build    # type-check + production build -> dist/ (relative paths)
npm run preview  # preview the production build
npm test         # run Vitest logic tests
npm run typecheck
```

`dist/` is designed to run by opening `dist/index.html` directly (file://).

## Architecture map

**Content vs stored data:** content (subjects, strands, skills, lessons, items)
is bundled + Zod-validated and lives in `src/data/*` registries and
`src/content/`. **Stored data** (what a child did) lives in Dexie only. See
`docs/CONTENT-ARCHITECTURE.md` for the full model, mastery/progression plan, and
build order.

- `src/data/` — competency framework + the content registries it anchors.
  - `subjects.ts` — the four subjects (reading, writing, numeracy, digital).
  - `strands.ts` — topics within a subject (Subject → Strand → Skill).
  - `competencies.ts` — the skill/competency framework; each references a strand.
  - `db.ts` — Dexie schema + migrations + first-run seed (hub + learners). **The
    single source of truth for stored (on-device) data.**
  - `events.ts` — record (idempotent) + query competency events.
  - `attempts.ts` — the attempt log + per-skill/learner stats (accuracy, time).
  - `mastery.ts` — derives mastery from attempts; writes the CompetencyEvent
    milestone once a skill is mastered. Activities feed it via `onAttempt`.
  - `export.ts` / `exportModel.ts` — funder-facing export: collects live Dexie
    data into a CSV + JSON bundle (pure model is unit-tested), downloaded via
    `ui/download.ts` with no network.
- `src/content/` — lesson JSON per subject, validated by `schema.ts` (Zod).
  A lesson lists `skills` and ordered `steps`; each step is one activity +
  config. Item schemas (`chooseItem`, `typeItem`) are defined ready for their
  activities.
- `src/activities/` — `engine.types.ts` (the Activity contract) + one folder per
  activity type. `Tap/`, `Choose/`, `Type/` (with `ui/OnScreenKeyboard`), and
  `Drag/` (Pointer-Events drag-to-target), `Match/` (tap-to-pair), and `Order/`
  (build-the-word) are built. Lessons span bands 1–3 across all four subjects
  (digital, numeracy, reading, writing).
- `src/audio/` — synthesised earcons (`sounds.ts`, Web Audio, no asset files) +
  a session mute store, and `voice.ts`: on-device English narration (Web Speech)
  that reads prompts aloud for pre-readers (emoji-stripped, mute-aware,
  best-effort). Recorded clips can replace it behind the same `speak()` later.
- `src/i18n/` — message catalogue (English complete) + `useT`; locales fall back
  to English so partial translations ship safely.
- `src/sequencing/` — `progression.ts`: pure logic for lesson ordering,
  unlock-on-mastery gating, and band-placement readiness (TaRL).
- `src/learner/` — no-login learner selection + current-learner store.
- `src/pedagogy/` — guide character, feedback, reward screen.
- `src/gamification/` — stars/XP/streak (`economy.ts`, pure), badges + village
  catalogs, the Dexie `progress.ts` service (rewards, idempotent badges, village
  purchases). The grow-a-village reward world; cosmetic-only, on-device.
- `src/app/` — shell + state-driven screen routing (no router library).
- `src/facilitator/` — read-only learners × competencies dashboard (live Dexie).
- `src/ui/` — shared components + `tokens.css` (design tokens).
- `tests/` — Vitest logic tests.

## Conventions

- TS `strict`; no `any` without an inline comment justifying it.
- Adding a new activity type = implement `engine.types.ts` contract in its own
  folder + register it; no plumbing changes elsewhere.
- All content loads through Zod; a malformed lesson must **throw a clear error**,
  not render a blank screen.
- Competency recording is **idempotent**: unique per `(learnerId, competencyId)`.
