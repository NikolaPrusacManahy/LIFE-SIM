# UPDATE 0.13 — "Infinite Lives" (plan)

**Goal:** every life plays differently. You can leave town, own and care for things, chase fame or power, pick up hobbies, live through a real calendar, and leave a legacy.

**Status:** a plan for the designer to review. Numbers marked *(default)* are my placeholders; correct anything.

---

## 0. How it ships

The update is built in eight stages. Each stage passes `npm run verify:quick` before the next starts. All of it ships as one "Update 0.13 — Infinite Lives", with one patch-notes component and one webhook.

| Stage | Content | Why this order |
|---|---|---|
| **V — Visual overhaul** | The stage gets its own space, living scenes, the home that changes as you decorate, activities as gameplay | Every later stage draws into these scenes |
| **A — Wanderlust** | Trips abroad, cars | New scenes and money sinks the later stages use |
| **B — Companions & home** | Pets, decorating, hosting | Builds on the home scene |
| **C — Calendar** | Holidays, parties, weddings & funerals | Gives every month something to look forward to |
| **D — Fame** | Band, sport, acting | Uses fame, the calendar (tours, seasons) and travel |
| **E — Power** | Politics, landlord, small business, stock market | Uses money and fame |
| **F — Hobbies** | Fishing, gardening, painting | Minigames on the 0.12 minigame host |
| **G — Legacy** | Raising kids, family tree, bucket list, legacy score | Ties the whole life together |

**Rules for every stage:**
- Rules stay pure in `state/`; one mechanic per file.
- `Record<Kind, …>` maps for every new kind.
- Every new saved field gets a default in `blankState()`, plus a migration where old content moves.
- Every feature gets `tests/test-<feature>.ts`, and the life simulator (`tests/sim.ts`) learns each new scene.
- One new CSS chunk per stage (`theme-23-*` onward), with a feature prefix.
- Existing gates stay as they are: legal ages through `legalAge()`, plus the Mature Content and Dark Crime toggles.

---

## V. Visual overhaul (stage 1, built first)

**Goal:** the world is the star. The scene sits in its own space (not under the stats card), it feels alive (people moving, lights, a disco ball), and doing an activity means *playing* it.

**Assets:** the designer is sourcing them (Kenney-style flat scenes and furniture, Humaaans or Open Peeps bodies). Until they arrive, everything is built on the current procedural Pixi art with the same layer setup, so swapping in the real art later only means replacing textures. Before anything ships, every asset path is checked with `ls`, files are converted to `.webp` in `public/`, and licenses go in a **Credits** screen.

> **Progress:** V1 stage window ✔ · V2 every place alive ✔ (37 scenes: 16 outdoor, 21 rooms incl. homes with your household; Kenney sky; clickable contacts; Reduced effects). V3 city map + item art + credits ✔ (world map moved to A1) · V4 every activity playable ✔ (76 activities, 14 engines). Next: stage A — Wanderlust.

### V1. The stage gets its own window
- **Viewport:** the scene renders into the box between the stats card and the city list (your red box). In 1440×860 coordinates that's about **x 316–1160, y 24–582** *(default; read from your screenshot)*.
- **Layout:** the stats card, the city list and the action dock no longer overlap the art. The top pills (date, money, buttons) float over the sky band only.
- **Code:** `ui/layout.ts` gets a `STAGE_RECT`; `fx/stage` renders into that rect (a mask plus an offset); the play screen's CSS reserves the space.
- **The camera** frames the player and whoever they're with. Event cards sit over the action dock, never over faces (the existing "no text over character art" rule).

### V2. Living scenes
Each location gets a **scene recipe**: a backdrop (back, mid and front layers), props, an **ambient crowd** and ambient animation.

