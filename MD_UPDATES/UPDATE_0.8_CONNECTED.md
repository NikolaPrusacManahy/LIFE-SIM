# Update 0.8 — "Connected" (design brief)

Scope: fix messaging logic and flow, real notifications, remove duplicate actions, a strict step-by-step action/event queue, PC & laptop desktop with parody websites and mini-games, custom PC building, and a playable Nightlife scene.

All earlier hard rules stay in force (0.2 / 0.4 / 0.5): intimacy requires both people 18+, mature content on, and the NPC not `cannotConsent` (captive, drugged, intoxicated past threshold, blackmailed). No minors as crime targets.

---

## 1. Messaging: logic fixes

### 1.1 Problems seen in v0.7
- NPC-initiated messages (Ines: "good morning ☀️ thinking of you", Theo: "party at mine tonight, u coming?") pile up unanswered. The chip bar always shows the generic Greet tab, so you can never reply to *that* message.
- Choosing a reply shows a toast at the top ("A good start to the day.") and nothing is sent: no bubble, no reaction, no continuation.
- Odds are shown on trivial messages ("Hey 79%") and a compliment can get a hostile answer for no visible reason.

### 1.2 Conversation model
Every chat is a **thread of turns**. Each NPC message has a `type`, and the composer shows **contextual reply chips for the latest unanswered NPC message first**, with the normal category tabs below.

| NPC message type | Example | Contextual replies |
|---|---|---|
| Greeting | "good morning ☀️ thinking of you" | "Morning! ☀️" · "Thinking of you too ❤️" (romance) · "Who's this?" (if low rel) · Leave on read |
| Question | "how was the exam?" | 2–3 answers (good / bad / joke) · Leave on read |
| Invitation | "party at mine tonight, u coming?" | **"I'm in"** · **"Can't, sorry"** · "Another time?" · "Who's going?" |
| Date request (partner) | "movie night friday? 🍿" | Yes · No · Suggest something else |
| Request | "can you lend me $50?" | Send money (amount picker) · "I'm broke" · "What for?" |
| Meme / media | "[sends a cursed meme] 💀" | React 😂 / 👍 / 💀 · "LMAO" · "why are you like this" |
| Flirt | "you looked cute today" | Flirt back · Thank them · Shut it down |
| Bad news | "my dog died" | Support replies |

**Every chosen reply:**
1. Appears as **your bubble** in the chat (right side).
2. Shows the typing indicator, then the **NPC's reaction bubble**.
3. Applies its effects, shown as a small inline chip under the reaction (`❤ +3 · Trust +2`) — not a toast at the top.
4. Leaves the thread open: you can keep talking (new contextual chips from their reply) or close the chat. A thread naturally ends when the NPC sends a closing line ("gtg, see u tmrw").

### 1.3 Logical replies
- Replies are picked by **intent × current state**, not a raw coin flip.
- **Default positive rule**: kind messages (compliment, greeting, support, congratulations) always land positively unless the NPC has an active negative state:
  - `mad` (recent fight, insult, betrayal, ignored invitation) → cold/short reply with the reason ("still mad about yesterday.").
  - `busy` (at work/school slot) → delayed reply next slot.
  - Low relationship + romantic message → awkward, not hostile.
- States are visible as a small status line under the name in the chat header: `😠 Upset with you (insulted them, Oct)`, so the player understands the response.
- **Show odds only when it's a real gamble**: flirting, asking out, asking for money, confessions, threats. Greetings and friendly chat show no %.

### 1.4 Message limit
- **10 messages per contact per month** (replaces 3 per slot). Counter in the chat header: `7/10 this month`.
- Replying to an NPC's message costs 1 (it still counts), but **NPC-initiated threads give +1 free reply** so you can always answer them.
- Underworld messages and money transfers count normally.

---

## 2. Invitations, plans and partners asking you out

