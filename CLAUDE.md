# CLAUDE.md — How to build this game

This file tells Claude Code how to build and maintain this web game. The method comes from the Inferno Requiem project.

---

## 0. The game
- **Name:** LIFE//SIM
- **Genre / core loop:** Life simulator built on choices.
  - Each month has 4 time slots (Morning → Afternoon → Evening → Night). Pick one activity per slot at a location.
  - School and work shifts are obligations: do something else and it counts as a skip.
  - Random story events interrupt with choices and skill checks.
  - Start at 14 and age until death, then continue as your child.
  - Systems: school → degrees → careers, people, money and housing, city vs countryside.
  - Crime (gangs, mafia, police, jail) is planned for a later update.
- **Platform:** desktop web (keyboard + mouse). No mobile.
- **Art direction:**
  - A procedural PixiJS world: gradient day/night sky, skyline or rolling hills, flat-colour buildings with glowing windows and neon signs, seasons, rain and snow, and a simple animated avatar.
  - Dark glassmorphism UI panels on top (blurred navy glass, violet/cyan accents, Space Grotesk + Inter).
  - Every screen and pop-up follows it.
- **Live site:** (Netlify URL, once it exists)

---

## 1. How we work together
- **The designer (me) writes the design; Claude builds it.**
  - New content arrives as an MD spec (event, career, location, system). Follow it exactly.
  - If the spec doesn't say something, pick a sensible placeholder and list it in your reply. Don't invent big features.
  - If an MD says to delete or replace something, delete it in-game too. Don't leave old content around.
- **Ask only when blocked.** When something is unclear, choose the sensible default, say which one you chose, and keep going. Ask when the answer changes what gets built, for example a cost, a rarity or a rule.
- **My corrections are final.** When I correct a number or a rule, apply it everywhere it appears: code, in-game text, tests and patch notes.
- **Never start a localhost server, Playwright or a browser.** I run the game myself with `START_GAME.bat` and refresh my own window.
  - Check your work with type checks, tests and the build.
  - Tell me plainly what you could not see, for example "the visuals are unverified".
- **Commit only when I ask.** I push through GitHub Desktop. Never use destructive git (reset --hard, force push, deleting branches).
- **Report honestly.** If a test fails, show the output. If you skipped something, say so. Never call something "done" before the gates pass.
- **End each task with a short summary:** what changed, the main files, what I should check in-game, and any open questions.

---

## 2. Tech stack
- **Vite + React 18 + TypeScript (strict).** The game lives in `game/`.
- **GSAP** for UI animation and PixiJS tweens. **PixiJS 8** (+ pixi-filters) for the world canvas behind the DOM UI.
- **Firebase:** not used yet. If online features come, saves stay in localStorage, and localhost / dev / automated runs never write to Firebase.
- **Tests:** Vitest (`tests/vitest/`), plus plain `tsx` scripts in `tests/`. **ESLint**.
- **Media tools** (when assets arrive):
  - `ffmpeg-static` for audio and video conversion.
  - Python + PIL for converting art to `.webp`.
- **Hosting:**
  - Netlify (`netlify.toml` at the root: base `game`, `npm run build`, publish `dist`, SPA redirect). `dist/` is git-ignored.
  - The live site only changes after a fresh `npm run build` and publishing `dist/`.
- **Repo:**
  - GitHub with **Git LFS** for runtime audio/video (`.gitattributes`).
  - Node version pinned in `.nvmrc`.
  - CI workflow: add when the repo exists.

---

## 3. Folder layout