| Scene | What moves |
|---|---|
| 🏙️ Downtown | Walkers crossing, cars and buses passing, shop signs flickering, pigeons |
| 📚 Library | Readers turning pages, someone pushing a book cart, dust in the light, a librarian shushing |
| 🪩 Nightclub | **Disco ball** with rotating light spots, a dancing crowd (bob and sway), a DJ, a bartender shaking drinks, a beat pulse on the lights |
| 🍺 Bar / roadhouse | Pool players, people at the bar, a neon flicker, a jukebox glow |
| 🏋️ Gym | People lifting, someone on a treadmill, a punching bag swinging |
| 🌳 Park | Joggers, dog walkers, ducks on the pond, leaves or snow by season |
| 🏫 School / campus | Students in the halls, lockers slamming, a teacher at the board |
| 💼 Office | Desks, monitors glowing, coworkers walking past, a printer jam |
| 🏥 Hospital | Nurses with clipboards, the waiting room, a ticking clock |
| 🎰 Casino | Slot lights, a dealer dealing, chips stacking |
| ⛪ Church | Candles flickering, the choir swaying |
| ⛓️ Jail | Guards pacing, the yard, a basketball hoop |

- **Crowd system** (`fx/stage/crowd.ts`):
  - figures built from the body asset parts;
  - simple behaviours: walk across, stand and chat, dance, sit;
  - density by time of day (a quiet library at night, a packed club after midnight);
  - a cap of about 12 figures on screen *(default)* for performance.
- **People you know:** when someone from your contacts is "there" (a classmate at school, a coworker at work), they're in the crowd, and clicking them opens their profile.
- **Kept from today:** day/night sky, seasons, rain and snow.
- **Code:** `fx/stage/scenes/<scene>.ts` (one file per scene), `fx/stage/crowd.ts`, `fx/stage/ambient.ts`. Each `SceneKind` keeps one recipe (`Record<SceneKind, …>` forces it).

### V3. Your home, alive
- **Look by housing tier:** each tier has its own interior: parents' house (your bedroom), studio, apartment, house, mansion, a homeless camp. Moving changes the room.
- **Decorating (B2):** furniture you own shows in fixed slots (sofa, bed, TV, desk, rug, wall art, plants, lamp, kitchen). A wall-colour and flooring pick lives in the Home Store. Comfort shows visually too (a messy vs a tidy room, from chores).
- **Who's home:** your **wife or husband** (or the partner you live with) idles there: on the couch, cooking, reading, waving when you arrive. Also your kids (G1), your pets (B1) and roommates.
- **Night at home:** lamps on, TV glow, the spouse asleep.
- **Code:** `fx/stage/scenes/home.ts` with `homeLayout(tier)` slots, plus a view field listing household members.

### V4. Every activity is playable
Each activity opens a short gameplay scene (15–45 s) instead of a one-click result.
- **Score:** the result goes through `g.mini` / `takeMini` (already used by coding, cooking, writing and the gym). A better score gives better results.
- **Skipping:** autopilot and the simulator skip it and use an average result. A ⏩ **Skip** button in each minigame also takes the average.
- **Building it:** about 14 reusable **minigame engines**, each themed per activity, so they look and play differently without 100 separate games.

| Engine | How it plays | Used by |
|---|---|---|
| 🎵 Rhythm lanes | Notes fall, hit them on the beat | Practice Guitar, Sing in the Choir, karaoke (club), band (D1), Prom Night (dance) |
| 🎯 Sweet-spot timing | Stop the needle in the green | Boxing (combos), Yoga (balance holds), Swim Laps (strokes), Compete, Personal Trainer |
| ⌨️ Key spam *(exists)* | Spam the shown key | Lift Weights, Home Workout, Yard Workout, Extra Drills |
| 🏃 Runner | Side-scroller: jump and duck | Go for a Run, Hike, Skate/BMX tricks, Run (on the run), Take the Back Roads |
| 🧠 Quiz cards | Answer subject questions against a timer | Attend Class, Study, Lecture, Study Group, GED, SAT, Office Hours, Tutor Others |
| 🗣️ Conversation duel | Pick lines to win the mood bar | Debate Team, Run for Student Council, Network, Book Club, Therapy, Make Allies |
| 🧹 Sort & tidy | Drag items to where they belong, against the clock | Do Chores, Kitchen Duty, Day Labour, Help with Harvest, Farm Work, Work Your Shift |
| 🃏 Cards & reels | Real blackjack and poker hands, a slot spin | Blackjack, Poker, High-Roller, Slots |
| 🏀 Aim & arc | Drag to set angle and power | Pickup Basketball, Sports Practice, Feed Ducks |
| 🎣 Cast & reel | Cast, wait, timed reel with line tension | Go Fishing |
| 🌱 Plant & tend | Plant, water and harvest across visits | Gardening, Help with Harvest |
| 🎨 Draw | A simple canvas: palette and strokes, judged on colour and coverage | Sketch Outdoors, painting (F), Drama Club set design |
| 🕵️ Stealth | Sneak past sight cones | Sneak Out, Sneak into the Stacks, Shoplift, Hide, Work on an Escape Plan |
| 🚗 Driving | Top-down lanes: stay in lane, stop at lights | Driving Lesson, Road Test, Steal a Car, racing (A2) |
| ✨ Calm | Slow interactive rest: connect the stars, breathe with the circle | Stargaze, Feed Ducks & Meditate, Lie in the Grass, Me Time, Think About Who You Are |
| *(exists)* Coding / Cooking / Writing / Gym | — | As in 0.12 |

