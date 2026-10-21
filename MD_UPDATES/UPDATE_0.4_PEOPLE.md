# Update 0.4 — "People" (design brief)

Scope: full rework of NPCs and relationships, character creation (gender, sexuality, female model), random encounters, trait discovery, phone numbers and relationship labels, teacher/professor interactions, an 18+ college intimacy expansion, and an inventory.

---

## 0. Carry-over rules (do not break)

1. **All intimacy content requires the player AND the other person to be 18+.** Gate by age through `canBeIntimate(player, npc)`, never by "is in college". A 17-year-old freshman sees none of it.
2. **High-school teachers are never romance-eligible.** No flirt option, no romance score, no events. Professors at college follow rule 1 (both adults) and the risk rules in section 9.
3. **Non-explicit writing.** Intimacy is a choice, a one-line fade-to-black, then outcomes. No descriptive sexual text in any template.
4. **Mature Content setting** (from 0.2) hides all of section 10 when off.
5. Every line template that can involve intimacy is tagged `mature: true`. The verify test fails if a `mature` template ever resolves with anyone under 18.

---

## 1. Fix: who is this person?

Problem: "Dante likes you" — no gender, age or context.

**Every NPC mention (event card, life story, phone, encounter) shows a person chip:**

```
[portrait] Dante Reyes · ♂ he/him · 15 · Classmate (Westside High)
```

- Portrait: small procedural face (same generator as the player avatar, section 2).
- Gender symbol + pronouns, age, current label, where you know them from.
- Hover/tap → mini profile (known traits, relationship bars).
- All event text uses pronoun tokens: `{they}`, `{them}`, `{their}` resolve from the NPC (`"{name} keeps looking at you. {They} smile when you notice."`).
- Name pools split by gender (and a unisex pool) so names read clearly.

---

## 2. Character creation (rework)

Step-by-step screen with live avatar preview.

| Step | Options |
|---|---|
| Name | First, last, randomise |
| Sex / gender | Male, Female, Non-binary (body base chosen separately) |
| Pronouns | he/him, she/her, they/them, custom |
| Sexuality | Straight, Gay/Lesbian, Bisexual, Pansexual, Asexual, **Unsure (decide later)** |
| Body base | Male model, **Female model** |
| Appearance | Skin tone (8), hair style (12 per base), hair colour (10), eye colour, height (short/avg/tall), build (slim/avg/athletic/heavy), freckles, glasses |
| Background | Parents rich / middle / struggling, city / countryside, siblings 0–3 |
| Starting trait | Existing traits (Genius, Iron Constitution…) |

### Sexuality in game logic
- Decides who appears **romance-eligible** in encounters (attraction filter). Friends come from everyone.
- "Unsure": all genders appear; after age 18 an event asks you to settle it, or you keep it open.
- **Adult (18+) events** can let the player change it: "You realise you're attracted to…". Changing it later is allowed and normal.
- NPCs have their own sexuality; romance needs mutual attraction. A rejected flirt can say why: "{They}'re not into {player_gender}s."

### Female model (PixiJS procedural avatar)
- Second rig with its own torso, hips, shoulders, hair layers (long, ponytail, bun, bob, braids, curly, pixie, hijab option…).
- Outfits per base: school uniform, casual, sporty, formal, party, work uniforms per career, swimwear (beach), wedding (dress/suit available to any base).
- Ages the same way as the male rig (teen → adult → old: posture, grey hair, wrinkles).
- Use the same rig for NPC portraits so every NPC visibly has a gender and age.

---

## 3. NPC data model

