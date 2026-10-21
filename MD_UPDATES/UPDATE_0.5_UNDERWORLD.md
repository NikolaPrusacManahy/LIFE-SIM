# Update 0.5 — "Underworld" (design brief)

Scope: crime system, black-market shop, criminal properties (garage, warehouse, basement), kidnapping & blackmail, drug business, murder with an evidence/cover-up puzzle, police investigation, pursuit/fugitive mode, and long-tail consequences.

Tone: dark, consequence-heavy, non-graphic. Crimes are choices with odds and outcomes, written like a crime drama, never like a manual. Violence resolves in one short line; the game focuses on what happens after.

---

## 0. Hard rules (code-enforced, tested)

1. **Minors are never crime targets and never commit adult-tier crimes.** Under-18 NPCs are filtered out of every crime target list. An under-18 *player* only has the juvenile crimes from 0.2 (shoplifting, vandalism, fights, underage drinking), and the juvenile justice system applies.
2. **Crime and intimacy never mix.** Any NPC who is captive, sedated/drugged, intoxicated past the threshold, or being blackmailed is flagged `cannotConsent`. Every 0.4 intimacy action is hidden for them. Blackmail demands are limited to money, favours, silence, information, or quitting/doing a job — never anything sexual.
3. **No real-world method detail.** Drug products, poisons and sedatives are fictional names with game stats. Cover-up actions are abstract verbs ("Dispose of the weapon"), not techniques.
4. **No graphic violence text.** One-line outcomes ("It's over. Your hands won't stop shaking.").
5. The **Mature Content** setting from 0.2 gets a second toggle: **Dark Crime** (murder, kidnapping, drug empire). Off = only petty crime.

---

## 1. Crime tiers

| Tier | Age | Examples | Typical consequence |
|---|---|---|---|
| Juvenile | 14–17 | Shoplift, vandalise, fight, underage drinking, fake ID | Grounding, suspension, juvenile court, detention, sealed record |
| Petty | 18+ | Pickpocket, shoplift, trespass, scam, sell fake goods | Fine, probation, short jail |
| Property | 18+ | Burglary, car theft, arson, fraud, embezzlement (needs job) | Jail 1–5 yrs |
| Organised | 18+ | Drug dealing, running a warehouse, money laundering, smuggling, protection racket | Prison 5–20 yrs, assets seized |
| Violent | 18+ | Assault, armed robbery, kidnapping, blackmail/extortion | Prison 5–25 yrs |
| Capital | 18+ | Murder, manslaughter, poisoning | Prison 25–life |

Every crime card shows: **Success %**, **Heat +**, **Evidence risk**, **Karma −**. Stats affect odds (Fitness for running, Smarts for fraud and cover-ups, Charm for scams and interrogations, Fame makes you recognisable).

---

## 2. Heat, wanted level and reputation

- **Heat (0–100)**: police attention on you personally. Rises with crimes, evidence, witnesses, spending money you can't explain. Decays slowly if you lie low.
- **Wanted level (★ to ★★★★★)**: appears when an investigation names you as a suspect. ★★★★ triggers **Pursuit mode** (section 9).
- **Street Rep (0–100)**: criminal reputation. Unlocks contacts, crew, better deals. High Rep also attracts rivals and informants.
- **Karma** keeps its role: low Karma changes how family, partners and strangers react.

---

## 3. Black market (weapon & tools shop)

Location: **The Back Room** (hidden; unlocks after meeting a contact through a crime event or Street Rep ≥ 15). Legal items also sold at a regular **Gun Store / Hardware Store**.

