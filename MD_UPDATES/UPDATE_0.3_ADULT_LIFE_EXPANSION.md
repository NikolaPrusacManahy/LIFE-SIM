# Update 0.3 — "Coming of Age" (design brief)

Scope: age-accurate legal gating, a big expansion of activities, locations and events, and an 18+ intimacy system with real consequences. The game stays **non-explicit** (BitLife / Sims style): actions are menu choices with outcomes, scenes fade to black, and the writing is about consequences, not description.

---

## 0. Ruleset: United States

The game already uses Grade 9, GPA, GED, dollars and "high school", so lock the ruleset to the **US**. Keep the rules in one data file (`rules/us.ts`) so a European ruleset (`rules/eu.ts`: drinking 18, school ends at 18 with exams instead of GPA, euros, no tuition debt) can be added later as a new-game option.

### School track (US)
| Age | Stage | Notes |
|---|---|---|
| 14 | Grade 9 (Freshman) | Game start |
| 15 | Grade 10 (Sophomore) | Driver's permit available |
| 16 | Grade 11 (Junior) | Driver's license, SAT/ACT, legal to drop out in many states (with parent consent) |
| 17 | Grade 12 (Senior) | College applications, prom, enlistment with parent consent |
| 18 | Graduation | Adult: full legal status |

---

## 1. Legal age gates (US)

All gates live in one function: `ageGate(action, player, ruleset)` returning `{ allowed, reason }`. Locked cards show the reason in grey ("Must be 21"), like the existing "Only evening" label.

| Action | Age | Notes |
|---|---|---|
| Part-time job | 14 | Max ~3 hrs school days / 18 hrs per school week at 14–15 (FLSA): limit to 1 slot on school days |
| Most jobs, more hours | 16 | Evening shifts unlock |
| Hazardous jobs (construction, roofing, driving for work) | 18 | |
| Learner's permit / license | 15 / 16 | Driving test = skill check |
| Rent a car | 25 (21 with fee) | |
| Sign a lease, contracts, loans | 18 | Under 18 = parents co-sign |
| Credit card | 18 | Under 21 needs proof of income (CARD Act) |
| Vote | 18 | Election event every 4 years |
| Tattoo / piercing | 18 | 16–17 with parent consent |
| Tobacco & vapes | 21 | Federal Tobacco 21 |
| Alcohol | 21 | Underage drinking = possible citation |
| Cannabis | 21 | Only if a "legal state" toggle is on for the city |
| Casino | 21 | Lottery tickets / scratchers at 18 |
| Marriage | 18 | Keep "Too young" below 18 |
| Military | 17 with consent / 18 | |
| Gun purchase | 18 rifle / 21 handgun (from dealer) | Only relevant to crime/hunting paths |
| Intimacy actions | **18, both people** | See section 5 |

### Under-18 consequences: juvenile system, not jail
Minors can still get in trouble; the response is just different.
- **Caught with alcohol / vape:** confiscation, parents called, grounding (lose Evening and Night slots for 1–2 months), Karma −, parent relationship −.
- **Shoplifting / vandalism / fight:** school suspension, juvenile court, community service (forced slots), probation flag.
- **Repeat offences:** juvenile detention for 1–6 months (separate location, education continues at a reduced rate).
- **Sealed record at 18:** juvenile record mostly doesn't follow you, unless it was serious. Gives the "fresh start" feeling.
- At **18+** the adult system applies: fines, county jail, prison, permanent record that blocks some careers (police, teaching, law, finance).

---

## 2. New activities by location

Format: **Name** (min age) — effect / risk.

### Parents' House
- Chores (14) — small allowance, parent +
- Sneak out at night (14) — Mood +, chance of getting caught → grounded
- Argue with parents (14) — Mood −, independence +
- Raid the liquor cabinet (14) — chance caught; illegal under 21
- Game all night (14) — Mood +, Energy −−
- Learn to cook (14) — new skill, unlocks cheaper food later
- Move out (18) — requires savings or roommates

### Westside High (extra)
- Cheat on a test (14) — GPA +, chance caught → zero + warning
- Run for student council (14) — Charm check, Fame +
- Cut class with friends (14) — counts as skip, friend +
- Detention (forced)
- Prom (17) — invite partner/friend, photos event
- Take SAT/ACT (16) — Smarts check, sets college options
- Join band / drama / debate (14) — Creativity / Charm tracks
- Bully someone / stand up to a bully (14) — Karma ±, event chains

### Downtown
- Mall: hang out, buy clothes (Looks +), shoplift (14, crime check)
- Arcade, cinema, bowling (14)
- Part-time jobs: fast food, retail, cinema usher (14/16)
- Fake ID (16) — buy from a contact, unlocks bars with a failure chance + police risk
- Bars & clubs (21) — drink, dance, meet people, one-night stand chance (18+ gate also applies)
- Tattoo parlour (18)
- Busking (14) — Creativity check for money