```ts
interface NPC {
  id: string; name: string; surname: string;
  gender: "male" | "female" | "nonbinary"; pronouns: Pronouns;
  sexuality: Sexuality; age: number; birthMonth: number;
  appearance: AvatarSpec;
  archetype: Archetype;            // see 3.1
  traits: { id: TraitId; revealed: boolean; progress: number }[];
  stats: { looks; smarts; charm; fitness; wealth; fame; karma };
  rel: { friendship; romance; trust; respect; attraction; rivalry }; // 0–100 (rivalry separate)
  labels: RelLabel[];              // can stack: "Coworker" + "Friend with benefits"
  hasYourNumber: boolean; youHaveTheirNumber: boolean;
  metAt: { location; date; how };
  memory: MemoryEvent[];           // things they remember: gifts, fights, secrets, lies
  status: "alive" | "moved" | "dead" | "jail";
  mood: number;                    // today's mood affects reactions
}
```

### 3.1 Archetypes (decide stat spread + trait odds + dialogue tone)
Jock, Nerd, Popular, Artsy, Rebel, Loner, Gamer, Party animal, Overachiever, Class clown, Religious, Rich kid, Hustler, Goth/Alt, Influencer, Sweetheart, Bully, Gossip, Athlete, Activist, Mature adult, Career-driven, Free spirit, Player (romance-seeker), Homebody.

---

## 4. Relationship labels and evolution

Two main tracks (friendship and romance) plus side labels. Labels can stack.

### Friendship track
| Label | Requirement | How to go up | How to drop |
|---|---|---|---|
| Stranger | — | Talk at an encounter | — |
| Acquaintance | Friendship 10 | Hang out, chat | No contact 6 months |
| Friend | Friendship 35 + have number | Regular hangouts, help | Betrayal, neglect |
| Close friend | Friendship 65 + trust 50 | Deep talks, keep a secret | Lie discovered |
| Best friend | Friendship 85 + trust 75 + 1 shared event | Event: "Best friend?" | Major betrayal → Rival |

### Romance track
| Label | Requirement | Notes |
|---|---|---|
| Crush (one-sided) | Attraction ≥ 40 | Can be yours or theirs (event: "{name} has a crush on you") |
| Talking / flirting | Mutual attraction ≥ 40 | Texts, flirting actions |
| Dating | Ask out → accepted | Dates cost time/money |
| Partner | Romance 60, "make it official" | Exclusive unless open talk |
| Engaged | Romance 85, age 18, ring in inventory | Proposal event |
| Married | Wedding event | Shared money option, in-laws |
| Ex | Breakup / divorce | Memory of how it ended shapes future events |