| Item | Legal route | Black market | Game effect |
|---|---|---|---|
| Pocket knife | Hardware, 18 | — | +Intimidation, assault/robbery option |
| Combat knife | Hardware, 18 | Cheaper, untraceable | Higher success, more evidence if used |
| Pistol | Gun store, 21 + license + background check (fails with record) | No paperwork, "dirty" history (may already be tied to other crimes) | Armed robbery, murder; huge sentence multiplier |
| Shotgun / rifle | Gun store, 18 + license | — | Hunting (countryside), home defence events |
| Mask / balaclava | Shop | — | Witness ID chance −; suspicious if found |
| Gloves | Shop | — | Evidence risk − |
| Rope / zip ties / chains | Hardware | — | Required for kidnapping |
| **Sedative syringe** ("Dreamline") | — | Black market | Kidnap/robbery option; chance of failing or harming victim (manslaughter risk) |
| **Poison vial** ("Nightshade-7") | — | Black market | Poisoning (slow, low witness risk, toxicology risk) |
| Burner phone | Shop | — | Digital evidence − |
| Lockpick set | — | Black market | Burglary success + |
| Crowbar | Hardware | — | Burglary, weapon |
| Duffel bag | Shop | — | Carry loot / product |
| Police scanner | — | Black market | Warns of raids (Heat events) |
| Fake passport | — | Expensive contact | Needed to flee the country (section 9) |
| Bulletproof vest | — | Black market | Survive a shootout outcome |

All illegal items raise the stakes of searches (0.4 confiscation system): found in your car, house, or on you → charges.

---

## 4. Properties

Bought via **Housing → Properties** tab (separate from your home). Each has upkeep, a **Suspicion** meter (neighbours, utility bills, traffic), and can be raided.

| Property | Price | Uses |
|---|---|---|
| Garage / lock-up | $ | Store stolen cars, chop shop (sell parts), hide a car during pursuit |
| Basement (house with basement, or convert your own) | $$ | Holding a captive, hidden stash room, panic room |
| Warehouse | $$$ | Drug business, storage, fencing stolen goods, front business |
| Storage unit | $ | Hide evidence/stash; random "unit auction" events |
| Countryside cabin | $$ | Safe house for Pursuit mode, hunting, grow operation |
| Front business (laundromat, car wash, nightclub, food truck) | $$–$$$$ | Money laundering (turns dirty money clean) |
| Boat (docks) | $$$ | Smuggling, escape route |

Upgrades: soundproofing, cameras, reinforced door, hidden compartment, guard dog, lookout crew.

---

## 5. Kidnapping & blackmail

### Kidnapping (18+ target, Dark Crime on)
Flow: **Pick target** (any adult NPC you know: stranger, family, crush, partner, spouse, rival, boss) → **Plan** (needs rope/zip ties + vehicle or sedative + basement/warehouse) → **Attempt** (Fitness/Smarts check, witness roll) → **Holding**.

While holding someone (captive status in their profile):
- Each month: **Missing person** investigation grows; their family and friends post flyers, call you, ask if you've seen them (lie checks).
- Captive mood/health meter; low health → manslaughter risk.
- Escape chance each month (lower with upgrades).
- Options: **Demand ransom** (from their family), **Blackmail** (they promise to stay silent / pay / do something), **Release** (they may go to police — Trust/Fear check), **Let them go somewhere far** (they disappear from your life).
- Stockholm event chain possible: the captive's attitude to you changes, adding a twist to their release.
- Guilt meter rises (section 12).

### Blackmail (no kidnapping needed)
Gather **leverage** on an adult NPC: secrets from trait discovery (0.4: "Has a secret"), affairs you witnessed, crimes they committed, photos from events.
Demands: money (one-off or monthly), a promotion/job, silence about your crimes, information, ruin a rival, drop charges.
Risks: they go to police, they fight back (counter-blackmail), they hire someone, they break (tragedy event → guilt).

---

## 6. Drug business (warehouse)

Fictional products, game-economy only.

| Product | Unlock | Margin | Heat |
|---|---|---|---|
| "Green" (grow-op, cabin or warehouse) | Rep 10 | Low | Low |
| "Pills" | Rep 25 | Medium | Medium |
| "Dust" | Rep 45 | High | High |
| "Blue Static" (signature product) | Rep 70 + chemist crew member | Very high | Very high |

