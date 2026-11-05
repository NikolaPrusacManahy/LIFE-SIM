# LIFE//SIM

LIFE//SIM is a choice-driven life simulator for the desktop browser. You start a life at 14, make one decision per time slot, and live with the consequences until your character dies. The story then continues as one of your children.

The game is in active development. The current build is 0.14 (in progress).

---

## The game

### Core loop

- Each in-game month has four time slots: morning, afternoon, evening and night.
- In each slot you travel to a location and choose one activity.
- School classes and work shifts are obligations. Doing something else in those slots counts as a skip and has consequences.
- Random story events interrupt with choices and skill checks.
- When your character dies, you can continue as one of their children.

### Systems

| Area | What it covers |
|---|---|
| Education | High school, community college, university, graduate school, trade school and the police academy |
| Careers | Applications, shifts, performance, promotions and firing |
| People | Procedurally generated NPCs with traits, personas, relationship meters, memories and a relationship web |
| Messaging | A phone with contextual text conversations, plans and invitations, notifications and group chats |
| Dating | Dates as playable scenes, a dating app, nightlife venues, relationships and marriage |
| Money and housing | Rent, ownership, assets, a bank, investments and a cryptocurrency wallet |
| Business | START-UP, a company simulation that pays dividends to your character |
| Computer | A simulated desktop with parody websites, games, PC building and desktop applications |
| Crime | Petty and organised crime, investigations, police pursuit, courts and prison |
| World | City and countryside regions, seasons, weather, and United States or European Union rule sets |
| Minigames | Most activities open a short minigame whose score shapes the result; every minigame can be skipped |

### Presentation

- The world is rendered with PixiJS. Each location is an isometric scene with traffic, pedestrians, day and night lighting and seasonal changes.
- The interface is a set of panels around a fixed stage window.
- The game targets desktop browsers with keyboard and mouse. The layout is designed for 1440 x 860 and scales to fit the window.

---

## Content rules

These rules are enforced in code and covered by tests.

- **Age confirmation.** The game asks for an 18+ confirmation on first launch. Mature Content and Dark Crime are locked without it.
- **Mature Content.** It is off by default. When it is on, adult relationship content stays non-explicit and fades to black.
- **Romance stays within age bands.**
  - Adults can only have romance with adults.
  - Teenagers can only have romance with teenagers within two years of their own age.
  - Romance never crosses the 18 line.
- **Intimacy is adults only.** It requires both characters to be 18 or older, Mature Content to be on, and both characters able to consent.
- **Minors are never targets of crime.**
- **Family members, teachers and professors are never romance-eligible.**
- **Dark Crime.** It is off by default. It gates the most serious crime content, such as murder and kidnapping.
- **Online contacts are unverified.** People met online can misstate their age. Romance with an online contact requires meeting in person and a verified adult age.
- **Legal ages follow the active rule set.** Drinking, driving and gambling ages come from the United States or European Union rules chosen for that life.
- **Parody only.** Websites, brands and companies in the game are fictional parodies. No real people are depicted.

---

## Technology

| Purpose | Tool |
|---|---|
| Build and dev server | Vite |
| Interface | React 18 |
| Language | TypeScript (strict mode) |
| World rendering | PixiJS 8, pixi-filters |
| Animation | GSAP |
| Character portraits | DiceBear (Avataaars style) |
| Tests | Vitest and standalone `tsx` test scripts |
| Linting | ESLint |
| Asset processing | Python with Pillow |
| Hosting | Netlify |

Saves are stored in the browser's `localStorage`. There is no server component.

---

## Getting started

### Requirements

- Node.js, version as pinned in `.nvmrc`
- npm
- Python 3 with Pillow (only needed to rebuild the art atlases)

### Run locally

On Windows, double-click `START_GAME.bat` in the repository root. It installs dependencies on first run, starts the development server on port 5173 and opens the browser.

Manually:

```
cd game
npm install
npm run dev
```

Then open `http://localhost:5173`.

### Build

```
cd game
npm run build
```

The production build is written to `game/dist/`.

---

## Quality gates

All checks run through `game/verify.mjs`.

| Command | What it runs |
|---|---|
| `npm run verify:quick` | Type check and all feature test scripts |
| `npm run verify` | Type check, all feature test scripts, lint, the Vitest suite and the production build |