### Side labels
| Label | Age | How |
|---|---|---|
| Rival | 14 | Rivalry ≥ 50 (competition, insults, stolen crush/job) |
| Enemy | 14 | Rivalry 80 or major betrayal |
| Mentor | 14 | Teacher/boss with respect ≥ 70 |
| Classmate / Coworker / Roommate / Neighbour | any | Context |
| Situationship | 18 | Hooking up + dating-ish without a label |
| Friend with benefits | 18 | Friendship ≥ 40, mutual attraction, both agree; risk: someone catches feelings |
| Sugar daddy / mommy (you're the baby) | 18 (both); sugar NPC usually 35+ | Met via app/club/event; money & gifts in exchange for time and companionship; Karma −, reputation risk, jealousy, sudden ending |
| Sugar daddy / mommy (you're the sugar) | 18, wealth high | Reverse: you pay, they give attention; gold-digger risk |
| Affair partner | 18 | Cheating; discovery system from 0.2 |
| One-night stand | 18 | Single encounter, may return later |

### Evolution rules
- Relationship values decay slowly without contact (friends faster than family).
- **Memory events** change future options: a forgotten birthday, a lie, a loan you never repaid.
- **Jealousy web**: dating someone affects their friends, exes and crushes (Rivals can be created).
- **Life changes affect NPCs too**: they graduate, move, marry, have kids, get arrested, die; you get texts about it.

---

## 5. Encounter system

Each time slot at a location has a chance to spawn an **encounter** (card overlay with the person chip). Pools depend on location and age:

| Location | Who you meet | Age |
|---|---|---|
| High school (hallway, lunch, class, gym class, clubs) | Students ±1 year, teachers, staff | 14–18 |
| House party | Students / young people around your age | 14+ (alcohol illegal under 21) |
| Park, mall, arcade, library | Mixed strangers | any |
| Gym | Fitness-heavy pool | any |
| Work | Coworkers, customers, boss | job age |
| College campus, dorms, frat/sorority parties | Students 18–24, professors | 18+ (intimacy requires both 18+) |
| 18+ club nights | 18+ only | 18 |
| Bars, 21+ clubs, casino | 21+ | 21 |
| Dating app | Filtered by your sexuality + age range you set (min 18) | 18 |
| Church, hospital, volunteering | Kind/older pool | any |

### Encounter card
```
[portrait] Maya Chen · ♀ she/her · ~17 · Stranger
"Is anyone sitting here?" — Lunch, Westside High
[Talk]  [Joke (Charm)]  [Compliment (Charm)]  [Ignore]  [Flirt (Looks/Charm)]*  [Ask number]
```
`*` Flirt only appears if the NPC is romance-eligible by sexuality and age band. Teens can only flirt with peers ±2 years who are under 18. Adults can only flirt with adults. Teachers never.

### Stat-based options
Some options only appear if a stat is high enough, and the chance is shown:
- Charm ≥ 50: "Smooth opener" (78%)
- Smarts ≥ 60: "Nerd out about the book they're reading"
- Fitness ≥ 60: "Challenge them to a race"
- Fame ≥ 40: they recognise you ("Wait, are you the guy from that video?")
- Looks ≥ 70: they approach you first more often
- Karma low: some NPCs refuse to talk ("I heard about you…")

### Random encounter event types
Bump into someone, spill coffee on them, someone sits next to you, lost dog, someone asks directions, someone drops something, group project partner, new transfer student, someone being bullied, stranger asks for money, drunk stranger at party (18+/21+ contexts), someone recognises you from social media, ex shows up with a new partner.

---

## 6. Phone numbers and texting

- **Ask for number**: chance = f(relationship, charm, looks, attraction, their mood, context). Failures have flavour ("{They} give you a fake number." → you find out when the text bounces).
- **Contacts list** grouped by label (Family / Partner / Friends / Romance / Work / School / Exes / Rivals / Other), each with the person chip.
- **Texts arrive between slots**: invites, memes, drama, "u up?" (18+ only), asking for money, news (got into college, pregnant, moving), group chats (friend group, class, family).
- **Reply choices** move relationship values; ignoring texts slowly lowers friendship.
- **Block / unblock**, delete number, "leave on read".

---

## 7. Trait discovery

Each NPC has 3–6 traits, all hidden ("?") at first. Spending time with them fills a progress bar on a specific trait; certain actions reveal certain traits faster.

### Trait list (examples, 40+)
| Trait | Revealed faster by | Effect |
|---|---|---|
| Kind | Hang out, ask for help | Forgives more easily |
| Jealous | Dating, flirting with others nearby | Fights when you talk to others |
| Loyal | Keeping secrets, crises | Defends you in events |
| Liar | Catching inconsistencies (events) | Sometimes lies about events |
| Gossip | Telling them secrets | Your secrets spread |
| Funny | Parties, hangouts | Mood + when together |
| Ambitious | Study / work together | Likely to move away for career |
| Lazy | Group projects | Fails shared tasks |
| Party animal | Parties | Invites you out, alcohol events |
| Homebody | Asking them out | Prefers quiet dates |
| Romantic | Dates | Big gestures, expects them too |
| Commitment-phobic | Dating long-term | Hesitates at "official" / proposal |
| Wants kids / Doesn't want kids | Deep talks (18+) | Family conflicts |
| Hot-headed | Arguments | Fights escalate |
| Generous | Money situations | Lends you money |
| Cheap | Dates, gifts | Doesn't pay |
| Religious | Church, deep talk | Values conflicts |
| Addictive personality | Parties (18+) | Addiction events |
| Secretly rich / secretly broke | Visiting their home | Story events |
| Talented (music/art/sport) | Activities together | Career / fame events |
| Manipulative | Long-term, conflicts | Guilt-trip events |
| Clingy | Dating | Texts constantly |
| Adventurous | Trips, risky activities | Wants to try new things (18+ intimacy flavour) |
| Shy | Encounters | Low starting talk chance, warms up |
| Night owl / early bird | Texts | When they're available |
| Allergic to X | Gifts, dinners | Gift fail event |
| Has a secret | Close friend + trust 80 | Reveal event (debt, sick parent, sexuality, criminal past) |

UI: profile shows revealed traits as chips, unknown ones as `?` with a small progress ring.

---

## 8. Interaction menus (by label)

Interactions use one time slot unless marked free.

**Anyone**: Chat, Compliment, Joke, Ask about their life, Ask for number, Insult, Ignore.

**Friends+**: Hang out (pick activity: movies, mall, gaming, sport, study, food), Deep talk, Share a secret, Ask for help, Ask for money, Lend money, Gift, Invite to party, Prank, Introduce to another friend, Set them up with someone, Gossip about someone, Confront, Apologise, Group hangout.

**Romance (age-appropriate)**: Flirt, Ask out, Date (dinner, movies, park walk, arcade, concert, picnic, beach, mini-golf, cooking together), Gift, Make it official, Meet the parents, Anniversary, Break up, Long-distance mode.
Teen romance (under 18) stays at: flirt, ask out, dates, gifts, hold hands, make it official, break up. Nothing physical beyond that.

**Adult romance (18+)**: everything above plus Move in together, Propose (needs ring), Plan wedding, Try for a baby, Talk boundaries, Open relationship talk, Couples therapy, Divorce, plus section 10.

**Rivals**: Insult, Sabotage, Challenge (sport, grades, sales numbers), Spread rumour, Make peace, Fight (school fight = suspension; adult fight = assault charge chance).

**Family**: Ask for allowance, Help at home, Argue, Ask for advice, Borrow car (16+), Take care of them (when old/sick), Inherit.

---

## 9. Teachers and professors

### High-school teachers (never romantic)
Each teacher is an NPC with a subject, traits (Strict, Inspiring, Burned-out, Favouritist, Funny, Unfair grader) and a respect score.

| Interaction | Effect |
|---|---|
| Ask for help after class | Smarts +, respect + |
| Office hours / extra credit | GPA + |
| Argue a grade | Charm/Smarts check, respect ± |
| Become teacher's pet | Respect ++, classmates' opinion − |
| Talk back / disrupt | Detention, respect −, Fame + with classmates |
| Ask for a recommendation letter (17) | Quality depends on respect, boosts college odds |
| Confide a problem | Teacher can become Mentor; may refer you to counsellor |
| Report a teacher | If they were unfair: investigation event |
| Join their club | Mentor path |
| Give a thank-you gift | Respect + |

Teacher events: substitute chaos, teacher quits, teacher notices you're struggling at home, inspiring teacher pushes you toward a career, unfair teacher fails you, field trip.

### College professors (all adults)
Same interactions, plus research assistant job, grad-school recommendation, thesis supervisor.
**Flirt with a professor** (18+, both adults, mature content on): available but heavily risky.
- Most professors refuse and it lowers respect.
- If it happens: chance of discovery → university ethics investigation, professor fired, your grades in that course reviewed/void, rumours (Fame/Karma −), possible expulsion if grades were traded.

---

## 10. College intimacy expansion (18+, both people, mature content on)

All non-explicit: choice → fade-to-black line → outcomes. Uses the 0.2 protection, STI and pregnancy systems and the inventory (condoms, birth control).

### Solo
- **"Me time"** (dorm/apartment, private): Mood +, Stress/Energy small +. If you live with a roommate: chance of awkward walk-in event (roommate relationship −, then a funny follow-up).
- **Exploring what you like**: an 18+ self-discovery event chain that can confirm or change your sexuality setting.

### With others
- **First time** (one-off event the first time the player is intimate): nervous/excited choices, talk about it first (trust +), protection choice; outcomes from "awkward but sweet" to "regret", affects Mood and the relationship.
- **Party hookup** (frat/sorority/house party, 18+): attraction check; alcohol makes it riskier (judgement penalty: more likely to skip protection, more regret outcomes; very intoxicated partner = **option unavailable**, consent rule).
- **Dating app hookup**: match → chat → meet; safety events (catfish, no-show, great night, stalker ex).
- **Friends with benefits**: recurring option; each month a chance someone catches feelings (you or them) → event "Do you want more?".
- **Sexile the roommate**: ask roommate for the room; roommate relationship ±.
- **Risky locations** (library stacks, campus building, car, beach): thrill (Mood ++) vs chance of getting caught → campus police, indecent exposure citation, disciplinary hearing, Fame −.
- **Walk of shame** morning event, rumour mill (Gossip NPCs spread it).
- **Consent workshop / sex-ed seminar** (campus event): reduces regret outcomes, Karma +.
- **Campus clinic**: tests, contraception, pregnancy tests (inventory).

### Consequences (from 0.2 plus new)
Pregnancy, STIs, jealousy among friend groups, exes and current partners crossing paths, roommate drama, reputation (positive or negative by archetype), relationship upgrades ("What are we?"), heartbreak.

---

## 11. Event chains (examples to expand into 100+)

Each chain is 3–6 events spread over months, with branches from your choices and stats.

1. **The Secret Admirer** (14+): notes in locker → guess who (3 candidates shown with person chips) → reveal → date / friend-zone / it was a prank by a Rival.
2. **The Rival** (14+): beat them at something → sabotage → public showdown → enemies for life or unlikely best friends.
3. **The Group Project** (14+): lazy partner → carry or report → grade → partner owes you.
4. **The Party** (14+ teen version, 18+ college version): invite → drinking choice (illegal under 21) → someone needs help → police / cleanup / legend status.
5. **The Love Triangle** (14+ teen dating only / 18+ full): best friend likes your partner → choose.
6. **Coming Out** (any age, about identity only): tell family/friends → reactions by their traits (Religious, Kind…).
7. **The Ex Returns** (18+): ex texts years later → coffee → closure / affair / second chance.
8. **Sugar Arrangement** (18+): app match → gifts and trips → jealousy from friends / feelings / sudden end / scandal.
9. **FWB Catches Feelings** (18+): see section 10.
10. **The Mentor** (14+): teacher believes in you → competition → recommendation → career boost; teacher gets fired chain.
11. **Roommate from Hell** (18+): messy → steals → fight → move out / become best friends.
12. **The Wedding** (18+): planning (budget, guests, best man/maid of honour from close friends) → cold feet event → objection event → honeymoon.
13. **The Proposal Gone Wrong** (18+): public proposal, Charm/romance check, rejection becomes viral (Fame + Mood −−).
14. **Old Friends** (25+): reunion party, who changed, who stayed the same.

### Line pools
For every interaction × archetype × outcome, write 5–10 lines. Example: **Compliment → Jock → success**:
- "Thanks. You should come to the game Friday."
- "{They} grin. 'Finally someone noticed.'"
- "'You're not so bad yourself.'"
Failure:
- "{They} shrug and turn back to {their} friends."
- "'Uh… okay?'"
Target: ~2,000 lines total. Store in `data/lines/*.json` keyed by `interaction.archetype.outcome`.

---

## 12. Inventory

Phone menu gets a **Bag** tab. Items have:
```ts
interface Item {
  id; name; icon; price; where: Location[];
  minAge?: number; legality: "legal" | "illegalUnder21" | "illegal";
  consumable: boolean; uses?: number;
  effects?: StatDelta; enables?: ActionId[];
  confiscateChance?: number;   // if parents/police/school check
  matureOnly?: boolean;
}
```

| Item | Where | Age | Notes |
|---|---|---|---|
| Phone (upgrade tiers) | Shop | any | Better = Fame + on social |
| Laptop | Shop | any | Study +, freelance work |
| Textbooks | School/campus store | any | Grades + |
| Gym membership | Gym | any | Discount on gym activities |
| Flowers, chocolates, teddy bear | Shop | any | Gifts (romance +) |
| Perfume / cologne | Shop | any | Attraction + for 1 month |
| Concert / movie tickets | Shop | any | Unlocks date types |
| Jewellery (gift tiers) | Shop | any | Bigger gift effects |
| Promise ring | Jeweller | 14 | Teen romance gift |
| Engagement ring (3 tiers) | Jeweller | 18 to propose | Required for Propose; price affects acceptance + reputation |
| Wedding rings | Jeweller | 18 | Needed for the wedding event |
| Condoms | Pharmacy | 18 (mature) | Used in intimacy; lowers pregnancy/STI risk |
| Birth control | Clinic (prescription) | 18 (mature) | Monthly, lowers pregnancy risk |
| Pregnancy test | Pharmacy | 18 | Used in pregnancy events |
| First aid kit | Pharmacy | any | Fixes minor injury events |
| Painkillers | Pharmacy | any | Hangover / injury |
| Cigarettes / vape | Store | 21 | Addiction, Health −; illegal under 21 (confiscation, trouble) |
| Alcohol | Store | 21 | Party item; illegal under 21 |
| Fake ID | Contact (event) | — | Illegal; lets under-21s into bars with a fail chance |
| Lottery tickets | Store | 18 | Random win |
| Car keys / car | Dealership | 16 | Unlocks locations faster, dates, road events |
| Stolen goods | Crime | — | Illegal, sell at pawn shop (crime update) |
| Contraband | Crime | — | Illegal, abstract item for crime update; police search risk |
| Weapon | Crime | — | Placeholder for crime update; huge sentence multiplier if caught |

**Searches & confiscation**: parents (teen), school (locker check event), police (stop & search), roommate snooping. Illegal items raise the stakes of every search.

---

## 13. UI changes
- **People screen** rebuilt: left = contacts grouped by label with person chips and search; right = profile (portrait, chips, relationship bars: friendship/romance/trust/respect/rivalry, traits with `?`, memory log "You forgot their birthday (Mar 2027)", interaction buttons grouped by category).
- **Relationship web view**: small node graph showing who knows whom (friends, exes, rivals).
- **Encounter overlay** in the world scene, avatar of the NPC appears next to the player.
- **Notification badge** on phone for texts.
- **Life story** entries always use person chips.

---

## 14. Implementation notes & tests
- New modules: `npc/generator.ts`, `npc/traits.ts`, `relationships/labels.ts`, `encounters/`, `phone/texts.ts`, `inventory/`, `data/lines/`.
- `canBeIntimate(player, npc)`: both `age >= 18` AND mature content on AND neither is a high-school teacher/student pairing (teacher can't be romance-eligible anyway). Used by every `mature` action, event and template.
- `isRomanceEligible(player, npc)`: sexuality match both ways AND age band rule (both under 18 within ±2 years, or both 18+) AND not a high-school teacher.
- **Verify tests (extend the 0.2 suite):**
  - 1,000 simulated lives: no `mature` action/event/template ever resolves when either person is under 18.
  - No flirt/romance option ever offered between a high-school teacher and a student.
  - No adult–minor romance-eligible pair ever generated.
  - Every event mentioning an NPC renders a person chip with gender + pronouns + age.
  - Pronoun tokens resolve for all three pronoun sets in every line template.
  - Illegal items trigger the right consequences at each age.
- Migration: existing saves get gender/pronouns/traits generated for existing NPCs; player's sexuality defaults to "Unsure" with a prompt on load.