- **Staying one-click:** services and admin, where a game would be a chore: checkups and treatment, surgery, pharmacy, clinic visits, enrolment, licence paperwork, moving, Sleep, Nap, Chill & Scroll. Each still gets a short animated scene on the stage.
- **Code:**
  - engines live in `state/minigames/<engine>.ts` (pure scoring) and `screens/mini/<Engine>Game.tsx` (UI, Pixi where it moves);
  - themes are data (`MINI_THEMES: Record<ActivityId, { engine, skin, prompt }>`);
  - `ActivityDef.mini` grows to cover every engine kind.
- **Tests:** each engine's scoring is pure and tested; each themed activity resolves with and without a played result; the life simulator still finishes lives.

### V5. Performance and fallbacks
- **Loading:** textures are lazy-loaded per scene, with one atlas per scene. Off-screen crowds pause. The settings menu gets a "Reduced effects" toggle (fewer crowd figures, no particles).
- **Missing art:** if an asset is missing, the procedural art draws instead, so the game never shows a blank stage.

---

## A. Wanderlust

### A1. Trips abroad
- **Where:** a new **✈️ Airport** location (the train station keeps the moves and weekend getaways).
- **Planning a trip:** pick a destination, a length and a budget.
  - Length: a weekend (1 slot), a week (the rest of the month) or a month (the whole next month).
  - Budget: hostel, hotel or luxury.
- **Destinations** *(default, 6)*:

  | Place | Signature activities |
  |---|---|
  | 🗼 Paris | Louvre (+creativity), café terrace, Eiffel picnic |
  | 🗾 Tokyo | Akihabara arcades (otaku/gamer encounters), ramen, temples |
  | 🏝️ Bali | Surfing (fitness), yoga retreat (mood), scuba |
  | 🗽 New York | Broadway, rooftop views, networking (career boost) |
  | 🏛️ Rome | Colosseum, cooking class (the cooking minigame) |
  | 🏔️ Swiss Alps | Skiing (fitness, injury risk), spa |

- **The trip scene:** like the night-out scene, with its own Pixi backdrop per city and 4–6 actions a day.
- **Trip events:** a lost passport, a pickpocket, food poisoning, a missed flight, an upgrade to first class, a local who shows you around.
- **Souvenirs:** bag items you can gift (+relationship) or collect.
- **Travel companions:** take a partner, friend or family member along. It counts as quality time with them.
- **Moving abroad:** after 2 trips to the same country you can **🌍 Move here**. Your ruleset follows the country (US vs EU through `rulesFor`). You lose your job unless it's remote.
- **Modules:** `state/travel/{destinations,trip,events}.ts`, `screens/trip/TripScreen.tsx`, `fx/stage/scenes/abroad.ts`.
- **Saves:** `s.trip` (null at home) and `s.visited: Record<DestId, number>`.
- **Tests:**
  - a trip uses the right slots;
  - costs scale with the budget;
  - a lost passport can always be recovered (no soft-lock);
  - moving abroad switches the ruleset.