### 2.1 Accepting / declining
- **"I'm in"** → NPC reacts ("yesss see u at 8 🎉") → a **Plan** is created and appears in a new **Plans** strip at the top of the location panel (and in the phone's Calendar view). When that slot comes, the plan starts as a scene with that person (party, movie, date…). Skipping a plan you accepted = "stood them up" (relationship −−, they text you about it).
- **"Can't, sorry"** → reaction based on traits and relationship: understanding ("np, next time!"), disappointed ("you always say that"), clingy/jealous ("are you seeing someone else?"). Repeated refusals lower friendship/romance.
- **"Another time?"** → they suggest a new slot; accept or decline again.
- **Unanswered invitations expire** at the slot they were for → NPC sends "guess you're busy 🙃" (small relationship −).

### 2.2 Partners initiate
Partners, spouses and close friends **ask you out on their own**, frequency by traits (Romantic, Clingy, Busy, Homebody) and relationship health:
- "date night friday? 🍿", "let's try that new place", "I booked us something 👀" (surprise date), "can we talk tonight?" (relationship check-in → serious conversation scene).
- Anniversaries and birthdays generate invitations automatically.
- Neglect shows up as **fewer** invitations, then "do you even want to be with me?" messages.

---

## 3. Remove duplicate & useless actions

- **Profile page**: remove "Text 'hi'" and any text-style interactions. Replace with one button: **💬 Open chat**, which opens the Messages app on that thread. Texting lives only in the phone.
- Profile keeps **in-person** actions only (Hang out, Deep talk in person, Gift, Argue, etc.). Each must have a clear, visible effect.
- **Audit rule**: every interaction must produce a **Result card** (see section 4) showing what happened and the stat/relationship deltas. Any action that can't produce a meaningful result is removed or merged.
- Merge overlaps: "Chat" (in person) vs "Talk" texting → in-person Chat stays, gives slightly more than texting but costs a time slot; texting is free but limited.

---

## 4. Step-by-step flow (no interruptions)

### 4.1 The Action Pipeline
Every player action resolves in strict order. Nothing can jump in between.

```
1. Action chosen        (e.g. Flirt with Ines)
2. Scene / animation    (short)
3. Result card          (success/fail, line of text, deltas)  ← must be dismissed
4. Follow-ups of THIS action (reply, date answer, mini-game end, number exchange)
5. Queue flush: pending events, incoming texts, notifications
6. Next slot
```

- **Random events are queued**, never shown during steps 1–4. A `pendingEvents` queue is flushed at step 5, one at a time, each with its own Result card.
- If an action is waiting on an answer ("Ask them out" → they'll reply later), the result card says so: `⏳ Ines will reply soon`. The reply arrives as a text at step 5 or in a later slot, with a notification.
- **Mini-games** (bowling, arcade, cards, Nightlife chats) lock the queue until they finish and show a final score card ("You won 3–1! Theo: 'rematch next week.'").
- **Event chains** don't start while a Plan scene is running; they wait for the next free slot.

### 4.2 Result card
Small modal, consistent style:
```
[portrait] Flirt with Ines — Success ✓
"Ines laughs. 'Smooth. Too smooth.'"
❤ Romance +6   😊 Mood +3
[Continue]
```
Fail cards are just as clear, with the reason ("Ines is upset with you.").

---

## 5. Notifications

- **Badge count** (number, not just a red dot) on: the HUD phone button, the Messages app icon, and each thread in the inbox.
- **Banner preview** sliding in at the top of the screen when a text arrives (portrait + name + first line). Click → opens that chat. Banners appear only at queue-flush time (step 5), never mid-action.
- Vibration SFX plays with the banner (already exists), plus a distinct sound for partner / family / unknown number.
- Inbox: unread threads bold, sorted by latest, "needs reply" tag on threads with an open invitation or question, expiry hint ("expires tonight").
- **Notification centre** in the phone (swipe-down list) for missed texts, plan reminders, bills, news.

---

## 6. Computers: laptop, home PC, library PC

### 6.1 Access
| Device | Where | Limits |
|---|---|---|
| Library PC | Public Library | 1 slot per visit, public: no 18+ sites, people can see your screen (shoulder-surf events), no downloads |
| Laptop | Bag item (Shop / Nile) | Use anywhere with Wi-Fi, battery, can be stolen |
| Custom PC | Home (after build, section 7) | Best performance; unlocks streaming, editing, mining, hacking |

New home interaction: **🖥 Use PC** / **💻 Use laptop** → opens the Desktop.

### 6.2 Desktop UI
A full-screen fake OS ("**Doors**"): wallpaper you can change, taskbar, start menu, clock (in-game time), notification tray, windows you can open/close/drag. Desktop icons: Browser, JobHunt, Store, Games, Chat, Files, Settings, Trash.

Use **parody names and original art only** — no real logos or brand assets.

### 6.3 Browser — parody sites
| Site | Parody of | What it does |
|---|---|---|
| **JobHunt** | Indeed/LinkedIn | Search & apply to jobs (replaces/extends Career menu), CV builder, recruiter messages |
| **ViewTube** | YouTube | Watch videos (Mood +, learn skills: cooking, coding, fitness tutorials), start a channel, upload, subscribers, comments section (mixed: wholesome & toxic) |
| **Twitchy** | Twitch | Watch streamers (parody streamer NPCs with personalities), donate, chat; go live yourself (needs PC score + webcam/mic) → Fame/money, raids, toxic chatters, viral clips |
| **Chirp** | X/Twitter | Deliberately toxic: rage-bait posts, ratio battles, dogpiles, hot takes, bots, "main character of the day". Posting gives Fame but risks pile-ons, getting cancelled, old posts resurfacing at job interviews. Satire of toxicity, no real slurs or real people. |
| **OtakuPit** | Toxic anime forums | Gatekeeping, "waifu wars", "filtered", tier-list fights. Your posts can earn respect or get you dogpiled; forum friends you can DM |
| **WeatherNerds** | Weather forums | Real in-game forecast (rain/snow next month), storm chasers, wholesome community |
| **GameHub Forums** | Gaming communities | Patch-note drama, guides that raise your mini-game scores, LFG posts → online friends |
| **Nile** | Amazon | Shop everything, including PC parts (section 7). Delivery takes time; package theft and wrong-item events |
| **SpicyHub** (18+) | Adult sites | Mature content setting + 18+ only. Never shows content: a blurred placeholder page with gag captions. Effects: Mood +, Energy −, small addiction meter; risks: malware popup event, partner finds browser history, caught on a shared/work PC. Hidden on library PCs |
| **Onionmarket** (dark web) | Darknet markets | Online access to the 0.5 Back Room black market (needs a "Tor-ish" browser download + Rep). Scams, exit scams, police sting chance, crypto payment |
| **PartPicker** | PCPartPicker | Plan builds, check compatibility, compare prices |
| **NewsNow** | News sites | In-game headlines: your crimes, your fame, world events, stock market |
| **Spark Web** | Dating sites | Desktop version of the Spark app (18+) |
| **Bank online** | — | Same as phone Bank |
| **LearnHub** | Online courses | Certificates that unlock jobs |

### 6.4 Store & games ("Bitstore")
Buy/download games; each is a small playable mini-game that can give Mood, Smarts or money (tournaments):
- **Flappy Pigeon** — tap to flap through pipes (original art).
- **Furious Fowl** — slingshot birds into towers (original art).
- **Snek**, **Mines**, **Block Drop** (falling-block puzzle), **Word Duel** (vs NPC friends), **Solitaire**.
- Online games where you meet people (see Chat).
- Gaming addiction meter: too many hours → grades/work −, Energy −.

### 6.5 Chat ("Discorb")
- Servers/rooms by topic (gaming, anime, weather, coding, local city).
- Meet **online NPCs**; they have person chips with **unverified** info (catfish chance). Becoming friends → exchange numbers → they appear in Messages.
- **Age rules online**: online romance and anything 18+ are only possible with NPCs flagged 18+ AND verified by meeting in person; profiles that claim to be adults may be revealed as minors in a **safety event**, which ends all romance options with them immediately (the player can report/block).
- Toxic rooms, scams, doxxing threats (Fame-based), and genuine friendships.

---

## 7. Custom PC building

### 7.1 Parts (all bought on Nile; 3–4 tiers each: Budget / Mid / High / Enthusiast)
Case · Motherboard · CPU · CPU cooler · GPU · RAM · Storage (SSD/HDD) · PSU · Case fans · Monitor · Keyboard · Mouse · Headset · Webcam · Microphone · Gaming chair · Desk · RGB kit (Mood +, Fame + on stream).

Parody brand names (e.g. "AMB", "Intol", "Nvidio" → keep them clearly fictional, own logos).

### 7.2 Compatibility
- CPU socket ↔ motherboard; RAM type ↔ motherboard; PSU wattage ≥ total draw; GPU length ↔ case size; cooler height ↔ case.
- PartPicker site warns about issues; buying incompatible parts is allowed (the player learns at assembly).

### 7.3 Delivery
Orders arrive in 1–2 slots (express costs more). Events: package stolen from porch, wrong item, damaged GPU (return process), customs delay.

### 7.4 Assembly mini-game
When all required parts are in the Bag, a new home action appears: **🔧 Build PC**.
- Drag-and-drop parts into a motherboard/case diagram in a logical order (motherboard → CPU → cooler → RAM → storage → GPU → PSU → cables).
- Smarts check per step; a YouTube guide watched beforehand gives a bonus.
- Possible mistakes with funny/real consequences: forgot thermal paste (overheating events), RAM not seated (no boot → troubleshoot), static zap (part broken), cable management mess (−airflow).
- **First boot** moment with a fanfare and RGB glow.

### 7.5 PC score
Total score affects: game mini-game performance, streaming quality (viewers), video editing speed (ViewTube growth), crypto mining income (+ electricity bill), hacking success (0.5 crime), and Fame on stream ("nice setup" chat events). Upgrades and part failures over time (old GPU dies).

---

## 8. Nightlife update (bars, clubs)

Bars and 21+ clubs follow US rules (0.2): 21+ entry; 18+ club nights allow entry but no alcohol (wristband system).

### 8.1 The scene
Entering a bar/club opens a **dedicated environment** instead of the normal activity cards:
- Side-on PixiJS room with zones: **Bar**, **Dance floor**, **Booths**, **Smoking area**, **Restrooms**, **VIP** (fee / Fame / knowing the bouncer).
- **15–25 NPCs** generated for the night (all 21+ at bars/clubs, or 18+ on 18+ nights), standing in zones, each with a floating person chip (portrait, ♂/♀/⚧, age, vibe tag: "having fun", "waiting for friends", "looking for someone", "wants to be left alone").
- Lighting, music beat and crowd density by venue type (dive bar, pub, cocktail lounge, techno club, gay bar, karaoke bar, rooftop).

### 8.2 Night meters (HUD)
- **⏰ Night time**: the night has ~12 actions until closing.
- **🍸 Intoxication**: rises with drinks; boosts Confidence but lowers judgement and success at higher levels; very high → stumbling, blackout risk, bad choices auto-picked.
- **💪 Confidence**: rises with successes and drinks, drops on rejections.
- **💵 Cash**: drinks, rounds, VIP, cab home.

### 8.3 Approaching people
Click an NPC → a **conversation mini-game** with that person:
- A **connection bar** with stages: **Stranger → Chatting → Friendly → Flirty → Connected**.
- Each turn pick from chips: Small talk, Joke, Compliment, Ask about them, Dance with them, Buy them a drink, Take a shot together, Flirt (if romance-eligible), Talk deep, Introduce your friend, Leave.
- Their vibe tag and traits (revealed a little as you talk) shift the odds. "Wants to be left alone" → most chips fail; leaving gracefully gives Karma +.
- **Drinking together** raises trust and connection, but also both intoxication levels.
- Outcomes when you end the chat: nothing · fun memory (Mood +) · new friend · **exchange numbers** (added to Messages with a "met at The Anchor" tag) · "Want to get out of here?" (see 8.5).
- Rivals/exes can show up in the crowd → drama events.

### 8.4 Other night activities
Order drinks (cocktail menu with prices), buy a round for a group (Fame +, Cash −), dance (Fitness/Looks check, crowd reacts), karaoke (Charm/Creativity), pool/darts mini-games, bar trivia, bar fight (bouncer kicks you out; police at high level), lose your phone, someone tries to spike a drink → **you can intervene** (Karma ++, hero event, possible friend).

### 8.5 Leaving together (18+, mature content on)
- "Want to get out of here?" → mutual connection + attraction + both 18+.
- **Consent gate**: if either person's intoxication is above the threshold, this option is replaced with responsible alternatives: "Get them a cab", "Swap numbers, text tomorrow", "Walk them to their friends". This uses the 0.5 `cannotConsent` flag.
- Your place or theirs → 0.2/0.4 intimacy flow: fade-to-black, protection choice (condoms from the Bag; no condom = higher risk), outcomes.
- **Morning after**: awkward, sweet, "who are you?", they cook breakfast, they stole something, they want more (becomes a contact, possible situationship/FWB), or the 0.4 consequences (STI, pregnancy, partner finds out).
- **Getting home**: walk (mugging chance), cab (Cash), drive drunk (DUI risk, crash).

### 8.6 Next-day consequences
Hangover (Energy −, Mood −), drunk texts you sent (shown in Messages, can't unsend once read), photos on Chirp, new contacts, bank balance shock.

---

## 9. Tests (add to verify)
- No random event, text or notification ever renders while an action is between "chosen" and "result dismissed".
- Every NPC-initiated message has contextual reply chips; every reply produces a player bubble and an NPC reaction bubble.
- Invitations: accept → Plan created; decline → reaction message; unanswered → expiry message.
- Kind messages to NPCs without a negative state never get a hostile reply.
- Message limit: 10 per contact per month, +1 free reply per NPC-initiated thread.
- Badge counts always equal the number of unread threads.
- Profile pages contain no texting actions, only "Open chat".
- Nightlife: every generated NPC at a bar/21+ club is ≥ 21, at 18+ nights ≥ 18; "Leave together" never offered when either intoxication exceeds the threshold or either person is under 18.
- SpicyHub and Onionmarket are never reachable from a library PC or by players under 18.
- Online chat NPCs: romance options never available with anyone flagged or revealed as under 18.
- PC build: incompatible parts are detected at assembly; a completed build adds the "Use PC" home action.
