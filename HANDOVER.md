# HANDOVER.md

## Current patch: Update 0.5 — Underworld
Built from `MD_UPDATES/UPDATE_0.5_UNDERWORLD.md`. All of `npm run verify` passes: typecheck, 11 feature tests, lint, Vitest and the build. That includes the new `test-underworld.ts` (1,000 crime-heavy lives) and `test-chat.ts` (300 chat-heavy lives plus direct gate checks).

### Hard rules (code-enforced, tested)
- **Minors are never crime targets.** Every target goes through `isValidCrimeTarget()` plus `auditTarget()`, which throws. Adult crime tiers are 18+.
- **Crime and intimacy never mix.** `canBeIntimate()` is false when `cannotConsent()` is true (captive, sedated, very intoxicated, or being blackmailed by you).
- **Blackmail demands** are only money, favours, silence, information, or jobs (`DEMANDS`).
- **The Dark Crime toggle** (Settings, 18+ confirmed) gates murder, kidnapping, armed robbery, arson, organised crime and the business.
- **Text stays abstract:** fictional substances, abstract cover-up verbs, no graphic violence.
- **Private photos** are a blurred card only, adults only, and never appear in group chats.

### Done
- **Crimes** (`state/crime/catalog.ts`):
  - Petty: pickpocket, scam, fake goods.
  - Property: burglary, car theft, fraud, arson.
  - Organised: smuggling, racket.
  - Violent, on people you know, via the People screen's Underworld group: assault, robbery, kidnapping.
  - Six abstract "capital" methods.
  - Crime cards are dark red with ⚠ Heat · 👁 Witness · ⚖ sentence chips.
- **Cover-up puzzle:** after a serious crime the Evidence screen shows clues, not answers. You get a limited number of actions from 15 abstract options. Whatever isn't covered becomes evidence in a case. Two loud actions add "Suspicious behaviour".
- **Investigation:**
  - A detective nemesis NPC with a personality (relentless, brilliant, corrupt, rookie, burned-out).
  - Monthly evidence finds, wanted stars, interviews.
  - Arrest, then court: lawyer choice, plea deal, conviction or acquittal, assets seized.
  - Cold cases ("new DNA technology"), a true-crime podcast, and a butterfly witness.
- **Pursuit:**
  - ★★★★ queues a manhunt: Run or Turn yourself in.
  - On the run you get a red vignette, a wanted poster, and a police-net bar that grows each slot.
  - Moves: Run, Hide, Disguise, Steal a car, Back roads, Call in a favour, Settle under a fake name, Flee the country, Sleep rough. Turn yourself in is always available.
- **The Back Room:** a black market with gear, burners, fake passports, a sedative and a poison. A gun counter needs a license and a clean record.
- **Properties:** garage, basement, warehouse, storage, cabin, front business, boat, with upgrades and raids.
- **Business and crew:** the business, territory, laundering, six crew roles, crew betrayal, and heists (target → entry → escape).
- **Captives and blackmail:** ransom, release, send away; captive crises; blackmail that breaks.
- **Guilt meter:** nightmares and paranoia, eased at the confession booth. A "Sociopath" trait for cold characters.
- **Family fallout:** victim's family, a partner finding the stash, kids learning the truth, moral dilemmas. A news ticker runs during big cases.
- **Prison:** a greyscale world. New activities: join a gang, trade contraband, a multi-month escape plan.
- **Messenger (phone):**
  - Inbox, then chat view with bubbles, typing dots, read receipts, reactions, unsend, and last-seen.
  - Tabs: greet, talk, deep, flirt, plans, 🔥 intimate (18+), money, support, conflict, 🗡 underworld (18+, Dark Crime).
  - 3 texts per chat per slot, free. Auto group chats: family, friends, class, work, crew.
  - Underworld texts add digital evidence unless sent from a burner.
- **Crime app** in the phone. It appears after your first crime or once Street reaches 5.

### Sound (added after 0.5)
- Six files from `AUDIO/` were converted to `game/public/audio/` as 160 kbps mp3s: bgm, click, message, camera, nomoney, notify.
- `ui/audio.ts` does the playing:
  - Music starts on your first click or key press, because browsers block autoplay. It loops at 30% volume.
  - Every button clicks.
  - Chat sends and replies play the message sound. Photo chips play the camera snap.
  - A new unread text plays the notification sound.
  - "Not enough money", "Need $…" and similar results play the no-money sound. Money-locked buttons should play it too, if the browser delivers presses on disabled buttons; that's unverified.
- Settings has Music and Sound effects toggles.

### Fixed along the way
- A stale school event crashed when it fired after juvie or expulsion (`education.current!`). Five event choices are now guarded.
- After a prison escape, "Turn yourself in" at the manhunt set you free. It now sends you back for 18 months.
- Tox, staged and suspicious evidence had no cover-up action. Added "Make it look natural"; "Act normal" now also covers Suspicious behaviour.

### Not done yet from the 0.5 brief
- A **pursuit map** with heat zones. It's a net bar on the wanted poster for now.
- **Prison:** cell background and visit room; only the greyscale filter exists.
- **Heirs:** inheriting cases or the crime family. `continueAsChild` doesn't copy cases yet; `inheritedCases` exists but isn't used.
- **Paths:** corrupt cop, vigilante, redemption arc, faking your own death.
- **Double-life contradiction events:** only the `coverStory` counter exists.
- **Messenger extras:** pin, mute and archive; hacked phone; a partner snooping on your chats; a police warrant reading them.
- **Properties** live in the Crime app, not a Housing → Properties tab.
- **Discord webhook JSON** (`webhook_patchnotes/`): not made, same as earlier updates.

### Still open from 0.4
- About 130 dialogue lines against the brief's target of about 2,000.
- Not built: the jealousy web, wedding chains, outfits, phone tiers, social-media fame.

## Not seen yet
I haven't run any of this in a browser, so the visuals are unchecked. Please check:
- the dark-red crime cards;
- the Evidence screen (820px card);
- the wanted poster and red vignette;
- the news ticker position;
- the messenger chat view and composer;
- the Crime and Back Room apps;
- the greyscale prison.

## How to publish
Run `cd game && npm run verify`, then `npm run build`. Netlify settings: base `game`, publish `dist`.

## Key code map
- Underworld: `state/crime/` (consent, catalog, commit, evidence, investigation, justice, pursuit, properties, drugs, captives, guilt, month)
- Activities: `state/activities/underworld.ts` · Events: `state/events/underworld.ts` · Chat events: `state/events/chat.ts`
- Messenger: `state/phone/chat.ts` and `screens/phone/apps/MessagesApp.tsx`
- UI: `screens/crime/` (EvidenceScreen, PursuitHud and NewsTicker), `screens/phone/apps/CrimeApp.tsx` and `BlackMarketApp.tsx`, `ui/theme/theme-09-underworld.css`
- People: `state/npc/` · Encounters: `state/encounters/pools.ts` · Texts: `state/phone/texts.ts` · Bag: `state/inventory/items.ts`