### A2. Cars
Builds on the existing car assets (sedan, truck, motorbike, sports car).

- **Dealership** (downtown): about 12 models in 4 tiers *(default)*: beater $2k → family $18k → luxury $70k → supercar $350k. Each model has speed, comfort, reliability and **status**.
- **Owning one:**
  - Monthly insurance, fuel and repairs.
  - Breakdowns are more likely on low-reliability or high-mileage cars.
  - Upgrades: paint, rims, engine, sound system.
- **Status:** people react to your car in encounters and on dates.
- **Activities:**
  - 🛣️ a road trip with someone (mood, relationship, a roadside event);
  - 🏁 a track day: a top-down Pixi racing minigame for prize money;
  - 🎬 a drive-in movie as a new date venue.
- **Modules:** `state/cars/{models,garage,race}.ts`, `screens/mini/RaceGame.tsx`, `fx/minigame/raceTrack.ts`.
- **Saves:** `s.garage: OwnedCar[]`; the old car assets migrate into it.
- **Tests:** the migration; monthly costs; breakdown rolls; race scoring; license and age locks.

---

## B. Companions & home

### B1. Pets
The hidden `dog` asset becomes a real pet system.

- **Adopting:** at a new **🐾 Animal Shelter** (cheap) or from a breeder (pricey).
- **Species** *(default)*: dog, cat, rabbit, bird, hamster, fish tank; adults can also get a parrot or a turtle.
- **Each pet has:** a name you type, a breed or colour, an age, happiness, health and a bond.
- **Care:**
  - feeding is automatic and costs money each month;
  - walk, play, train and groom are home or park activities;
  - vet visits at the clinic.
- **Effects:**
  - a happy pet gives mood every month;
  - a dog at the park raises the encounter chance (people come over to pet it);
  - trained dogs can enter shows for prize money.
- **Life cycle:**
  - pets age;
  - they can get sick (vet costs or a worse outcome);
  - they pass away at the end of their lifespan, with a memory and a mood hit.
- **Stage:** your pet appears next to you at home and in the park (a small Pixi sprite per species).
- **Modules:** `state/pets/{species,care,events}.ts`, a phone app **🐾 Pets**.
- **Saves:** `s.pets: Pet[]`; the old `dog` asset migrates into it.
- **Tests:**
  - care keeps a pet happy and neglect lowers its happiness;
  - lifespans are respected;
  - vet bills;
  - the migration.

### B2. Your home
- **Furnishing:** buy furniture in a new **🛋️ Home Store** (or on Nile) in 4 styles *(default: cozy, modern, gamer, luxury)*. It shows up in the home scene.
- **Comfort score:** better sleep (energy), mood each month, and guests react to the place.
- **Rules:** renting allows small items only; owning lets you renovate.
- **Hosting:** 🎉 invite people from your contacts to a dinner, a game night or a house party.
  - Plays as a short scene; guests mingle and relationships move.
  - Neighbours can complain about the noise.
- **Modules:** `state/home/{furniture,comfort,hosting}.ts`, `fx/stage/scenes/homeDecor.ts`.
- **Saves:** `s.furniture`.
- **Tests:** the comfort math; renter limits; hosting relationship effects.

---

## C. The calendar

- **Holidays as monthly events** (they follow the in-game month):

  | Holiday | What happens |
  |---|---|
  | 🎃 Halloween | Costume shop, a party or trick-or-treating (younger players), a haunted house |
  | 🦃 Thanksgiving (US) / harvest dinner (EU) | Family dinner: relationships, arguments |
  | 🎄 Christmas | Gifts to contacts (+rel), family visit, office party |
  | 🎆 New Year's Eve | Parties, a midnight moment, resolutions (become bucket-list goals in G) |
  | 💝 Valentine's Day | A special date venue; singles get a speed-dating night |
  | 🎂 Your birthday | Throw a party (the hosting scene), presents from people close to you |