```
<project root>/
  CLAUDE.md  DEVELOPMENT.md  HANDOVER.md
  START_GAME.bat       ← starts the dev server on port 5173 and opens the browser
  ASSETS/ AUDIO/       ← raw source art/audio (staging, not shipped)
  MD/ MD_UPDATES/      ← design specs and update plans
  game/
    public/            ← converted runtime assets — the only shipped media
    src/
      state/           ← pure game rules (no React/DOM): Game engine, types, saves
        data/          ← catalogs: careers, programs, locations, traits, achievements, names, orgs
        activities/    ← one file per area: home, school, work, town, outdoors, nightlife, travel
        events/        ← story events by theme: school, work, love, life
        systems/       ← one mechanic per file: education, career, finance, relationships, monthly…
      fx/              ← PixiJS stage (fx/stage/*) + the React bridge (StageCanvas, view.ts)
      screens/         ← title, create, play, phone, death, pause, updates
      components/      ← shared UI pieces (Modal, Bar, HoldButton, DeltaChips)
      hooks/           ← useGame, useEscape
      ui/theme/        ← CSS in numbered chunks: theme-01-*.css …; ui/theme.css imports them
      ui/layout.ts     ← 1440×860 zoom helper
    tests/             ← test-<feature>.ts scripts + vitest/ suite + sim.ts life simulator
    verify.mjs         ← the gate script
```

Source assets are staged in the root folders. Look there before you say an asset is missing. Convert them into `public/`; never ship the raw files.

---

## 4. Code rules
- **Small, focused modules.**
  - One mechanic, one file.
  - Never grow a big file. `Game.ts`, `App.tsx`, `PlayScreen.tsx` and `Stage.ts` are façades that wire modules together.
  - When a file gets large, split it by responsibility.
- **Rules stay pure.** Game rules live in `state/` as plain TypeScript with no React, DOM or Firebase. UI calls them. That is what makes them testable.
- **Data-driven content.**
  - Activities, events, careers, programs and locations are data entries.
  - Adding content should mostly mean adding data plus, at most, one small system module.
- **One source of truth.**
  - Stat changes go through `Game.stat()` / `money()` / `meter()`; checks go through `Game.check()` / `statOdds()`.
  - Use typed union kinds with `Record<Kind, …>` maps, so the compiler forces every new kind to be registered everywhere.
- **Text matches code.** When numbers change, update the player-facing text in the same change.
- **Saves:**
  - Every new saved field must get a default in `blankState()` (state/newGame.ts) so `hydrate()` fills it for old saves.
  - Write a save migration when you rename or move content.
- **Mechanical refactors don't change behavior:** same results, same random-number order, same event order.
- **Comments are short.** Say why, and tag the update that added it ("Update 0.2 — …").

---

## 5. UI and CSS rules
- **Desktop canvas:** design for 1440×860. The whole frame is CSS-`zoom`ed to fill the window (`ui/layout.ts`).
  - Never use raw `vh`/`vw`; use `var(--vh)`/`var(--dvh)`/`var(--vw)`.
  - The Pixi stage uses the same 1440×860 coordinates (`fx/stage/palette.ts`).
- **CSS:**
  - CSS goes in numbered theme chunks. Each chunk must parse on its own.
  - Add a new chunk for a new feature instead of growing an old one.
- **Grep before naming a CSS class.**
  - Prefix by feature (`top-`, `sts-`, `dck-`, `evt-`, `ph-`, `crt-`…).
  - Never use "ad" in class names, because ad blockers hide them.
- **No visible scrollbars.** Pop-ups fit between the top bar and bottom dock (`max-height: calc(100 * var(--dvh) - 230px)`).
- **No text over character art.** Effects never cover art. Art is never cropped.
- **Hold-to-confirm** (`HoldButton`) for big costs, quitting and other drastic actions. Show the price on the button.
- **Player-facing text is terse.**
  - This covers activity descriptions, event choices, tooltips and patch notes.
  - State the effect in a few words.
- **Keyboard:** Esc = Pause / close pop-up (innermost first, via `useEscape`).

---

## 6. Assets pipeline
- **Art:** use the PNG/JPG from `ASSETS/` → `.webp` with PIL. Use transparent backgrounds where the art has them.
- **Audio:** WAV/MP3 → mp3 at 160 kbps with ffmpeg.
- **Video:** mp4 (H.264).
- **Check every path directly.** Before using an asset, `ls` the folder and confirm the exact file.
- After adding or removing files in `public/`, `git add` the media so LFS tracks it.

---

## 7. Quality gates (run before saying "done")
- `npm run verify:quick` while working: type check + feature tests.
- `npm run verify` before finishing: type check, all test scripts, lint, the Vitest suite and the production build.
- **Every feature gets a test:** `tests/test-<feature>.ts`, a small script that checks the pure rules with clear ✅ / ❌ messages.
  - Bug fixes get a regression check.
  - `tests/test-engine.ts` simulates whole lives with random legal input; keep it passing.
