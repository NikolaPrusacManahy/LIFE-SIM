# HANDOVER.md

## Current patch: Update 0.11 — START-UP
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
- **Desktop time:** 6 actions per sitting (library 4). See 0.9 for the time rule.
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