- **Other people's big days:** wedding invitations (a gift, a speech minigame, a dance) and funerals (say goodbye, comfort family).
- **Calendar app:** the phone's Calendar shows upcoming holidays, birthdays and plans.
- **Modules:** `state/calendar/{holidays,parties}.ts`, events in `state/events/holidays.ts`.
- **Tests:** each holiday fires once a year in the right month; gifts change relationships; invitations expire.

---

## D. Fame careers
Deeper than a job card: each is a career track with its own app or scene, months of progress and a fame curve.

### D1. Music
- **Starting out:** learn an instrument (F5), form a band with friends or strangers (a Discorb ad).
- **Practice:** band rehearsals, played as a rhythm minigame (Pixi note lanes).
- **Climbing:**
  - gigs: open mic → bars → venues → arenas;
  - release singles and albums on a streaming parody site (monthly streams = income);
  - a record label deal (an advance, a cut);
  - tours, using the travel cities from A1.
- **Drama:** band members can quit, creative fights, a one-hit wonder or a comeback.

### D2. Sport
- **Pick a sport** *(default: football/soccer, basketball, tennis, boxing)*.
- **The path:** school team → college scholarship → draft or tryouts → pro seasons.
- **A season:** monthly matches resolved by fitness and a short minigame for key moments.
- **Contracts:** salary, sponsors, transfers.
- **Injuries:** minor ones cost weeks; a major one can end a career.
- **Retirement:** coaching or punditry afterwards.

### D3. Acting
- **Auditions:** a reading minigame (pick the right tone for each line).
- **Roles:** extra → side role → lead; TV vs film.
- **Life on top:** red carpets, paparazzi, interviews, awards nights.

**Shared modules:** `state/fame/{band,sport,acting,shared}.ts`, `screens/fame/*`, `screens/mini/{Rhythm,Match,Audition}Game.tsx`.
**Saves:** `s.band`, `s.athlete`, `s.acting`.
**Tests:** progress curves, contract money, injury odds, that the minigame results feed outcomes, and that no stage can soft-lock.

---

## E. Power

### E1. Politics
- **Ladder:** volunteer → city council → mayor → governor → **president** (the final, hardest stage: national campaign, high fame and karma required, one term at a time).
- **Elections:** every 2–4 in-game years, with a campaign scene: rallies, a debate (a choice minigame), ads (money), endorsements.
- **Polls:** move with fame, karma, the economy and scandals.
- **In office:** monthly decisions (budget, a new park, taxes) that change the city: rent prices, crime rate, job market.
- **Scandals:** old Chirp posts, your record and secrets can surface.

### E2. Landlord
- **Buying:** properties beyond your own home (realty already exists): apartments, houses, a small building.
- **Renting out:** tenants with traits (pays on time, late payer, party animal, handy).
- **Running it:** monthly rent, repairs, vacancies, evictions (a choice event), renovation for higher rent.

### E3. Small business
Separate from START-UP: smaller, steadier, hands-on.
- **Types** *(default)*: café, bar, salon, food truck, bookstore.
- **Running it:** staff, prices, a menu or services, reviews, a slow season.
- **Working there:** you can work a shift yourself (an activity), with regulars who become contacts.
- **Modules:** `state/business/*`, reusing the START-UP UI patterns.

### E4. Stock market
- **Replaces** the single "invest" number with a **📈 Brokerage** app on the computer.
- **The market:**
  - about 15 fictional companies across sectors;
  - prices move monthly with news headlines;
  - your START-UP can IPO and be listed there.
- **Trading:** buy and sell (no computer energy, per the 0.12 rule), dividends, crashes and booms (like Bitcons, but steadier).
- **Migration:** the old invest flag becomes an index fund holding.

**Tests:** election odds and poll math; rent and eviction flows; business profit; stock prices bounded; the invest migration.

---

## F. Hobbies (minigames)

| Hobby | Where | Minigame | Reward |
|---|---|---|---|
| 🎣 Fishing | Lake, Bali trip | Cast, wait, timed reel (Pixi) | Fish to sell or cook, a fish collection |
| 🌱 Gardening | Home (yard/balcony) | Plant, water, harvest over months | Produce to sell or cook, mood |
| 🎨 Painting | Home, art class | Pick palette and strokes (simple canvas) | Paintings to sell at a gallery; value grows with skill and fame |