### Riverside Park
- Run, walk the dog, picnic, read
- Skate / BMX tricks (Fitness check, injury chance)
- Drink in the park (any age) — illegal under 21, police check
- Feed ducks / meditate (Mood +, Karma +)
- Pickup basketball (Fitness, friends)

### Iron Temple Gym
- Weights, cardio, boxing, yoga
- Hire a trainer ($)
- Steroids (18) — Fitness ++, Health −−, ban chance in sports careers
- Compete (powerlifting, amateur boxing at 16+ with consent)

### Public Library
- Study, tutor others (money), write a novel (multi-month project), job hunt, free computer use, book club (friends)

### St. Mary's Hospital
- Check-up, therapy, ER (events), volunteer (Karma +, med-school application +)
- **Sexual health clinic (16+ for testing; 18+ in game logic tied to intimacy):** STI test, contraception, pregnancy test
- Donate blood (17 with consent / 18)

### St. Jude Cathedral
- Attend mass, confession (Karma +, guilt reduction after bad events), volunteer, choir, youth group (14)

### New locations to unlock
| Location | Unlocks | Activities |
|---|---|---|
| Driving School | 15 | Lessons, test |
| Community College | 18 | Cheap classes, night classes |
| Nightclub "Static" | 21 | Dance, VIP, drinks, meet people |
| Bar "The Anchor" | 21 | Drink, darts, karaoke, bar fights |
| Casino | 21 | Slots, blackjack, poker (skill), addiction meter |
| Clinic / Pharmacy | 14 | Medicine, contraception (18+ in game) |
| Courthouse | event | Trials, divorce, custody, name change |
| Juvenile Center / County Jail / Prison | event | Time-served activities: study for GED, workout, make allies, riot events |
| Dating App (phone) | 18 | Swipe, match, message, date |
| Airport | 18 | Travel (vacation months, moving abroad) |
| Military Base | 17/18 | Enlist, ranks, deployment events |
| Rehab Centre | 18 | Fix addictions |

---

## 3. Life paths (diversity of play)

Each path is a set of activities, careers and events that reinforce each other. Players shouldn't be forced into one.

- **Golden child** — GPA, scholarships, Ivy League, doctor/lawyer.
- **Athlete** — sports practice → varsity → college scouts → pro or injury.
- **Artist / creator** — band, art, streaming, viral moments, Fame.
- **Hustler** — side jobs, reselling sneakers, small business at 18.
- **Rebel** — skipping, sneaking out, fake ID, dropout → GED or trade later.
- **Criminal** (crime update) — shoplifting → dealing → heists; juvenile record vs adult record.
- **Military** — enlist at 17/18, GI Bill for college later.
- **Family-first** — early marriage, kids, small-town life in the countryside.
- **Party animal** (21+) — clubs, Fame, addiction risk, health decline.
- **Saint** — volunteering, church, charity, Karma-driven events.

---

## 4. Event ideas (48 → 150+)