### Loop (monthly)
1. **Supply**: buy from a supplier NPC (trust, price, may be undercover).
2. **Produce / store**: warehouse capacity, quality (crew skill).
3. **Distribute**: hire dealers (NPCs from contacts with traits: Loyal, Greedy, Snitch, User).
4. **Sell**: territories on a city map; demand per district.
5. **Launder**: dirty cash must go through a front business or it raises Heat when you spend it.

### Events
Rival crew moves into your territory, a dealer gets arrested (will they talk?), a customer overdoses (Karma −−, investigation), quality scandal, supplier betrayal, DEA raid, a cop offers to look the other way for a cut, your family finds the cash, your kid (when grown) wants in, cartel offers partnership.

### Crew
Recruit adult NPCs into roles: **Chemist, Muscle, Driver, Accountant, Lookout, Lawyer**. Each has loyalty and traits; a disloyal crew member is the biggest risk in the game.

---

## 7. Violent crimes on people you know

Any adult NPC can be a target (family, crush, partner, spouse, ex, rival, boss, stranger). Knowing them changes everything:
- **Motive** is automatic evidence: spouse/partner/ex = police look at you first. Inheritance, insurance, affair, debt, rivalry all create motive.
- **Relationship web reacts**: their friends and family become investigators-by-grief (they text you, accuse you, hire a PI).
- **Family crimes**: inheritance is frozen during investigation; if convicted you can't inherit (slayer rule).

### Murder methods (abstract)
Each method sets base success %, witness chance, and which evidence tags it creates.
| Method | Needs | Creates evidence tags |
|---|---|---|
| Confrontation (knife / weapon) | Weapon | Weapon, Body, Trace, Witness? |
| Gun | Pistol | Weapon, Body, Noise→Witness, Ballistics |
| Poison | Poison vial + access (dinner, drink) | Body, Toxicology, Purchase record, Motive |
| Sedative "accident" | Sedative | Body, Toxicology, Staged scene |
| Staged accident (fall, car, fire) | Smarts check | Body, Staged scene |
| Hire someone | Money + Rep + contact | Money trail, Hitman (can betray you) |
| Manslaughter (unplanned, from fights/crimes) | — | Body, Witness, Panic |

---

## 8. The cover-up puzzle ("guess what the scene needs")

After a crime the game generates a **Crime Scene** with hidden **evidence tags**. You get a limited number of actions (depending on time pressure, Energy, Smarts) and must pick the ones that match. You see clues, not the answer.

### Evidence tags (hidden until investigated or deduced from clues)
`Body`, `Weapon`, `Trace` (things you left behind), `Witness`, `Camera`, `Digital` (phone/messages/location), `Money trail`, `Purchase record`, `Toxicology`, `Vehicle`, `Motive`, `No alibi`, `Staged scene`.

### Clue examples (what the player sees)
- "A neighbour's light came on." → hint at `Witness`
- "There's a doorbell camera across the street." → `Camera`
- "You texted them an hour ago." → `Digital`
- "You bought it with your card." → `Purchase record`
- "Everyone knows you two were fighting." → `Motive`

### Cover-up actions (abstract, each a game card with a % and a cost)
| Action | Resolves | Risk |
|---|---|---|
| Dispose of the weapon | Weapon | Found later (lake dragged, dumpster search) |
| Clean the scene | Trace | Incomplete clean → forensic hit later |
| Move / hide the body | Body | Discovered by hikers/dogs/construction years later |
| Stage it as an accident | Body, Motive | Detective notices something off |
| Burn the evidence | Trace, Weapon | Fire draws attention |
| Build an alibi (ask a friend to lie) | No alibi | Friend may crack under questioning |
| Delete messages / ditch the phone | Digital | Cloud backup recovers it |
| Intimidate / pay off witness | Witness | They go to police, or blackmail you |
| Pay a fixer | Several tags | Expensive, fixer owns you |
| Frame someone else | Motive (shifts it) | They have an alibi → suspicion doubles |
| Do nothing, act normal | — | Charm check during questioning |

Wrong or missing actions leave tags open → investigation finds them. Doing **too much** (burning a car, sudden trip abroad, spending big) adds a new tag: `Suspicious behaviour`.

