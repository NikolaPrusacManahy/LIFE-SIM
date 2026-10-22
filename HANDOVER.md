# HANDOVER.md


## Update 0.13 — Infinite Lives (in progress: stage V, slice 1)
- **Plan:** `MD_UPDATES/UPDATE_0.13_PLAN.md` (stages V, A–G, decisions recorded).
- **Stage window:** during play the canvas is clipped to the gap between the cards (x 328–1150, y 16–576; `theme-23-stage.css`, `StageCanvas` `framed`). The canvas keeps 1440×860 coordinates, so nothing else moved. Both avatars stand at `GROUND_Y - 8` so their feet stay inside the window.
- **Isometric dioramas** (Kenney CC0 packs from `ASSETS/`):
  - `tools/pack_iso.py` packs city tiles, buildings, landscape, 4 service vehicles and foliage into `public/iso/*.webp + .json` (Pixi atlases, about 1.4 MB). Re-run it after adding packs.
  - `fx/iso/layout.ts` (pure): grid math (66×33 step, tiles bottom-anchored 98px under the top vertex), curated building styles (ground floor + floors 36px apart + roof), and seeded layouts for downtown, Main Street and the park, with car lanes, sidewalk walk paths, lamps and lit windows, by season.
  - `fx/iso/IsoView.ts` builds the Pixi diorama (scale 0.6, centred at x 740, y 330), with cars (taxi/police/ambulance/garbage, 4 directions), walkers, night lights, winter snow and a rain sheen.
  - `Stage` uses it for `downtown`, `mainstreet` and `park` (`ISO_SCENES`); every other place keeps the old scene. If the atlases fail to load, everything falls back.
