# DEVELOPMENT.md — module ownership & contracts

## Layers
```
React screens ──calls──▶ state/Game (engine façade) ──uses──▶ state/systems/*, state/data/*, activities/*, events/*
      │                         │
      │ ActionResult {deltas,fx}│
      ▼                         │
fx/StageCanvas ──▶ fx/stage/Stage (PixiJS, presentation only; never reads game state)
```
- `state/` never imports React, DOM, Pixi or `localStorage`. The one exception is `state/save.ts`, the only file that touches storage.
- `fx/view.ts` is the only translator from game state to `StageView`.

## state/
| Module | Owns |
|---|---|
| `Game.ts` | State container. Stat/money/meter helpers with trait multipliers, skill checks, log, event queue, random event roll, turn/phase/month advance, autopilot. Returns `ActionResult` for every input. |
| `types.ts` | `GameState` and all shared unions. |
| `newGame.ts` | `blankState()` (defaults for every saved field), `createLife()`, `continueAsChild()`. |
| `save.ts` | localStorage + `hydrate()` (fills missing fields from `blankState`). |
| `activities/*` | Activity catalog by area. `ActivityDef` = data + `run(g) → text`. `panel` entries open UI instead of spending time. |
| `events/*` | Story events. `EventDef` with optional `random` spec; choices may `when` (hide) / `req` (disable with reason). |
| `data/*` | Static catalogs: careers, programs, locations + housing, traits, achievements, orgs (crime, future), names. |
| `systems/obligations.ts` | Which slots are school/work duties; records skips/attendance. |
| `systems/education.ts` | Admission odds, funding, enrol, monthly progress, warnings, graduation. |
| `systems/career.ts` | Eligibility, hiring odds, monthly pay, warnings, promotion, firing, retirement. |
| `systems/finance.ts` | Assets shop, housing, investing, debt, monthly costs, eviction, net worth. |
| `systems/relationships.ts` | Interactions, relationship decay, deaths, babies. |
| `systems/monthly.ts` | Month tick order: jail/education/career → org → finance → relationships → body → birthday → achievements. |
| `systems/world.ts` | Visible locations (hides places with no visible activities). |
| `systems/crime.ts` | Jail (`sendToJail` + `JAIL_AUDIT`), juvenile records, organisations. |
| `crime/consent.ts` | Update 0.5 hard rules: `cannotConsent()` (captive / sedated / very intoxicated / blackmailed by you), `isValidCrimeTarget()` (both 18+, dark needs the toggle), `auditTarget()` throws on minors. |
| `crime/catalog.ts` | `CRIMES` (tier, dark, person, stat, diff, heat, tags, sentence, reward, needs, guilt, sev). |
| `crime/commit.ts` | `crimeLock` → `commit()`: odds, outcome, victim state, evidence tags → crime scene (sev ≥ 3) or case. |
| `crime/evidence.ts` | Cover-up puzzle: `CLUES`, `COVER_ACTIONS`, `coverUp()`, `finishScene()`. Every `EvidenceTag` must be in some action's `resolves` (tested). |
| `crime/investigation.ts` | Detective NPC, cases, monthly police work, wanted stars, cold cases, podcast, arrest / manhunt queueing, `addDigital()`. |
| `crime/justice.ts` · `pursuit.ts` | Court (lawyers, plea, convict/acquit) · fugitive mode (`startPursuit`, net spreads each slot, flee, settle, surrender). |
| `crime/properties.ts` · `drugs.ts` · `captives.ts` · `guilt.ts` | Properties + raids · business, territory, crew, laundering · captives + blackmail (`DEMANDS`, never sexual) · guilt meter. |
| `crime/month.ts` | `underworldMonth()` — called from `systems/monthly.ts`. |
| `phone/convo.ts` · `notify.ts` · `plans.ts` | Update 0.8: NPC message kinds → contextual replies (`CONTEXT`), `answer()` (your bubble + their reaction + effect chip), monthly limit, invite expiry · badges = unread threads, banners, notes · plans + `plan_scene`. |
| `npc/mood.ts` | Upset / busy state behind replies (`setMad`, `npcState`). |
| `pipeline.ts` | Pure reducer: result card → events → banners. `PlayScreen` uses it; sessions and nights hold the queue. |
| `pc/*` · `web/*` · `games/*` | Update 0.8 computers: parts, compatibility, assembly, sessions · sites + gates (`siteVisible` / `siteLock`), Nile / Onion orders, Discorb (verification), monthly web · mini-game rules. |
| `nightlife/*` | Update 0.8 nights out: venue types and ages (`legalAge`), crowd, talk mini-game, leave-together gate (`INTOX_LIMIT`), extras and incidents. |
| `phone/chat.ts` | Update 0.5 messenger: `tabsFor` / `chipsFor` (18+ gates), `sendChip`, groups (`ensureGroups`, `groupChips` = no photos/mature), `CHAT_MATURE_AUDIT`. |

## Contracts
- **One turn = one time slot.** `doActivity` / `spendTurn` → `endPhase()`. After Night comes a new month → `newMonth()`.
- **Inputs are blocked while `s.events` is non-empty.** UI shows `events[0]`. `resolveChoice()` shifts it before running the choice, so chained events use `queue(id, ctx, true)`.
- **`choicesFor()` never returns zero enabled choices** (stale-context fallback).
- **Warnings rule:** school/work warns only when *every* duty slot that month was skipped.
- **Deltas:** every helper records into `deltas`; the engine drains them into `ActionResult`, and the UI shows them as chips plus Pixi floating text.
- **Saves:** auto-save after every result via `game.onSave`. New fields → `blankState()`.
- **An open crime scene blocks inputs** (`canAct()` is false while `underworld.scene` is set). The Evidence screen ends it with `finishScene()`; the sim does the same.
- **Every crime target goes through `isValidCrimeTarget()` and `auditTarget()`.** Every intimacy path goes through `canBeIntimate()`, which includes `!cannotConsent()`.
- **Overlays hold the queue:** `canAct()` is false during a computer session (`s.session`) or a night out (`s.night`); `PlayScreen` shows no events until they end.
- **Every mature path checks `canBeIntimate()`**, which now also requires the player under `INTOX_LIMIT`, online contacts verified, and no `noRomance` tag.
- **Queued events can go stale.** Choices must not assume `education.current`, `job` etc. still exist; guard them.

## fx/stage/
`Stage.ts` (façade) → `sky.ts`, `backdrop.ts`, `scene.ts` (recipes per `SceneKind`), `avatar.ts`, `particles.ts`, `weather.ts`, `lights.ts` (sharp + blurred glow layers), `palette.ts` (1440×860 coordinates, colours, PRNG).

## screens/
`App.tsx` routes title → create → play. `PlayScreen.tsx` is the façade: TopBar, StatsPanel, LogPanel, ActivityDock, ActionToast, EventModal, PhonePanel (tabs in `screens/phone/`), PauseMenu, DeathScreen.