---

## 9. Investigation, arrest, trial

### The Detective (nemesis NPC)
When a serious crime happens, a **Detective** NPC is generated (person chip, traits: Relentless, Corrupt, Rookie, Burned-out, Brilliant). Has an **Evidence Board** that you can sometimes glimpse (via a corrupt cop, a hacker, or an interview), showing which tags they've found. Detectives return for future crimes and remember you.

Monthly investigation roll per open tag. Events: police interview (choices: lawyer up, lie, stay silent, confess; Charm + Smarts checks), search warrant on your properties, they talk to your partner, a witness comes forward, an anonymous tip (a rival or crew member).

### Arrest → Trial
- **Lawyer**: public defender (free, weak), private (expensive, strong), crooked (bribes jurors, extra risk).
- **Plea deal** vs **trial** (jury verdict based on evidence strength, lawyer, your Charm, Fame).
- **Snitch option**: give up your crew/supplier for a lighter sentence → Witness Protection (new name, new city, crew wants you dead).
- Sentences: fines, probation, jail, prison; assets seized; record blocks careers.

### Prison life (new location)
Activities: workout, library/GED, kitchen job, make allies, join a gang (protection vs. obligations), contraband trade, fights, parole hearing (behaviour + Karma), escape plan (multi-month chain). Visits from family/partner; partner may leave you. Kids grow up without you (relationship decay).

---

## 10. Pursuit mode (fugitive)

Triggered at ★★★★ or escaping custody.

- The UI changes: red-tinted HUD, **wanted poster** of your avatar, a city/countryside map with **police heat zones** that spread each slot.
- You **can't** use your home, bank cards (traced), or normal phone. Locations where you're known are dangerous.
- Each slot: pick a move — **Run** (Fitness), **Hide** (safe house, cabin, friend's place: trust check), **Disguise** (dye hair, change clothes: Looks/recognition), **Steal a car**, **Take back roads**, **Call in a favour**, **Turn yourself in**.
- **Countryside life**: you settle in a remote area under a fake name. New activities: farm work cash-in-hand, hunting, fishing, small-town gossip (locals may recognise you from the news), the sheriff who's a bit too friendly.
- Every few months: **TV news** mentions your case; Fame raises recognition chance.
- Endings: caught (shootout outcome chance with ★★★★★), surrender (sentence reduced), **flee the country** (needs fake passport + money + boat/airport contact → new country, new life, can never come back), or **live the long quiet life** until a cold-case event.

---

## 11. Consequences on family & relationships
- Partner/spouse finds the stash or cash → confront: join you, leave you, turn you in, blackmail you.
- Kids learn what you did → relationship −−, may follow your path (Rep inherits) or become a cop.
- Parents disown you, or cover for you (they become accessories).
- Victims' families: recurring events for years (anniversaries, vigils, a sibling who never stops looking).
- Your Fame turns into **infamy** — strangers treat you differently in encounters.

---

## 12. Creative additions

1. **Guilt & conscience meter**: each violent crime adds guilt. High guilt → nightmares (Energy −), paranoia events (you think the cashier knows), drinking more, confession urges. Reduce it at St. Jude's confession booth (priest can't tell, but a nosy churchgoer overhears), therapy (therapist may report imminent threats), or by doing good. Low-guilt "cold" characters get a "Sociopath" trait: no guilt, but NPCs sense something off (Charm penalty).
2. **The cold case**: a crime you got away with can reopen years later ("New DNA technology…") — even after you're dead, landing on your **heir** in the next generation (their inheritance seized, reporters at the door).
3. **True-crime podcast**: if a case goes unsolved, a podcaster NPC starts investigating it. Episodes drop as events; their theory gets closer to you. You can befriend them, mislead them, or…
4. **Butterfly witness**: random NPCs from 0.4 encounters can turn out to be witnesses months later ("Wait — I've seen you before.").
5. **Generational crime family**: when you die, your heir can inherit the warehouse, crew and enemies. Choose "go legit" or "the family business".
6. **Moral dilemma events**: your rival is in trouble and you could save them; a crew member's child is sick; a cop you paid is about to get caught.
7. **Corrupt-cop path**: become a police officer (existing career) and run crime from inside — double life meter.
8. **Vigilante path**: crimes only against criminals; Karma stays high, police still hunt you.
9. **Redemption arc**: leave crime, go clean (testify, rebuild relationships, open a youth centre with laundered… legit money). Your past still knocks.
10. **The double life meter**: each lie you tell to family/partner adds to a "Cover story" stack; contradictions between lies trigger "Wait, you said…" events.
11. **News ticker** on the title bar during big cases ("Body found in Riverside Park; police seek witnesses").
12. **Insurance / inheritance scams**: fake your own death (huge chain: new identity, watch your funeral, your partner remarries).
13. **Heists** (crew of 2–4): casino, bank, armoured truck, art gallery. Planning board: pick crew roles, entry, escape; one random complication per heist.
14. **Prison ending variety**: die in prison, released at 70 to a world that moved on, write a memoir (Fame), become a youth speaker.