- Every feature has a test script in `game/tests/test-<feature>.ts` that checks its rules and prints a pass or fail line for each check.
- Bug fixes include a regression check.
- The Vitest suite in `game/tests/vitest/` simulates complete lives with random legal choices, to confirm the game never soft-locks and every life ends.
- A change is not complete until `npm run verify` passes.

---

## Project structure

```
LIFE-SIM/
  README.md
  CLAUDE.md              Build and contribution rules
  DEVELOPMENT.md         Module ownership and the contracts between modules
  HANDOVER.md            Current state, open questions and known issues
  START_GAME.bat         Starts the development server
  ASSETS/  AUDIO/        Raw source art and audio (staging only, not shipped)
  MD/  MD_UPDATES/       Design specifications and update plans
  webhook_patchnotes/    Release announcements
  netlify.toml           Hosting configuration
  game/
    public/              Converted runtime assets (the only media that ships)
    src/
      state/             Game rules in plain TypeScript, with no React or DOM
        data/            Catalogues: careers, programs, locations, traits, names
        activities/      Activity definitions, one file per area
        events/          Story events, grouped by theme
        systems/         One mechanic per file
      fx/                PixiJS stage, isometric scenes and the React bridge
      screens/           Interface screens
      components/        Shared interface components
      ui/theme/          Stylesheets in numbered chunks
    tests/               Feature test scripts, the Vitest suite and the life simulator
    tools/               Asset packing and scene preview scripts
    verify.mjs           The quality gate script
```

---

## Development rules

The full rules are in `CLAUDE.md`. The main ones:

- **Rules are pure.** Game logic lives in `game/src/state/` as plain TypeScript, with no React, DOM or network access. The interface calls into it. This keeps every rule testable.
- **Content is data.** Activities, events, careers, programs and locations are data entries. Adding content should mostly mean adding data.
- **One source of truth.**
  - All stat changes go through the engine's `stat`, `money` and `meter` methods.
  - All checks go through its `check` and `statOdds` methods.
  - Kinds are typed unions with `Record` maps, so the compiler rejects any kind that has not been registered everywhere.
- **Small modules.** One mechanic per file. Large files are split by responsibility.
- **Save compatibility.**
  - Every new saved field gets a default in `blankState()`, so older saves load correctly.
  - Renamed or moved content gets a migration.
- **Interface conventions.**
  - Stylesheets are added as new numbered chunks, and class names carry a feature prefix.
  - Pop-ups never show scrollbars and never cover character art.
  - Costly or drastic actions use a hold-to-confirm button.
- **Text matches code.** When a number changes, the in-game text, the tests and the patch notes change in the same commit.
- **Updates are versioned.** Each update has a version and a name, in-game patch notes and an announcement file.

---

## Assets

- Raw art and audio are staged in `ASSETS/` and `AUDIO/`. They are never shipped directly.
- Isometric art is packed into texture atlases by `game/tools/pack_iso.py`. It writes `.webp` atlases and frame data to `game/public/iso/`, and item icons to `game/public/items/`.
- Re-run the packer after adding or changing source art:

```
py -3 game/tools/pack_iso.py
```

- Scene layouts can be checked without running the game. Dump a scene with `game/tools/iso_dump.ts`, then render it with `game/tools/iso_preview.py`.

---

## Deployment

The site is deployed with Netlify, as configured in `netlify.toml`:

- base directory `game`;
- build command `npm run build`;
- publish directory `dist`;
- a single-page-application redirect.

The live site only changes after a fresh production build is published.

---

## Credits

| Work | Source and license |
|---|---|
| Isometric city, buildings, landscape, vehicles, library, farm, foliage, background, animal and item art | Kenney (kenney.nl), Creative Commons CC0 |
| Character portraits | DiceBear, MIT license; Avataaars design by Pablo Stanley |
| World renderer | PixiJS, MIT license |
| Animation | GSAP |
| Interface | React, Vite and TypeScript, MIT and Apache-2.0 licenses |
| Typefaces | Space Grotesk and Inter, SIL Open Font License |

---

## License

No license has been chosen for this project yet. Until one is added, all rights are reserved by the author.