- **Goldens / snapshots:** never regenerate them to make a test pass. Only regenerate after a deliberate change, and say so.
- **Known-failing tests** go in one file (`tests/knownDrift.ts`) and are marked as expected failures. Don't "fix" them silently.

---

## 8. Patches and content updates
- **Each update has a version and name** ("Update 0.1 — First Breath") and its own patch-notes component in `screens/updates/`.
  - The notes are short section cards with an emoji, a title and 1–4 bullet lines.
- **Add a patch-note line in the same change as the feature.**
- **New activity checklist:**
  - entry in the right `state/activities/*.ts`;
  - category colour exists in `theme-03-dock.css`;
  - a test if it has rules beyond stat changes.
- **New event checklist:**
  - entry in `state/events/*.ts` (random spec or queued by a system);
  - every choice ends in a state change or text;
  - covered by the life simulator.
- **New scene/location checklist:**
  - `SceneKind` union;
  - recipe in `fx/stage/scene.ts`;
  - `LOCATIONS` entry;
  - at least one activity (empty locations stay hidden).
- **Discord announcement:** a webhook JSON in `webhook_patchnotes/` (one message, at most 10 embeds and 6,000 characters in total, field values at most 1,024 characters).

---

## 9. Memory and handover
- Keep **`DEVELOPMENT.md`** current: which module owns what, and the contracts between them.
- Keep **`HANDOVER.md`** current at the end of a big session:
  - the current patch and what's in it;
  - open questions waiting on me;
  - known bugs;
  - how to publish;
  - a key code map.
- Save lasting rules and my corrections to Claude Code memory (one fact per file, with the reason), so the next session follows them.

---

## 10. Lessons learned (don't repeat these)
- A stale `dist/` made fixes look broken on the live site. Rebuild before publishing.
- A new save field that wasn't in the loader made upgrades "not stick".
- A generic CSS class broke displays in other screens. Grep first and use feature prefixes.
- Asset paths reported by research or memory were wrong. Always `ls` the real folder.
- Shell heredocs with quotes or backslashes broke edit scripts (it happened again in this project). Write files with the file tool, or write the script to a file first; on Windows, use `C:/...` paths.
- Many files are CRLF. Edit scripts must handle line endings and assert each anchor is unique.
- Browsers only allow full screen after a click or key press. Request it on the first input.
- LIFE//SIM: high school only has 2 class slots a month, so "3+ skips" warnings could never trigger. Thresholds must fit the slot count: a warning means you attended zero slots that month.
- LIFE//SIM: tests that always pick choice #0 can loop forever when that choice is disabled (e.g. "Needs proof of income"). Use `resolveAll()` from `tests/harness.ts`.
- LIFE//SIM: React's lint rule treats any function named `use…` (`use()`, `useItem()`) as a hook. It happened twice. Name game helpers `consume`, `spendItem`, etc.
- LIFE//SIM: inside a JavaScript template literal, `\b` is a backspace character. Write `\\b` for a regex word boundary.
- LIFE//SIM: queued events can go stale (fired before a promotion resolves). `choicesFor()` falls back to "Continue" so the game never soft-locks.
- LIFE//SIM: stale events also crash when a choice uses `g.s.education.current!` after juvie or expulsion. Never use `!` on optional state (`education.current`, `job`, `partner`) inside an event choice; it happened three times.
- LIFE//SIM: `scrollIntoView()` also scrolls the zoomed `.app-frame` (overflow hidden), which slides the UI away and shows a black screen. Set `scrollTop` on the list itself instead. `.app-frame` now uses `overflow: clip` as a guard.
- LIFE//SIM: canvas mini-games restart mid-run if a parent re-render hands them a new `onEnd`. Keep callbacks in a ref and start the loop only on mount/start.
- LIFE//SIM: coverage checks over random play ("was X exercised?") flake when X is rare. Give the test a focused strategy for X instead of hoping random play reaches it.
- A Python patch script that applies several anchors can half-apply when a later anchor is stale. Assert every anchor before writing anything, or split the script, then check the file before re-running it.