---

## 13. UI
- **Crime tab** on the phone (only appears after first crime or Rep ≥ 5): Heat, Wanted ★, Rep, active investigations, crew, properties, territories.
- **Crime cards** use a darker red style with risk chips: `⚠ Heat +20 · 👁 Witness 35% · ⚖ 10–25 yrs`.
- **Evidence screen** after a crime: clues as cards, action slots, a timer bar.
- **Pursuit HUD**: red vignette, wanted poster, map.
- **Prison**: greyscale world scene, cell background, visit room.

---

## 14. Implementation notes & tests
- Modules: `crime/tiers.ts`, `crime/evidence.ts`, `crime/investigation.ts`, `crime/pursuit.ts`, `properties/`, `business/drugs.ts`, `crew/`, `prison/`, `justice/trial.ts`.
- `isValidCrimeTarget(npc)` → `npc.age >= 18` and Dark Crime on for violent tiers.
- `cannotConsent(npc)` → captive || sedated || intoxicated ≥ threshold || being blackmailed by player. `canBeIntimate()` from 0.4 must return false when this is true.
- **Verify tests:**
  - 1,000 lives: no under-18 NPC ever appears as a crime target.
  - Under-18 players only ever get juvenile outcomes.
  - No intimacy action ever offered to an NPC flagged `cannotConsent`.
  - Blackmail demand list never contains a sexual option.
  - Every crime has at least one evidence tag and one matching cover-up action.
  - Wanted ★★★★ always enters pursuit mode; surrender always available.
- Balance: crime should be lucrative but most simulated criminal lives should hit at least one serious consequence. Log arrest rate, average sentence, cold-case hits per 1,000 lives.

---

## 15. Messages app (real chat interface)

### 15.1 Layout (inside the existing phone UI)
- **Inbox view**: list of conversations, each row = person chip (portrait, name, ♂/♀/⚧, label), last message preview, time ("Oct · Night"), unread badge, pinned chats at top, group chats below.
- **Chat view**: proper messenger layout.
  - Header: portrait, name, label, relationship mini-bars, "last seen" (based on their Night owl / Early bird trait).
  - Bubbles: yours right (accent colour), theirs left (grey). Timestamps grouped by time slot.
  - **Typing indicator** ("…") with delay based on their traits (Clingy = instant, Busy = slow, Playing it cool = waits on purpose).
  - Read receipts: Delivered → Read. "Left on read" is a mechanic (relationship − if they ignore you, or if you ignore them).
  - Reactions on bubbles (❤️ 😂 😮 😢 👎) — NPCs react to yours too.
  - Photo messages show as a blurred card with a label ("📷 Selfie", "📷 Private photo") — no actual images of bodies, ever.
- **Composer**: no typing. Bottom bar = category tabs; tapping a tab opens a grid of message chips. Each chip shows a small preview of the line and, when relevant, odds (`💬 Ask them out · 62%`) and risk chips (`⚠ Could screenshot`).
- Sending a message **does not use a time slot** (texting is free), but you're limited to **3 messages per contact per slot** so it can't be spammed. Replies arrive immediately or in a later slot depending on the NPC.