- **Skill levels:** each hobby has one (0–100); higher levels unlock better gear and events.
- **Modules:** `state/hobbies/*`, `screens/mini/*` (fishing, painting, gardening; rhythm for the band), `fx/minigame/*`.
- **Not in 0.13 (designer decision):** chess and collecting. The instrument lives in the band track (D1).
- **Tests:** scoring rules for each minigame; harvest timing; painting prices bounded.

---

## G. Legacy

### G1. Raising kids
- **Growing up by stage:** your children grow month by month: baby → toddler → child → teen.
- **Each stage offers parenting activities:**
  - read together, play, help with homework, teach a skill;
  - set rules (strict / relaxed);
  - pay for lessons (music, sport, tutoring).
- **Choices shape the child's stats and traits.** When you continue as your child (this already exists), they start with what you gave them.
- **Events:** first steps, first day of school, tantrums, teen rebellion, report cards, their first job.

### G2. Family tree
- **A 🌳 Family Tree screen:** every generation, with portraits, life summaries and causes of death.
- **What carries over:**
  - inherited wealth, a will (choose heirs), the family home;
  - a family business or START-UP stake;
  - family reputation (fame, karma, a criminal name).
- **Grudges and alliances** between families can carry over too.

### G3. Bucket list & legacy score
- **Bucket list:** each life rolls 5 goals *(default)* from its traits and starting situation, for example "visit Tokyo", "own a dog", "win an election", "release an album", "retire at 50". You can also add goals on New Year's Eve (C).
- **Completing goals** gives a mood boost and adds to a **legacy score**.
- **Legacy score:** carries across generations, with dynasty milestones (first millionaire, first mayor, 5 generations).
- **Title screen:** a "Hall of Lives" shows past lives and dynasty records.

- **Modules:** `state/legacy/{parenting,tree,bucket,score}.ts`, `screens/legacy/*`.
- **Saves:** `s.kidsCare`, `s.bucket`; a cross-save `legacy` store, separate from the slots.
- **Tests:**
  - parenting changes the heir's stats;
  - inheritance totals;
  - bucket goals are completable (each has a test path);
  - the legacy score persists.

---

## Cross-cutting work
- **Locations:** ✈️ Airport, 🐾 Animal Shelter, 🛋️ Home Store, 🚗 Dealership, 🏛️ City Hall, 🎤 Venue / Stadium / Studio (unlocked by the fame tracks). Each gets a `SceneKind`, a scene recipe, a `LOCATIONS` entry and at least one activity.
- **Phone apps:** 🐾 Pets, 🗓️ Calendar (expanded), 🎵 Band, 🏛️ Campaign, 🏠 Properties, 🌳 Family Tree, ✅ Bucket List.
- **Computer apps:** 📈 Brokerage, a streaming parody site, a business manager.
- **Life simulator:** `tests/sim.ts` learns trips, pets, hosting, seasons, elections and parenting, so whole lives still run to the end without soft-locks.
- **Balance pass at the end:** money from every new source compared with the current economy (jobs, START-UP, crime), so no new feature outpays everything else.
- **Docs:** patch notes "Update 0.13 — Infinite Lives" (one card per feature group), the webhook (max 10 embeds, so one per stage plus an intro), HANDOVER, DEVELOPMENT, and the title/phone version v0.13.
- **Visuals:** the new scenes, minigames and screens can't be checked without a browser. Each stage ends with a list of what to check in-game.

## Waiting on the designer
- **Visual assets** for V (bodies, scenes, furniture). The plan starts V on the procedural art and swaps textures in when the packs land in `ASSETS/`.

## Decisions (designer, answered)
1. **Size:** one 0.13, built in stages *(default kept; not answered)*.
2. **Destinations:** the 6 cities, for a start.
3. **Sports:** football, basketball, tennis, boxing.
4. **Politics:** up to **president**, the final and hardest stage.
5. **Hobbies:** painting, gardening and fishing only. No chess (or collecting) yet.
6. **Legacy:** approved as planned; the Hall of Lives is shared across save slots *(default)*.