### Teen (14–17)
- Friend offers you a vape / a beer at a party
- Parents are divorcing — pick who to live with
- Caught sneaking out
- Teacher accuses you of cheating (you did / you didn't)
- Your best friend starts dating your crush
- Talent scout at the school show
- Social media post goes viral (good or embarrassing)
- Sibling gets in trouble and asks you to cover
- First job: manager is unfair
- Learner's permit: crash a parent's car
- Bullied online / in person
- Pet dies
- Grandparent's funeral (inheritance at 18)
- Prom night drama (date cancels, crowned king/queen, after-party with alcohol)
- College acceptance / rejection letters

### Young adult (18–25)
- Roommate doesn't pay rent
- Credit card offer — accept?
- Friend asks you to co-sign a loan
- Wild party: police raid
- Ex wants to get back together
- Partner gets a job in another city
- Pregnancy scare / pregnancy news
- Positive STI result
- Drunk driving offer (take the keys or not)
- Job offer abroad
- Dropout to start a business

### Adult (26+)
- Promotion vs family time
- Affair temptation at work
- Partner discovers messages
- Midlife crisis (buy sports car / quit job / dye hair)
- Kid gets in trouble at school
- Parent's illness: care for them or pay for a home
- Layoffs, market crash, inheritance, lottery win
- Health scares tied to lifestyle (drinking, smoking, fitness)

---

## 5. Relationships & intimacy (18+)

### Hard rules (enforced in code and tests)
1. **Every intimacy action requires both the player and the partner to be 18 or older.** Checked per partner, every time, through `canBeIntimate(player, partner)`. If the player turns 18 while their partner is 17, the menu stays hidden until the partner is 18.
2. Teen relationships keep the current actions only (Hang out, Deep talk, Gift, Date, Break up). No intimacy actions, events or text involving anyone under 18.
3. All intimacy is **non-explicit**: a choice, a fade-to-black line ("You spent the night together."), and consequences.
4. **Consent is a mechanic**: the NPC can say no based on relationship score, attraction, mood and context. A "no" has a respectful option (Relationship slightly −, Karma neutral) and the game offers no option to ignore it.
5. A **Mature Content** toggle in settings (on by default only after an 18+ age confirmation at first launch). Off = intimacy actions hidden, pregnancy still possible through "Try for a baby" with a partner.

### Actions (People menu, both 18+)
| Action | Requirements | Effects |
|---|---|---|
| Kiss / make out | Relationship ≥ 40 | Relationship +, Mood + |
| Spend the night | Relationship ≥ 60, NPC agrees | Mood ++, Relationship +, choose protection |
| Try for a baby | Partner/spouse, both agree | Pregnancy chance per month |
| Talk about boundaries | Any partner | Raises future acceptance, fewer fights |
| One-night stand | Met at bar/club/app, attraction check | Mood +, Karma −/neutral, STI & pregnancy risk, possible event chain (they show up again, they're your boss's kid…) |
| Cheat | Has partner + meets someone | Huge drama risk if discovered |
| Open relationship talk | Partner, Relationship ≥ 80 | Partner may agree, refuse or break up |

### Protection choice (each time)
- **Condom** — pregnancy ~2–3% / STI risk very low (costs a little, needs "bought at pharmacy" item)
- **Birth control** (prescription from clinic) — pregnancy low, STI risk unchanged
- **Nothing** — pregnancy ~15–20% per encounter (tune), STI risk based on partner's hidden history

### Hidden partner stats
- `stiStatus` (none / chlamydia / herpes / HIV…), most curable with a clinic visit; some manageable lifelong (affects Health slowly if untreated)
- `fidelity` (chance they cheat on you)
- `wantsKids`, `jealousy`, `commitment`

### Consequences web
- **Pregnancy:** keep, adoption, or ending the pregnancy (availability follows a per-city law toggle; keep it neutral and factual). Unplanned child → money −, school/career slower, new family member.
- **STI:** symptoms event → clinic → treatment; untreated → Health drops, can infect future partners; partner finds out → trust event.
- **Cheating discovered:** fight, breakup, divorce (assets split at Courthouse, custody), Karma −, friends pick sides.
- **Reputation:** many one-night stands → Fame/Charm effects and town gossip events (positive or negative depending on archetype).
- **Workplace relationship:** promotion bias or HR complaint.
- **Emotional:** heartbreak lowers Mood for months; therapy at hospital helps.

---

## 6. Substances & addiction (adult systems)
- **Addiction meter** per substance (alcohol, nicotine, gambling, drugs in crime update). Grows with use, decays with abstinence.
- High meter → withdrawal events, forced choices ("You need a drink"), money drain, Health −, job warnings.
- **Rehab** at 18+ or "Get help" event; relapse chance.
- Underage use still possible (illegal): higher catch chance, juvenile consequences, parents.

---

## 7. Layout & UI variety
- **Context panels:** when inside the bar/club/casino, the bottom panel restyles (neon theme), gives a mini-game (blackjack hand, dance timing, karaoke rhythm).
- **Phone app grid** at 18+: Dating app (swipe cards), Bank, Messages (NPC texts arrive between months), Social media (followers = Fame), Maps.
- **Life story filters:** All / Love / School / Work / Trouble.
- **Month summary card** after "Next Month": what changed, money in/out, relationships changed, warnings.
- **Locked cards show the reason** ("Must be 21", "Need a car", "Need ID").
- **Age milestone screens:** 16 ("You can drive"), 18 ("You're an adult — new things unlocked"), 21 ("Bars, casinos and more").
- **Consequence previews** on risky cards: small chips like ⚠ Police 12% · ❤ Partner may find out.

---

## 8. Implementation notes for Claude Code
- `rules/us.ts`: ages table from section 1. All checks go through `ageGate()`; no hardcoded ages in activity files.
- Activity data gets `minAge`, `maxAge?`, `requires?` (item, license, relationship), `legality: "legal" | "illegal" | "illegalUnder21"`.
- `canBeIntimate(player, npc)` returns false unless **both** `age >= 18` and the Mature Content setting is on. Every intimacy action, event and text template must call it.
- **Tests (add to `verify`):**
  - Simulate 1,000 lives; assert no intimacy action or event ever fires when the player **or** the partner is under 18.
  - Assert no adult jail outcome for players under 18 (juvenile system only).
  - Assert alcohol/casino/tobacco actions are never legal under 21.
  - Assert every locked card returns a human-readable reason.
- Life simulator from 0.1 should log new outcomes: pregnancies, STIs, arrests (juvenile vs adult), addictions, divorces, so balance can be tuned.