### 15.2 Who you can text
Only contacts where `youHaveTheirNumber = true` (from 0.4). Blocked contacts can't receive. Dead / jailed / captive contacts: chat is read-only (jail: they can call collect; dead: an ache — you can still read the old messages, which is its own emotional moment).

### 15.3 Message categories

| Tab | Messages | Notes |
|---|---|---|
| 👋 **Greet** | Hey · What's up? · Good morning ☀️ · Good night 🌙 · Miss you · Long time no see | Small friendship +; "Miss you" weighed by romance |
| 💬 **Talk** | How was your day? · Tell me something about yourself · What are you up to? · Send a meme · Share a song · Gossip about {npc} · Vent about your day · Ask for advice | Reveals traits (0.4 trait progress) |
| 🌊 **Deep** | What are you afraid of? · What do you want from life? · Do you believe in God? · What's your biggest regret? · Do you want kids someday? (18+) · What do you think of me, honestly? | Needs friendship ≥ 40; big trait reveals, trust + |
| 💘 **Flirt** | Compliment · Cheesy pickup line · Playful tease · "You looked good today" · "Do you like me?" · "I like you" · Send a selfie 📷 · Send a flirty selfie 📷 (18+) | Only if `isRomanceEligible`; outcome by attraction/romance |
| 📅 **Plans** | Hang out? · Ask them out · Come over? · Can I come over? · Party tonight? · Study together? · Gym together? · Movie night? | Accepted plan creates a scheduled activity in a chosen slot |
| 🔥 **Intimate (18+)** | "Come over… 😏" (partner / spouse / FWB / situationship) · "I can't stop thinking about last night" · Send a private photo 📷 · Ask for a private photo · Booty call (Night slot) | See 15.5 |
| 💸 **Money** | Ask to borrow money · Ask for money back · Send money · Ask sugar daddy/mommy for an allowance · Offer to pay for dinner | Opens amount picker; ties into Bank |
| 🙏 **Support** | Are you okay? · I'm here for you · Congratulations! · Happy birthday 🎂 · Sorry for your loss · I'm sorry (apology) | Big swings when sent at the right event |
| 😠 **Conflict** | Insult · Roast them · "We need to talk" · Accuse of cheating · Break up by text (Karma −, everyone judges you) · Block | Rivalry/romance changes; can screenshot-spread |
| 🗡 **Underworld (18+, Dark Crime)** | Menace · Send a threat · Blackmail (pick leverage + demand) · Demand payment · Order crew member · Arrange a deal · "Delete this conversation" | Every message here creates `Digital` evidence unless sent from a **burner phone** |

### 15.4 Reply system
Each message → reply chosen from a line pool keyed by `message.archetype.labelBand.outcome` with pronoun tokens. Outcome = f(relationship values, attraction, their traits, their mood, time of day, recent memory). Examples:

**"Do you like me?"** (Ask if they like us)
- High romance: "took you long enough 😳 yes."
- Friend-zone: "you're like my brother/sister lol" (pronoun-aware)
- Shy trait: "…why are you asking" → second message 20 min later "maybe"
- Player trait: "depends, do *you* like *me*? 😏"
- Low: "who is this"

**"Ask for money"**
- Generous + close: "how much? sending now 💸" (money arrives)
- Cheap trait: "bro I'm broke too"
- Parent: "Again? What happened to the last $200?"
- Sugar daddy/mommy: "Only if you make it worth my while — dinner Friday."

**"Menace"**
- Fearful: they comply, then 30% chance they screenshot to police
- Hot-headed: "come say that to my face" → fight event
- Has leverage on you: "go ahead. I still have the photos."

Replies can **branch**: some replies give you a new chip set ("They say they're at a party. → [Join them] [Who's there?] [Have fun]").

### 15.5 Intimate messages & private photos (18+, mature on)
All gated by `canBeIntimate(player, npc)` (both 18+, mature content on, not `cannotConsent`). The photo itself is never shown — just a blurred card labelled "📷 Private photo" and the NPC's reaction.