- **Visual checks without a browser:** `npx tsx tools/iso_dump.ts <kind> <season> out.json` then `py -3 tools/iso_preview.py out.json out.png [paths|stage]` draws the same layout from the real atlases.
- **Test:** `test-iso.ts` (frames exist, the building pieces are the right types, stacking, cars on roads, walkers on paths, the street not hidden, determinism, seasons).
- **Stage V2 done (every place has a living scene):**
  - **New atlases** (`tools/pack_iso.py`):
    - `interior`: the farm + library pieces, trimmed and halved, lossy webp; anchor `RENDER_ANCHOR` = the floor diamond's top vertex, scale `RENDER_SCALE` 132/128 so they sit on the city grid;
    - `animals`: round head portraits, for the Pets app later;
    - `sky`: clouds, sun, moons;
    - `items`: 163 icons;
    - 80 civilian cars, matched to directions by silhouette: frame 001=NW, 003=NE, 007=SW, 008=SE.
  - **Modules:**
    - `fx/iso/layout-core.ts`: shared types and helpers (`Draw` with sprites or drawn `prims`, `Path` kinds `car/walk/dance/sit/stand`, `IsoScene.view/backdrop/disco/crowd/household`);
    - `fx/iso/furniture.ts`: about 60 code-drawn pieces as shaded isometric boxes, plus animals;
    - `fx/iso/outdoor.ts`: campus, lake, docks, woods, back roads, farm (corn by season), homeless camp, alley, construction, station, stadium, base;
    - `fx/iso/rooms.ts`: the room builder, with `ROOMS` (library, club, bar, roadhouse, gym, hospital, casino, church, jail, school, office, shop, diner, police, studio, warehouse, garage, hideout, mafia) and `HOMES` (home, apartment, mansion, farmhouse);
    - `fx/iso/scenes.ts`: `SCENES: Record<SceneKind, Builder>`, so every place is covered.
  - **`IsoView`:**
    - drawn shapes and sprites;
    - indoor backdrop, with no outdoor sky tint and no weather;
    - walk/dance/sit/stand crowds;
    - civilian traffic (72%);
    - disco spots;
    - winter ice;
    - your household on the home spots;
    - contacts who are here, with a yellow dot, clickable: `Stage.onPick` → `StageCanvas onPick` → a `lifesim:pick` window event → `PlayScreen.openPeople`.
  - **Sky:** `Sky.useArt()` swaps in the Kenney clouds, sun and moon (full or half by month).
  - **Rules:** `state/systems/household.ts`: `householdOf` (parents and siblings at your parents' place; otherwise spouse, fiancé(e), kids under 18, roommates), `peopleAt` (classmates at school while enrolled, coworkers at work, at most 4), `petsAtHome` (the dog asset for now).
  - **Setting:** `settings.reducedFx` "Reduced effects" (half the crowd, 3 cars, no disco spots).
  - **Tests:** `test-iso.ts` (all 37 places × 4 seasons have their frames, every place draws, paths stay inside, indoor/outdoor, club, household only at home, corn by season), `test-household.ts`.
- **Stage V3 done:**
  - **City map** (`fx/iso/cityMap.ts`, pure, with fixed area patches per region and every other place on the next free lot along a road, nearest the centre first):
    - `MapView.ts` is a Pixi window with bobbing pins (🔒 grey = not available, 🚀 your company);
    - `screens/map/CityMap.tsx` opens from the 🗺️ Map button in `PlacesCard`;
    - `renderIso()` was split out of `buildIso` so the map reuses the scene renderer.
  - **Item icons:** `tools/pack_iso.py` also writes `public/items/item_NNN.webp` (64px); `ui/itemIcon.ts` `ITEM_ICON` maps item ids to icons, used by `components/ItemIcon.tsx` (emoji fallback) in the Bag, Shop and Back Room.
  - **Credits:** `screens/credits/Credits.tsx`, opened from the title screen and the pause menu.
  - **Tests:** `test-map.ts`.
  - **Moved:** the travel world map (NOVA tiles) moves to stage A1, where trips exist.
- **Fixed (V3 follow-up):**
  - **Black stage after using the map, and after the 0.12 gym minigame:** `app.destroy(true)` released Pixi's global pools. Every app now uses `destroy({ removeView: true }, { children: true })`, guarded by `test-map.ts`.
  - **Company tower on the map:** it now goes home and opens your PC/laptop sitting straight into START-UP (`Desktop initial`, `PlayScreen.openStartup`). If the computer is already used this time of day, it shows a short note instead.
- **Stage V4 done (every activity is playable):**
  - **Themes:** `state/minigames/themes.ts` `MINI_THEMES` gives 76 activities an engine, a skin and a prompt.
  - **Engines:** 14 (rhythm, timing, gym key spam, runner, quiz, duel, sort, cards, aim, fish, plant, draw, stealth, drive, calm). Pure rules live in `state/minigames/engines/*.ts`; screens in `screens/mini/engines/*.tsx` (shared `useLoop`/`useKeys` in `common.ts`).
  - **Scoring:** `Game.doActivity` takes the themed result (`takeMini`), sets `playScore` and `playMul = 0.6 + 0.9·score`, and `Game.stat` multiplies positive gains (except energy/health) by it. The result note is appended to the activity text.
  - **Outcome by play:** blackjack, poker and the high-roller room (≥ 0.75 win, 0.25–0.75 push/refund, else lose), slots (three of a kind $1,000, a pair $100), the permit test (≥ 0.6), the road test (≥ 0.6) and the SAT (±120).
  - **Skip:** `MiniResult.skipped` counts as not played (autopilot odds, ×1). No free casino refunds.
  - **Host:** `MiniHost` plays the themed engine with a prompt and Skip; `PlayScreen.act` opens it for themed activities.
  - **Styles:** `theme-25-engines.css`. Card classes use `cds-`, because `crd-` belongs to Credits.
  - **Tests:** `test-engines.ts`.
  - **Still one-click (by design):** medical, paperwork, sleep and the computer.
- **Title screen (designer request):** back to the classic flat skyline (`StageView.classic`, set on `TITLE_VIEW` and the character-creation preview). The footer links "Update 0.13 — Infinite Lives" and has ⚙️ Settings (`screens/title/TitleSettings.tsx`: Mature Content, Dark Crime, Music, Sound). Title and phone show v0.13.
- **Still to do in 0.13:** stages A–G (Wanderlust first).

## Current patch: Update 0.12 — Personas
Built from your chat request. The name "Personas" is my placeholder. All of `npm run verify` passes; the new test is `test-personas.ts`.
- **Personas** (`npc/persona.ts`, `Person.persona`): shy, otaku, tech nerd, yandere. Rolled for new encounters, admirers, night-out crowds and Spark profiles (shy 12%, otaku 7%, nerd 7%; yandere only for adults of the opposite sex).
  - **Their voice** (`phone/voice.ts`): replies in character (70%), their own openers (`p_shy` / `p_otaku` / `p_nerd` / `p_yandere` with contextual replies), and two favourite-topic chips each (anime, manga, PC builds, tech news, "no pressure to reply", "you're the only one"…). Mature lines are never rewritten.
  - **Their chat design** (`theme-19-personas.css`): shy = soft pastel italics, otaku = sakura pink with sparkles, nerd = green terminal, yandere = hot pink hearts.
  - **Profiles** show the persona chip. A yandere shows only "💗 Maybe a bit passionate" plus "✨ Stunning".
- **Yandere partner** (`systems/yandere.ts`): text one person of *their* sex 2 times in a month → "who's she? ♡"; 4 times → that person is gone. With Dark Crime on they're found dead; with it off they're scared out of town. Nobody is ever caught (no heat). Never minors or family.
- **The unknown number** (`systems/stalker.ts`, `screens/phone/apps/AnonChat.tsx`): a yandere admirer who isn't with you (8% a month) starts texting anonymously: your recent activity, your bank balance, your record, your ex, photos of you.
  - Its own replies (3 a month): who is this, leave me alone, block (40%), police (35%), move ($3,000, 60%), or "…I'm listening" (give in).
  - After 4 months (or when you give in), the reveal: accept and you're dating, or refuse: 50/50 they kill you or end their own life (Dark Crime on). With Dark Crime off they just vanish. Escaping makes them move away, never caught. Adults only.
- **Shy confessions** (`systems/shy.ts`): a shy person who's into you confesses and faints. Yes → dating, and they're in hospital for 2 months (no outings). No → heartbroken for 3 months.
- **Admirer encounters** (`encounters/pools.ts` `admirerEncounter`): 30% of encounters at the library, clubs, bars, the roadhouse, the park, work and college are someone into you; adults sometimes meet a yandere (18%).
- **End of the date** (`datenight/after.ts`, `events/dateafter.ts`): ending a date (not at home) by spark: 40+ ask for a second date (plans one), 60+ friends with benefits, 70+ a one-night stand (adults, not already committed). Odds come from the spark and their feelings.
- **House parties**: the campus party is now the night-out scene in a house (`venue: 'house'`): kitchen, living room, couch, backyard, bathroom, upstairs; crowd 18–25; drinking follows your laws (wristband under age). The old one-click party hook-up card is removed.
- **College is twice as fast**: university 2 years, master's/MBA 1 year, PhD/MD 2 years, JD 18 months, associate 1 year (night 15 months). High school, trade school and the police academy are unchanged. Degrees under way are shortened on load. Monthly tuition is unchanged, so college costs half as much in total.
- **Fix:** Stats on steroids no longer sells health or energy levels, only their max.
- **START-UP skill tree** (your request): 13 branches × 5 levels (`startup/data.ts` `SKILLS`). New: Marketing (+20% campaign hype), Brand (hype fades 15% slower), Quality (+2 per launch), Stability (−20% bug scandals), Viral (+2% viral chance), Investor terms (−8% dilution), Dividend (+5% of profit to you), Office space (+10% staff per building), Crunch (+2 dev, −2 energy). Levels 1–3 cost 1 point, 4–5 cost 2; each new status rank gives +2 points. Older companies get the new branches at 0.
- **START-UP profit fix** (designer request: big companies kept losing money; `startup/company.ts`, tests in `test-startup.ts`): revenue = `productRevenue` (the old formula; `versionFactor` now adds +4% per version past v3 instead of capping at v3) + `staffSales` (employees and supervisors bring in 1.2× their wage × (0.6 + 0.4 × quality), +10% with a manager). `hypeFloor`: hype never decays below 2 × version (max 40). The Profit skill is +15% product sales. Example: a v30 phone company at the skyscraper with about €1.13M/mo in costs now makes €0.47–1.3M/mo profit at hype 40–80. Overview shows 📦 product / 👥 staff under Revenue.
- **Computer energy** (designer correction): only Hackr and START-UP use it (`energyDo` / `spendAction`). Websites, Discorb, JobHunt, Nile orders, Bitstore games, the wallet and Stats on steroids are free (`webAct` / `sessionDo` only log the line). 12 a sitting on your laptop/PC, 4 at the library.
- **Activity minigames** (`ActivityDef.mini`, `state/minigames/*`, `screens/mini/*`, test `test-minigames.ts`). The minigame plays first, its result goes to `g.mini`, and the activity reads it with `takeMini` (autopilot / sim use an average result).
  - **Coding** (Code a Side Project, Free Coding Course, Hackathon): always pick a language: C++ (Visual Studio look, purple), Python (yellow), HTML/JS (VS Code look, blue), Java (IntelliJ, orange), C# (Rider, green), Rust (RustRover, rust red). 4 guided projects each (24 total): the guide tells you what to type in each blank, then ▶ Build shows success or compiler errors. `codeLearn` (`minigames/code.ts`): a clean build adds +2 smarts / +3 coder; the first time a project ships adds +2 smarts, +1 creativity, +3 coder more (`shipped:<id>`); shipping all 4 in a language masters it (+5 smarts, +10 coder, milestone, `mastered:<lang>`). Languages are counted (`lang:cpp` etc.).
  - **Cooking** (Learn to Cook): eggs, bacon, steak, fish, chicken legs, pancakes on a live pan: oil, into the pan, mix (eggs) or flip (both sides), season once or twice, plate it inside the green window. A great dish counts as 2 lessons.
  - **Writing** (Write, Write a Novel): a book: journal or story, from presets (2 each) with choices per blank, or free typing. Saved to `s.notebook`; the 📓 Notebook appears in the bag with a Read button.
  - **Gym** (Lift Weights, Boxing, Swim Laps): a PixiJS ring (`fx/minigame/gymGauge.ts`) for 20 seconds; the key (W/A/S/D/SPACE) changes every 2 seconds; the ring fills and loops with no combo cap. Gains up to +12 fitness and +6 looks (140 correct presses = full; they still pass through `Game.stat`, so high fitness gains less).
- **More personas:** 📚 book nerd (rich vocabulary), 🎮 gamer (gamer slang; asks to call on Discorb), 💅 gyaru (college-age women only, always blonde with tinted glasses, judgmental), 💰 gold digger (adults; asking out costs $200, a date $150, official $2,000, a proposal $25,000; paying makes a yes much likelier). Each has a voice, openers with their own replies, two topic chips and a chat style.
  - **Gamers on Discorb:** they appear in your Discorb friends; 📞 Video call: voice-only without a webcam, a date with one; the first webcam call is a face reveal.
  - **Who you meet where** (`PLACE_PERSONAS`): mall / shopping / salon → gyaru & gold diggers; arcade → gamers & otaku; coffee shop & library → book nerds & otaku; campus → gyaru, book nerds, gamers; clubs → gyaru & gold diggers.
  - Personas show on profiles and Spark (a gyaru is blonde on Spark too).
- **Bitcons wallet** (`systems/bitcons.ts`, `screens/desktop/wallet/WalletApp.tsx`, `theme-21-wallet.css`, test `test-bitcons.ts`): a desktop app. `s.wallet` {coins, price, history}. Starts at $40,000/₿; each month a random walk (about ±12%, 3% crash to 55–70%, 3% moon to 140–170%, floor $1,500), 24 months of chart. Buy/sell with a 1% fee, no computer action spent. PC mining now deposits coins (the electricity bill stays cash). Net worth counts the wallet.
- **Hospital encounters** (`staffEncounter` in `encounters/pools.ts`, test `test-hospital.ts`): 45% of hospital encounters are staff: a doctor or nurse aged 25–60 (`subject` shows on the profile). Adults: 20% of doctors fall for you at first sight (attraction 90+, 💘 chip); they ask you out (☕ yes → their number, `talking`) or you gently say no. Never for minors.
- **Fixed (stage preview):** behind a result card the stage showed the person from the next queued event (e.g. your planned date), which looked like a lost encounter. The stage now shows an event's person only while that card is open (`stageViewFor(g, loc, eventOpen)`, `PlayScreen` `onEventOpen`). Encounters in a slot with a plan were never lost; regression test `test-eventqueue.ts`.
- **Yandere dates** (`datenight/yandere.ts`, test `test-yandere-date.ts`): date actions add 2× spark, the quote bubble shows possessive lines, `finishDate` with actions left sends a jealous text, and a yandere partner's morning texts come with an outfit selfie (non-sexual) and "I hope you get a nosebleed ♡". Intimacy works the same as with any partner. Not built (stopped by a safety filter): forced or guaranteed intimacy and refusing protection. **Risky choices** ("No protection", "Okay… no condom") are red buttons (`ChoiceDef.tone: 'risk'`).
- **Stalker escalation** (`systems/stalker.ts`, `events/personas.ts`, `AnonChat.tsx`, tests in `test-rejection.ts`). Every 2nd refusal (leave, a failed block, police or move, or reporting a letter) → `bribeFriend`: an adult friend (rel 30+) is paid to drop you (becomes an acquaintance, rel 5). Nobody is hurt. Monthly: 50% a jealous text about someone you were close to last month. With Mature Content on: a 45% chance of a suggestive remark (`REMARKS`, not explicit) with 4 reactions (sweet, sarcastic, funny: she replies happily; cold: a friend is bribed), and a 20% chance of `stalker_letter` (mature event: "[explicit photos]", face masked, a note; throw away, keep, or police 35%). `marriedOff`: marrying a non-yandere sends every yandere away and ends the stalker (checked at the wedding and each month). **Not built** (stopped by a safety filter): a hostage being hurt, killing people over remark replies, and explicit sexual lines.
- **Rejection** (designer request; `rejectAdmirer` in `systems/stalker.ts`, test `test-rejection.ts`): admirer and yandere encounter cards have 🙅 Reject, and Ignore counts as a rejection. A normal admirer turns yandere 50% of the time (adults of the opposite sex only; otherwise they leave as before). A yandere is never deleted; they get the `rejected` tag and the unknown number starts the very next month with an angry opener. New obsession messages for any stalker: hair in a jar, your stolen toothbrush, your lost shirt; with Mature Content on, two suggestive (non-explicit) lines about touching themselves.
- **Hackr** (crime; `web/hack.ts`, `screens/desktop/hack/HackApp.tsx`, `theme-22-hack.css`, test `test-hack.ts`): needs 18+, a non-library computer and the GhostTunnel VPN ($60, Bitstore; `web.installed` 'vpn'). 4 fictional leaked accounts a month (`s.hack`, all adults 18–75), each with a riddle hint and the letter count; 3 guesses (the first uses a computer action). Crack → their profile (name, age, job, city) and maybe loot: 35% a credit card ($200–3,000 cash, heat +8, karma −3, 15% chance of a fraud case), 12% a Bitcons wallet ($800–12,000 in coins, heat +5, karma −3). 3 wrong → locked, heat +3.
- **Webhook:** `webhook_patchnotes/update-0.12-personas.json` (10/10 embeds).

## Update 0.11 — START-UP
Built from your chat request. The name "START-UP" is the app's name, reused as the version name. All of `npm run verify` passes; the new test is `test-startup.ts`.
- **Where:** Computer (PC, laptop or library) → 🚀 START-UP. Each management move is one computer action (`sessionDo`). Skill points are free.
- **Founding** (`startup/company.ts` `found`): 16+, one company at a time. Pick an idea (11 in `startup/data.ts` `IDEAS`: AAA game, AI model, factory, smartwatch, phone brand, social app, EVs, biotech, fashion, food delivery, rockets), a custom name, appeal, and your own starting money.
- **Appeal at creation:** Safe pitch (investor odds +20%, revenue ceiling ½×), Balanced, Moonshot (−15%, ceiling 2×).
- **It's a real business that pays you** (your correction): each profitable month, 25% of profit is paid out; your share lands in your bank account after 25% tax (`DIVIDEND`, `DIVIDEND_TAX`, `startup/month.ts`). You can also pay yourself on demand, and selling the company pays your share of the valuation. Your share counts in net worth.
- **Monthly** (`startupMonth`, called from `systems/monthly.ts`): development toward the next version, hype fades (faster when high), 5% viral / 4% bug news, revenue − wages − rent. Three months in the red → it folds.
- **Revenue** = idea potential × appeal ceiling × hype^1.5 × quality × version × skills. Each new version needs 60% more work than the last.
- **Team:** employees ($4k), supervisors ($7k, 1 per 5 employees), a manager ($12k, needs an office), head of HR ($8k, 10+ staff).
- **Buildings:** your room (3 staff) → office (15, $50k) → facility (60, $500k) → HQ (200, $5M) → skyscraper (1,000, $50M). The view (`screens/desktop/startup/HQView.tsx`, SVG) goes from a bedroom desk to office floors to a penthouse meeting table over the city.
- **Investors** (`pitch`): angel / VC ($1M valuation) / mega fund ($25M) / sovereign fund ($250M). They put in cash for a share, so your stake shrinks. One pitch per round per month.
- **Skill tree:** Profit +15% revenue, Speed +20% development, Payroll −10% wages, Pitch +5% odds (3 levels each). Points come from launches, building moves and every 6 profitable months.
- **Status by valuation:** Founder → CEO ($1M) → Tycoon ($25M) → Magnate ($250M) → **Diplomatic** ($1B + skyscraper).
- **Diplomatic immunity** (`systems/immunity.ts` `untouchable`): no jail, no getting caught, no police pursuit or investigation, no Chirp cancellation. It's permanent once earned. The hard safety rules (consent, minors, Mature/Dark Crime toggles) are unchanged.
- **Balance (scripted careful play):** about $3–7M valuation by year 1–3, about $15–30M by year 10. Tycoon is hard and the billion needs investors plus a moonshot. Companies that grow too fast fold.
- **Dates, your follow-ups** (`datenight/*`, `datenight/desire.ts`, `events/desire.ts`, test `test-desire.ts`):
  - **Gym date** (🏋️ $12, free with a membership): lift together, spot them, treadmill race, partner stretches, protein shakes. Ends in the locker room (the restroom moment, needs love) or your place.
  - **Movies:** new flirting actions (flirt in the dark, brush their hand, move to the back row). No restroom any more; instead **🎬 Right here in the back row** (moment `spot`, spark 80, needs romance 60).
  - **Friends:** "😏 Hang out… make a move?" on a friend's profile opens the same date scene, harder: +10 spark for every moment, −10% odds, they suggest your place half as often, and the first kiss can be turned down (30–85% by attraction and romance). A kiss back makes them "Talking".
  - **Partners text you:** "movie tonight?" (a movie date), "can I come over?" (a date at your place), "come over to mine?" (new **Their place** date scene: home actions, ends in a calm night or staying over).
  - **They ask (romance 80+):** when they suggest the bedroom at your place or theirs and you say yes, *they* ask where (couch / bed / kitchen counter) and how (a quick one / five rounds, energy −20 / skip the condom). You can always insist on a condom; they accept with no penalty.
  - **The player asks only with a spouse:** "🔥 Ask for intimacy" (spouse only) → you pick where and how. Partners and dates always lead. Your existing date moments (your place, restroom) are unchanged.
  - Hard rules unchanged: every step re-checks `canBeIntimate`; fade to black.
- **School stays in school** (your correction): a rival appears "in class" only while enrolled, otherwise at work. Admirer locker notes need high school, a teacher's "after class" talk needs enrolment, and school rivals drop the rivalry once you leave school (`retireStaff`).
- **💉 Stats on steroids** (computer app, `systems/boost.ts`, `screens/desktop/steroids/SteroidsApp.tsx`, test `test-steroids.ts`):
  - Buy any stat up to 100 (health, mood, energy, smarts, fitness, charm, creativity, looks, street). Karma is a meter and can't be bought.
  - 100 per level in your currency: $100 on US lives, €100 on EU lives ($112 internally, shown as €100). A slider and a number box pick the target level; hold the button to pay.
  - Max health and max energy can be raised from 100 to 300 at the same price per level (`s.statCaps`, `Game.maxOf`). Raising the max doesn't fill the bar; buy or rest to fill it. Nights out that end in the morning refill to the new max.
  - Purchases don't use a computer action (my default).
- **Sleep fills the whole energy bar** (your correction): home Sleep → energy to max (a raised max too); homeless → half. Jail, camping and sleeping rough on the run are unchanged.
- **Stats card:** a raised max shows next to the name ("energy /300") so the number column doesn't overflow.
- **Webhook:** `webhook_patchnotes/update-0.11-start-up.json`.

## Update 0.10 — Date Night
Built from your chat request. The name "Date Night" is my placeholder. All of `npm run verify` passes, and the new test is `test-date.ts` (400 simulated dates).
- **Romantic dates only:** crush, talking, dating, partner, engaged, spouse, fling or FWB, and someone who could be into you (`isRomanticDate`).
  - Start one from their profile ("Go on a date", which uses the slot) or from a date plan.
- **The scene** (`state/datenight/*`, `screens/date/DateScreen.tsx`):
  - 8 actions per date.
  - A **spark** bar (0–100) that starts warmer with a romantic partner.
  - Venue actions plus 5 shared ones. Each has odds from your stats, their romance and mood, and their traits.
  - Drinks fill a meter (legal drinking age only).
- **10 venues**, each with its own actions: restaurant, movies, gala (18+, $200), concert, park, arcade, beach (summer), picnic, mini-golf, dinner at home.
- **Moments by spark:**
  - 🤝 hold hands at 25 (any couple).
  - 💋 kiss at 45 and 😘 French kiss at 60. Adults and Mature Content only.
  - 🌙 back to your place at 70: protection choice (condom or not), then a fade to black.
  - 🚻 the restroom at 80. Only where there is one, and only if their romance is 60+. A condom works there too ("they have one").
  - They may suggest your place themselves. "Not tonight" carries no penalty.
- **Hard rules:**
  - Everything past holding hands needs `canBeIntimate` (both 18+, Mature Content on, consent possible) and drinks under `INTOX_LIMIT`.
  - Teen couples can hold hands only.
  - Audited in `DATE_AUDIT`.
- **Dates at your place** (your follow-up):
  - "🏠 Invite them over" on a romantic profile (uses the slot), or texting a partner "Come over?" (makes a 'Coming over' plan), starts a date at your place.
  - Home actions: the tour, cook ($15), takeout ($25), couch movie, cuddle, board game, slow dance in the kitchen, open a bottle.
  - It ends with **🛋️ Calm night in** (romance and trust up) or **🛏️ To the bedroom** (the protection choice). They may ask "Show me the bedroom?".
  - **Your home matters** (`HOME_BONUS`): parents' house −8%, shared flat −6%, apartment +3%, farmhouse +4%, house +7%, loft +9%, ranch +10%, mansion +14%. This applies to home-date odds and to how often they suggest the bedroom.
  - Homeless means you can't host.
- **"Tonight" means today** (`todaySlot` in `phone/plans.ts`):
  - Accepting an invitation, or making plans by text, in the evening or at night starts the plan in the current slot. The scene opens as soon as you put the phone down.
  - In the morning or afternoon, the plan is set for this evening.
  - Invitations lapse after today's slot. "Another time?" still moves it to a later day.
- **Activity screens are solid navy:** dates, nights out and the crime-scene cover-up.
- **Fixed:** a phone left open while accepting a plan came back underneath the date. The phone, service counters and the People screen now close when a story card, date, night out or computer sitting takes over.
- **Date screen:** a solid navy background (nothing behind shows through), and your date answers every action in a speech bubble, with 2 good and 2 bad lines per action (`datenight/quotes.ts`).
- **Euros for EU lives** (`ui/currency.ts`). Display only: game rules, prices and saves stay in dollars.
  - One observer rewrites `$N` in UI text and tooltips to `€` at 1 € = 1.12 $, and restores the dollars when laws switch back to US.
  - The canvas floating numbers use `cur()`. The save-slot list formats each life in its own currency (`data-cur="fixed"`).
  - Switching happens when a life loads, when Laws is toggled in Settings, and live in the creator.
- **Fixed:** the creator's button said "Start at age 14" even with 23 picked.
- **Intimacy** now also gives romance +15 and attraction +6 every time (`encounter`).
- **Replaced:** the old instant date outcome (no scene). `DATE_OPTIONS` is now the venue list.
- **Webhook:** `webhook_patchnotes/update-0.10-date-night.json`.

## Update 0.9 — Free Time
These are your corrections after 0.8. The name "Free Time" is my placeholder; rename it if you like. All of `npm run verify` passes.
- **Computer sittings are free:** PC, laptop or library computer, one sitting per time of day (`free: true` on the activity, plus `usedNow` / `markUsed` in `Game.ts`).
- **Profile actions are free** (your correction): chat, compliment, flirt, ask for money… take no time but are once per time of day per person. Outings still use the slot (marked ⏱): hang out, date, party invite, care, visits, therapy, meet the parents, spending the night, fights, tutoring, crimes. (`USES_SLOT` in `npc/interactions.ts`.)
- **Nights out into the morning** (your correction): you wake up with full energy, or half if you got drunk. Evening nights out restore nothing.
- **Night out → their place** (simplified at your request, `nightlife/leave.ts`):
  - Reaching **Flirty** (connection 60+) is all it takes for "Go back to their place?" to appear. No chemistry or drunk-alternative logic, and no cab or walk options.
  - **Sober or tipsy:** their place, the protection choice (a condom always works there, or no protection), then you wake up in their bed.
  - **Either of you drunk** (≥ `INTOX_LIMIT`): nothing happens. They leave, are upset with you, and text you furious the next morning, with replies to apologise.
  - Still required: both 18+, Mature Content on, and someone who could be into you.
- **Safety fix:** someone who can't consent (very drunk, captive, blackmailed) no longer gets the flirt tab in chats or romance actions on their profile. Breaking up is still allowed. The life simulator found this.
- **Spark shows real faces:** profiles carry a look and an id. On a match, the person keeps both, so their portrait is identical in Messages and People.
- **5 save slots** (`state/save.ts`, `screens/title/SlotPicker.tsx`):
  - Still autosaved after every action.
  - Continue shows your saved lives. New Life picks a slot: empty, or hold to overwrite.
  - The overwrite only happens when the new life actually starts, so backing out keeps the old one.
  - A new life from the pause or death screen, and continuing as your child, stay in the same slot.
  - The old single save becomes slot 1.
- Webhook: `webhook_patchnotes/update-0.9-free-time.json`. The 0.8 webhook is back to its original text.

## Update 0.8 — Connected
Built from `MD_UPDATES/UPDATE_0.8_CONNECTED.md` in one delivery, as you chose. All of `npm run verify` passes: typecheck, 18 feature tests, lint, Vitest and the build. New tests: `test-connected.ts`, `test-desktop.ts` and `test-nightlife.ts` (1,000 nights).

### Messaging, plans, pipeline, notifications
- **Conversations** (`state/phone/convo.ts`):
  - Every NPC message has a kind with contextual replies, offered first in the composer.
  - A reply makes your bubble, typing dots, then their reaction bubble with an effect chip (`🤝 +3 · Trust +2`). Sometimes a follow-up question or a closing line comes next.
  - **Moods:** `state/npc/mood.ts`. They're upset after insults, fights, stand-ups or ignored invites (with the reason shown), or busy during day slots (they reply next slot).
  - Kind messages always land unless they're upset.
  - **Odds** show only on real gambles (the `GAMBLE` set in `chat.ts`).
  - **Limit:** 10 messages per contact per month, plus a free reply to their messages. This replaces 3 per slot everywhere.
- **Plans** (`state/phone/plans.ts`, event `plan_scene`):
  - Accepting an invitation creates a plan. In its slot, a scene asks "Go", which uses the slot and reuses the hang-out, date or deep-talk outcomes, or "Stand them up", which upsets them.
  - Unanswered invitations expire with "guess you're busy 🙃".
  - Partners and besties ask you out themselves: date nights, surprises, check-ins. Neglect leads to "do you even want to be with me?". Birthdays come with an invite.
  - There's a Plans strip above the places list.
- **Pipeline** (`state/pipeline.ts`): actions end on a `ResultCard` you dismiss. Queued events show only after that; text banners only after events.
  - Desktop sessions and nights out hold the queue until you shut down or head home.
  - `ActionToast` was removed.
- **Notifications** (`state/phone/notify.ts`):
  - Number badges (HUD phone, Messages tile, each thread) all equal unread threads.
  - Banners slide in at flush time and open the chat when clicked.
  - A Notifications app with plans.
  - **Sounds:** partner, family and others get different pitches of `notify.mp3` (placeholder until real files exist).
- **Profile:** "Text hi" is gone. "💬 Open chat" opens the phone on that thread, and fake numbers are caught on the first send. Hostile in-person actions set an upset mood.

### Computers (Doors desktop)
- **Devices:** library PC (4 actions), laptop (6, at home, library, campus, downtown or Main Street), your PC (6). (0.9: sittings are now free, one per time of day.)
- **Sites** (`state/web/*`):
  - JobHunt (apply, CV +5%).
  - ViewTube (tutorials, channel, uploads, ad money).
  - Twitchy (watch, donate, go live with webcam and mic: raids, toxic chat, viral clips).
  - Chirp (hot takes, ratios, cancellation, old posts resurfacing at work).
  - OtakuPit, WeatherNerds (real next-month forecast), GameHub (guides boost game scores), NewsNow.
  - LearnHub (3-session certificates: +10% hiring in that career track).
  - Spark Web and Bank (the phone apps embedded).
  - Nile (cart checkout, delivery in 1–2 slots, porch theft, wrong or damaged items, returns).
  - PartPicker (compatibility).
  - **SpicyHub:** 18+, Mature Content on, never on a library PC. A blurred placeholder only.
  - **Onionmarket:** 18+, the Tor-ish download, Street 15, never on a library PC. Crypto +5%, scams, stings.
- **Discorb:**
  - Online friends show only their *claimed* age.
  - Romance needs a real age of 18+ and meeting in person.
  - A revealed minor triggers `online_minor`, a safety event that permanently ends romance with them (`noRomance`), with report and block.
  - Minor players only meet honest peers.
- **Bitstore games:** Flappy Pigeon, Furious Fowl, Snek, Mines, Block Drop, Word Duel, Golf Solitaire. Each run uses an action. Tournaments cost $20 and pay $150 for a great run. Adds to a gaming addiction meter.
- **PC building** (`state/pc/*`):
  - 41 fictional parts across 18 slots.
  - Compatibility checks: socket, RAM type, PSU wattage, GPU length, cooler height.
  - Assembly mini-game (drag or click) with Smarts checks and possible mistakes: unseated RAM, cable mess, a static zap that kills the GPU, forgotten thermal paste (overheating events).
  - Then the first boot. PC score feeds games, streaming, uploads, mining (with an electricity bill) and the odds of the fraud crime.
  - Old GPUs die after 3 years. Single parts can be swapped in.

### Nightlife
- **Venues:** each one is a single "Night Out" card that opens the night scene (`screens/night/NightScreen.tsx`). The old club, bar and roadhouse cards were removed, and their effects folded in.
- **Venue types** rotate monthly: pub, dive, karaoke, trivia, techno, 18+ night, Pride night, rooftop, honky-tonk.
- **Ages follow the life's laws** through `legalAge`. 18+ nights let 18-year-olds in with a wristband (no alcohol).
- **The scene:**
  - Zones (VIP costs $50 or Fame 40) and a crowd of 15–25 NPCs with vibes. An ex or rival may be there.
  - Meters: about 12 actions, intoxication, confidence, cash.
  - Drinks, buying a round, dancing, karaoke, trivia, pool, darts (a timing mini-game), the mechanical bull, line dancing, DJ set, open mic.
- **Conversations** go Stranger → Connected, with odds shaped by vibe, traits, confidence and intoxication. Leaving a "wants to be alone" person alone earns karma.
- **Leave together** (`nightlife/leave.ts`):
  - Needs both 18+, Mature Content on, mutual chemistry, `canBeIntimate`, and both people under `INTOX_LIMIT` (70).
  - Otherwise you get **Get them a cab / Swap numbers / Walk them to their friends**.
  - **Stricter `canBeIntimate`:** it now also checks the player's own intoxication.
  - A very drunk NPC stays `intox:very` for two slots.
  - A minor with a fake ID gets no options with adults, not even numbers.
- **Incidents:** drink spiking (you can only intervene or look away), an ex or rival making a scene (bar fights), a lost phone.
- **After:** getting home (walk = mugging risk, cab $20, drive = drunk-driving or crash risk), then a morning-after card (hangover, a 3am text that's already been read, photos on Chirp, bank shock).

### Choices I made (tell me to change any)
- **Night scene:** built in the DOM (zones, chips, CSS light beat) over the existing Pixi venue backdrop, **not** a new side-on Pixi room.
- **Desktop time:** 12 actions per sitting on your own laptop/PC since 0.12 (was 6; library 4). See 0.9 for the time rule.
- **Nile:** a whole cart checkout costs one action.
- **Online age mix** for adult players: 5% minors claiming 18–20, 7% adults lying about age.
- **No new audio:** the three notification sounds are pitched copies of `notify.mp3`.
- **Laptops:** a laptop stays an asset (bought in the Shop), not a Bag item.

### Not done from the 0.8 brief
- Calendar as its own app (plans are in the Notifications app).
- Recruiter messages on JobHunt.
- A laptop battery.
- Parody streamer NPCs with persistent personalities.
- Gaming-chair and desk effects beyond score.
- An "introduce your friend" chip at nights out.

### Webhook
- `webhook_patchnotes/update-0.8-connected.json`: 7 embeds, about 1,900 characters.

## Not seen yet
No browser on my side, so all visuals are unchecked. Please look at:
- the result card and banners;
- chats with contextual reply chips;
- the Plans strip;
- the Doors desktop (window dragging inside the zoomed frame);
- all 7 mini-games (canvas sizes, controls);
- the PC build screen (drag and drop);
- the night scene layout at 1440×860.

## Earlier: Update 0.5 — Underworld
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

## Update 0.7 — New Faces
- **Portraits** now use DiceBear: `@dicebear/core` 10.7 plus the "Avataaars" style from `@dicebear/styles` 10.6.
  - Pablo Stanley's art, free for personal and commercial use. DiceBear itself is MIT.
  - `fx/portrait.ts` maps our look onto Avataaars. Every variant name is validated against the style file in `test-portrait.ts`.
- **What maps across:** skin hex, hair colour (greys with age), the 12 hairstyles (female and male tops), glasses, mood expression, gendered outfits, and beards on some adult men (stable per person id).
- **Avataaars has no freckles or eye colour.** Those still show on the Pixi world avatar, which is unchanged.
- **Men and women read correctly** (your report):
  - NPCs only roll hairstyles that fit their body (`FEMALE_STYLES` / `MALE_STYLES`).
  - Older saves are fixed on load with `fitHairStyle`, which leaves your own look untouched.
  - The creator re-fits the hairstyle when you switch body.
  - `continueAsChild` used to copy the parent's look, so daughters got the father's body. The heir now keeps their own look.

## Update 0.6 — Ascension (God Mode)
- **Creator:** a new Nature row, Mortal or ⚡ Born a god. Gods start with Health, Smarts, Fitness, Charm, Creativity and Looks at 100, and a phone.
- **Rules** live in `state/systems/god.ts`:
  - **Immortal:** `die()` refuses.
  - **Untouchable:** no jail (`sendToJail`), never caught (`riskCatch`), never hunted (`startPursuit`), and police never come for you (`investigationMonth`).
  - **Crimes:** always succeed, need no gear, and leave no case.
  - **Max money:** the wallet stays at `GOD_WEALTH` ($999,999,999). Spending shows the cost but never lowers it, and debt is cleared monthly.
- **"Become God" app (phone) — powers, each spends a time slot:**
  - Fly (switches city and countryside), Feat of Strength, Fireball, Answer Prayers, Gather Worshippers.
  - ⚡ Smite (pick an adult).
  - 🌋 Level the City and 🌟 Supernova, hold-to-confirm.
- **The world reacts:**
  - news ticker, fame, karma and guilt;
  - a growing follower count;
  - a levelled city stays in sepia ruins for 24 months, then is rebuilt.
- **Harem:** "Invite into your circle" (👑, People → Romance). Members are tagged `harem` + `open`, so there are no cheating penalties.
- **Hard rules, tested in `test-god.ts`:**
  - Smite and crimes never target anyone under 18. Smite needs Dark Crime on, and the player must be 18+.
  - Levelling the city kills nobody.
  - Harem invites are adults only and need the other person's consent. Their own odds decide, so they can say no.
  - Being in the harem never bypasses `canBeIntimate`.
- **Open:**
  - Achievements still count in god lives.
  - No flying or fireball animation on the avatar, only screen flashes, shakes and particles.
  - No separate "commit anything" menu: gods use the normal crime cards and People actions, which can't fail.

## Update 0.5.1 — Fresh Start
- **Character creator, "Where you start" step:**
  - Laws: 🇺🇸 US or 🇪🇺 EU.
  - Start at: 14 or 23.
  - Fortune: Normal or Millionaire (+$1,000,000).
- **Age-23 start:**
  - You begin with a high-school diploma, your own phone, and a shared flat with a roommate.
  - Your parents and siblings are aged to match.
  - No high-school teachers are created.
- **Rules:**
  - `state/rules/eu.ts` mirrors `us.ts`.
  - Each life stores `s.rules`; older saves default to US.
  - `legalAge(g, key)`, `rulesFor(g)` and `tuitionFor(g, listed)` replace every hardcoded 21.
  - The `'illegalUnder21'` legality value is renamed `'underage'`.
- **EU numbers** (placeholders for you to confirm):
  - Ages: drink, smoke, gamble, cannabis and handgun 18; driving permit 16, license 18; part-time work 15; car rental 21.
  - Cannabis is illegal in both regions. Abortion access is available everywhere.
  - Tuition is 10% of the US price. No proof-of-income rule for credit cards.
- **Kidnapping:** carrying both Rope & Zip Ties and the sedative makes it 100%, and uses up both. You still need to be 18+, have Dark Crime on, own a place to hold someone, and pick an adult target.
- **Not done:** money still shows in $ under EU rules, not €.

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
