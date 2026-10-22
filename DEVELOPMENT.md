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
| `npc/persona.ts`, `phone/voice.ts` | Update 0.12 personas: who can be what (`rollPersona`, `makeYandere`), how they sound and what they like. |
| `systems/yandere.ts`, `systems/stalker.ts`, `systems/shy.ts` | Yandere partner jealousy, the anonymous stalker (`s.stalker`), shy confessions (hospital / heartbroken flags). |
| `minigames/*` + `screens/mini/*` | Update 0.12 activity minigames (code, cook, write, gym): pure scoring in state; the UI sets `g.mini`, activities read it with `takeMini`. Coding activities call `codeLearn` for the clean-build / first-ship / mastery bonuses. |
| `web/hack.ts` + `screens/desktop/hack/*` | Update 0.12 Hackr (crime): `hackLock` (18+, VPN, not library), monthly `leaksFor`, `guess`, `chargeCard`, `takeWallet` (into the Bitcons wallet). |
| `fx/iso/*` | Update 0.13 isometric stage. `layout-core` (grid, types), `layout` (city, park, buildings), `outdoor`, `rooms` (+`HOMES`), `furniture` (code-drawn pieces), `scenes` (`Record<SceneKind, Builder>`), `IsoView` (Pixi build: sprites, prims, crowds, traffic, lights, disco, household, clickable contacts). Pure parts previewable with `tools/iso_dump.ts` + `tools/iso_preview.py`. Atlases: `tools/pack_iso.py`. |
| `state/minigames/themes.ts` + `state/minigames/engines/*` + `screens/mini/engines/*` | Update 0.13 activity minigames: theme table → engine; pure rules + screens; the score scales gains via `Game.playMul` (`Game.playScore` for outcome-decided activities). |
| `fx/iso/cityMap.ts` + `fx/iso/MapView.ts` + `screens/map/CityMap.tsx` | Update 0.13 clickable city map (pure layout + pins; Pixi window; React modal). |
| `ui/itemIcon.ts` + `components/ItemIcon.tsx` | Update 0.13 item art (Kenney icons, emoji fallback). |
| `state/systems/household.ts` | Who's shown on the stage: `householdOf`, `peopleAt`, `petsAtHome`. |
| `systems/bitcons.ts` + `screens/desktop/wallet/*` | Update 0.12 Bitcons wallet: `s.wallet`, monthly price (`bitconsMonth`, called from `webMonth`), buy/sell with fee, `depositUsd` (PC mining). |
| `npc/golddigger.ts` | Money gates on romance steps for gold diggers (`goldLock` / `goldPay`, checked in `interactionsFor` / `interact`). |
| `datenight/after.ts` | End-of-date asks by spark (second date / FWB / one night). |
| `startup/*` | Update 0.11 START-UP company: ideas/buildings/status data, actions (`company.ts`), the monthly tick and dividend (`month.ts`). |
| `systems/immunity.ts` | `untouchable(g)`: god mode or Diplomatic status. Jail, catches, pursuit, investigations and cancellation check it. |
| `datenight/*` | Update 0.10 dates as a scene: venues and their actions, spark, moments (`momentLock` = the hard gates), `DATE_AUDIT`. |
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