**Sending a private photo** — reaction depends on label, romance, attraction, traits, and whether they asked for it:
| Context | Typical reactions |
|---|---|
| Partner / spouse, high romance | "🔥 come over. now." · "you're trouble 😍" — romance +, mood + |
| FWB / situationship | "lol perfect timing" · "is this an invitation?" → plans |
| They asked for it | Positive, trust + |
| Crush, flirting stage | Coin flip: "wow… okay 😳" / "that was fast. too fast." — can kill the romance |
| Friend (not romantic) | Funny: "WRONG CHAT??" 😂 · awkward: "…I'm going to pretend I didn't see that" · Freak-out: they unfriend you |
| Stranger / acquaintance / coworker / boss / professor | **Unsolicited** → mostly bad: blocked, reported, Karma −−, school or HR complaint, possible harassment charge at high levels |
| Family | Instant "WRONG CHAT" disaster event chain (humiliation, Mood −−, family relationship −, becomes family legend) |

**Long-tail risks** (the consequences are the point):
- **Screenshots**: Gossip / Manipulative / Vindictive NPCs may keep or share them. Leak events: rumours at school/work, Fame/Karma changes, partner finds out.
- **Breakups**: an ex with your photos is a blackmail risk (they can use the 0.5 blackmail system on you). Sharing someone's private photos without consent is a crime the player can be charged with, and NPCs can be charged when they do it to you (revenge-photo case → court event).
- **Wrong recipient** chance when texting fast (3 messages in one slot) or when Intoxicated.
- Asking for a photo: their response respects their traits and comfort; pushing after a "no" lowers trust and Karma and can get you blocked. No option to pressure past a second refusal.

### 15.6 Group chats
- Auto-created: Family, Friend group, Class/college group, Work team, Crew (Underworld).
- Random group events: someone posts something embarrassing about you, a fight breaks out, birthday plans, someone gets kicked out, a screenshot from a private chat gets leaked into the group.
- You can send to the whole group (same chip system, different reply pool, multiple NPCs answer).

### 15.7 Incoming messages (NPCs text first)
Based on traits and relationship: good-morning texts (Clingy/Romantic), memes (Funny), "u up?" (18+ only, Player/FWB), money requests (Broke/Manipulative), drunk texts at Night (Party animal, 21+ or illegal under 21), exes at 2am, crew updates, threats from rivals, the Detective ("We'd like to ask you a few more questions."), unknown numbers (scams, wrong-number meet-cutes, a mysterious "I know what you did").

### 15.8 More ideas
- **Unsend** (30% chance they already saw it).
- **Drafts & regrets**: when Intoxicated, a "Drunk text" chip appears with random content you don't fully control.
- **Voice notes** (shown as a waveform bubble, flavour text only) — Charm check, higher impact.
- **Pin, mute, archive** chats; muting family has consequences.
- **Phone gets checked**: partner snooping (Jealous trait) scans your chats; incriminating messages = fights. Police warrant reads all chats = evidence.
- **Burner phone** (inventory): separate inbox, no Digital evidence, but if found it's suspicious.
- **Hacked phone** event: a rival/hacker gets your messages.
- **Seasonal/auto messages**: holidays, anniversaries ("You forgot." if you don't text on your anniversary).
- **Last messages**: when an NPC dies, their final texts stay; a "Read old messages" option gives Mood −/closure.

### 15.9 Tests (add to verify)
- No 🔥 Intimate chip or flirty-selfie chip is ever offered when either person is under 18, mature content is off, or the NPC is `cannotConsent`.
- Under-18 players never see the 🔥 Intimate or 🗡 Underworld tabs.
- Private-photo and ask-for-photo chips never appear in a chat with anyone under 18, including group chats containing anyone under 18.
- Every message chip has at least 3 reply lines per outcome band, and every reply template resolves pronoun tokens for all pronoun sets.
- Underworld messages always add `Digital` evidence unless sent from a burner.
