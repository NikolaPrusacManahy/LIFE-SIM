import type { Game } from '../Game';
import type { Person } from '../types';
import type { GroupChat } from '../crime/types';
import { canBeIntimate } from '../systems/intimacy';
import { isRomanceEligible, say } from '../npc/identity';
import { bump } from '../npc/interactions';
import { discover, hasTrait } from '../npc/traits';
import { MATURE_LINE_AUDIT } from '../npc/lines';
import { cannotConsent, darkCrimeOn, isValidCrimeTarget } from '../crime/consent';
import { addDigital } from '../crime/investigation';
import { itemCount } from '../inventory/items';
import { hasPhone } from '../systems/phone';
import { MAX_PER_MONTH, countMessage, effectChip, pushMsg, sentThisMonth } from './convo';
import { createPlan } from './plans';
import type { PlanKind } from './types';
import { clearMad, npcState, setMad } from '../npc/mood';

// Update 0.5 — real messenger. Update 0.8 — free, capped at 10 messages per contact per month; odds only on real gambles.

export type ChatTab = 'greet' | 'talk' | 'deep' | 'flirt' | 'plans' | 'intimate' | 'money' | 'support' | 'conflict' | 'underworld';
export const TABS: { id: ChatTab; icon: string; label: string }[] = [
  { id: 'greet', icon: '👋', label: 'Greet' }, { id: 'talk', icon: '💬', label: 'Talk' }, { id: 'deep', icon: '🌊', label: 'Deep' },
  { id: 'flirt', icon: '💘', label: 'Flirt' }, { id: 'plans', icon: '📅', label: 'Plans' }, { id: 'intimate', icon: '🔥', label: 'Intimate' },
  { id: 'money', icon: '💸', label: 'Money' }, { id: 'support', icon: '🙏', label: 'Support' }, { id: 'conflict', icon: '😠', label: 'Conflict' },
  { id: 'underworld', icon: '🗡️', label: 'Underworld' },
];

interface Pool { ok: string[]; fail: string[]; mature?: boolean }

/** Reply pools. Every chip pool has ≥3 lines per outcome band (tested). */
export const CHAT_POOLS: Record<string, Pool> = {
  greet: { ok: ['heyyy 😊', 'hey you! what’s up?', 'omg hi, I was just thinking about you', 'hiii'], fail: ['hey', 'k', 'who is this?'] },
  missyou: { ok: ['miss you too 🥺', 'come see me then!', 'stop, you’re making me smile'], fail: ['lol okay', 'that’s… nice?', 'we literally saw each other last week'] },
  talk: { ok: ['honestly a long day, but better now', 'haha so get this…', 'you always ask the right questions', 'not much! you?'], fail: ['fine', 'busy rn', 'can’t talk'] },
  meme: { ok: ['💀💀💀', 'I’M CRYING', 'sending this to everyone'], fail: ['I don’t get it', 'old meme', '…ok'] },
  gossip: { ok: ['WAIT what??', 'I knew it. I KNEW it.', 'spill. everything.'], fail: ['that’s kind of mean', 'I don’t really do gossip', 'leave {them} alone lol'] },
  vent: { ok: ['ugh I’m so sorry. want to talk?', 'that’s awful, I’m here', 'say the word and I’ll bring snacks'], fail: ['oof', 'that sucks', 'everyone has bad days'] },
  advice: { ok: ['honestly? go for it.', 'trust your gut on this one', 'I’d sleep on it, then decide'], fail: ['no idea tbh', 'don’t ask me lol', 'idk, google it?'] },
  voice: { ok: ['your voice made my day', 'I replayed that like 4 times', 'lmaooo I love you'], fail: ['why is this a voice note', 'can’t listen rn', 'I’ll listen later (they won’t)'] },
  drunk: { ok: ['LMAO go to bed', 'drunk you is my favourite you', 'screenshotting this for tomorrow'], fail: ['…what', 'are you okay??', 'we’ll talk when you’re sober'] },
  deep: { ok: ['wow. ok. I’ve never told anyone this but…', 'that’s a big question. honestly?', 'I think about that a lot actually'], fail: ['too deep for a tuesday', 'idk, never thought about it', 'can we keep it light?'] },
  think: { ok: ['honestly? you’re one of my favourite people', 'you’re kind of amazing, you know that?', 'I think you’re braver than you know'], fail: ['why are you asking lol', 'you’re… fine?', 'uh, I don’t know'] },
  flirt: { ok: ['stop 😳', 'you’re trouble, you know that?', 'okay that one worked'], fail: ['lol', 'cheesy 😂', 'did you google that'] },
  doyoulike: { ok: ['took you long enough 😳 yes.', 'depends, do *you* like *me*? 😏', '…maybe. yes. okay yes.'], fail: ['you’re like family to me lol', 'as a friend!!', 'who is this'] },
  ilike: { ok: ['I like you too. a lot.', 'I’ve been waiting for you to say that', '🥺 same'], fail: ['oh… I don’t feel the same, sorry', 'I really value our friendship', 'I need to think'] },
  selfie: { ok: ['cute 😍', 'ok you look GOOD', 'saving this'], fail: ['nice pic', '👍', 'is that a new haircut'] },
  plans: { ok: ['yes! when?', 'I’m in 🙌', 'finally, let’s do it'], fail: ['can’t this week', 'maybe another time', 'rain check?'] },
  askout: { ok: ['YES. finally.', 'I’d love that 😊', 'it’s a date'], fail: ['I’m flattered but no', 'I don’t think that’s a good idea', 'I’m seeing someone'] },
  money: { ok: ['how much? sending now 💸', 'sure, pay me back whenever', 'of course, you’d do the same'], fail: ['bro I’m broke too', 'again? what happened to the last time?', 'I can’t right now, sorry'] },
  allowance: { ok: ['only if you make it worth my while — dinner Friday.', 'check your account 💳', 'treat yourself'], fail: ['not this month', 'you’re getting expensive', 'we’ll see'] },
  support: { ok: ['thank you. really.', 'that means a lot ❤️', 'I needed that today'], fail: ['thanks', 'ok', 'I’m fine'] },
  insult: { ok: ['wow.', 'say that to my face', 'blocked. kidding. or am I'], fail: ['lol whatever', 'cry about it', 'k'] },
  talkneed: { ok: ['…okay. what’s wrong?', 'that sounds serious. call me?', 'I’m scared now'], fail: ['ugh not this again', 'can it wait', 'fine.'] },
  accuse: { ok: ['I would NEVER. how could you think that', 'you’re being paranoid', 'it’s not what it looks like'], fail: ['…how did you find out', 'we need to talk in person', 'I’m sorry'] },
  breakup: { ok: ['by TEXT? wow.', 'fine. good luck with your life', 'I can’t believe you'], fail: ['wait what?? call me', 'please don’t do this', 'are you serious'] },
  menace: { ok: ['ok ok I’ll do it. please leave me alone.', 'fine. you win.', 'I won’t say anything'], fail: ['come say that to my face', 'go ahead. I still have the photos.', 'I’m screenshotting this'] },
  deal: { ok: ['same place, midnight', 'I’ll have it ready', 'deal'], fail: ['too hot right now', 'not over text, idiot', 'no'] },
  crew: { ok: ['on it, boss', 'done by tonight', 'consider it handled'], fail: ['I need more money for that', 'not doing that one', 'cops are watching me'] },
  // ---- mature (18+ both, Mature Content) — reactions only, never content
  intimate: { ok: ['🔥 come over. now.', 'you’re trouble 😍', 'door’s unlocked'], fail: ['not tonight, sorry', 'I’m exhausted, tomorrow?', 'maybe another time'], mature: true },
  lastnight: { ok: ['same 😳', 'I can’t focus at work because of you', 'round two?'], fail: ['lol', 'it was nice', 'let’s talk about it later'], mature: true },
  flirtyselfie: { ok: ['ok now I can’t think', 'you’re unfair 😍', 'is this an invitation?'], fail: ['that was fast. too fast.', 'uh… wow… okay', 'let’s slow down'], mature: true },
  photo_partner: { ok: ['🔥 come over. now.', 'you’re trouble 😍', 'deleting nothing'], fail: ['not at my desk!! 😳', 'cute but I’m with my mom rn', 'later 😏'], mature: true },
  photo_fwb: { ok: ['lol perfect timing', 'is this an invitation?', 'on my way'], fail: ['can’t tonight', 'save that for later', 'busy, but noted 😏'], mature: true },
  photo_crush: { ok: ['wow… okay 😳', 'I wasn’t expecting that but I’m not complaining', 'you’re bold'], fail: ['that was fast. too fast.', 'I think we should slow down', 'uh… I need a minute'], mature: true },
  photo_wrong: { ok: ['WRONG CHAT?? 😂', 'I’m going to pretend I didn’t see that', 'lmao I think this was for someone else'], fail: ['what the hell', 'please don’t send me stuff like that', 'blocked.'], mature: true },
  askphoto: { ok: ['only because it’s you 📷', 'here 😏', 'you asked nicely'], fail: ['not comfortable with that', 'no thanks', 'I don’t send those'], mature: true },
};

export interface ChipDef {
  id: string;
  tab: ChatTab;
  label: string;
  pool: string;
  photo?: string;
  odds?: (g: Game, p: Person) => number;
  risk?: string;
  when?: (g: Game, p: Person) => boolean;
  req?: (g: Game, p: Person) => string | null;
  run?: (g: Game, p: Person, ok: boolean) => void;
  /** reveals traits like the matching interaction */
  reveals?: string;
}

const committed = (p: Person) => ['dating', 'partner', 'engaged', 'spouse'].includes(p.role);
const physical = (p: Person) => committed(p) || p.labels.includes('fwb') || p.labels.includes('situationship');
const base = (g: Game, p: Person, b = 0.6) => Math.max(0.05, Math.min(0.95, b + (p.rel - 50) / 150 + (p.mood - 50) / 300));

export const CHIPS: ChipDef[] = [
  // greet
  ...['Hey', 'What’s up?', 'Good morning ☀️', 'Good night 🌙', 'Long time no see'].map((label, i) => ({ id: `greet${i}`, tab: 'greet' as ChatTab, label, pool: 'greet', run: (_g: Game, p: Person, ok: boolean) => bump(p, 'rel', ok ? 2 : 0) })),
  { id: 'missyou', tab: 'greet', label: 'Miss you', pool: 'missyou', odds: (g, p) => base(g, p, 0.3) + p.romance / 150, run: (_g, p, ok) => { bump(p, 'rel', ok ? 3 : -1); if (committed(p)) bump(p, 'romance', ok ? 4 : 0); } },
  // talk
  { id: 'howday', tab: 'talk', label: 'How was your day?', pool: 'talk', reveals: 'chat', run: (_g, p, ok) => bump(p, 'rel', ok ? 3 : 0) },
  { id: 'tellme', tab: 'talk', label: 'Tell me something about yourself', pool: 'talk', reveals: 'asklife', run: (_g, p, ok) => bump(p, 'trust', ok ? 3 : 0) },
  { id: 'upto', tab: 'talk', label: 'What are you up to?', pool: 'talk', reveals: 'chat' },
  { id: 'meme', tab: 'talk', label: 'Send a meme', pool: 'meme', odds: (g, p) => base(g, p, hasTrait(p, 'funny') ? 0.8 : 0.55), run: (g, p, ok) => { bump(p, 'rel', ok ? 3 : 0); if (ok) g.stat('mood', 2); } },
  { id: 'song', tab: 'talk', label: 'Share a song', pool: 'talk', reveals: 'hang_music' },
  { id: 'gossip', tab: 'talk', label: 'Gossip about someone', pool: 'gossip', reveals: 'gossip', run: (g, p, ok) => { g.karma(-1); bump(p, 'rel', ok ? 3 : -2); } },
  { id: 'vent', tab: 'talk', label: 'Vent about your day', pool: 'vent', run: (g, p, ok) => { if (ok) g.stat('mood', 5); bump(p, 'trust', ok ? 2 : 0); } },
  { id: 'advice', tab: 'talk', label: 'Ask for advice', pool: 'advice', run: (g, _p, ok) => { if (ok) g.stat('smarts', 0.5); } },
  { id: 'voice', tab: 'talk', label: '🎙️ Voice note', pool: 'voice', odds: (g, p) => base(g, p, 0.3) + g.s.stats.charm / 150, run: (_g, p, ok) => bump(p, 'rel', ok ? 6 : -2) },
  { id: 'drunktext', tab: 'talk', label: '🍻 Drunk text', pool: 'drunk', when: (g) => g.flag('drunkTurn') >= g.s.turn - 1, risk: 'You don’t control this one', run: (g, p, ok) => { bump(p, 'rel', ok ? 2 : -6); if (!ok) g.stat('mood', -3); } },
  // deep (friendship 40+)
  ...[['afraid', 'What are you afraid of?'], ['want', 'What do you want from life?'], ['god', 'Do you believe in God?'], ['regret', 'What’s your biggest regret?']].map(([id, label]) => ({
    id, tab: 'deep' as ChatTab, label, pool: 'deep', reveals: 'deeptalk', when: (_g: Game, p: Person) => p.rel >= 40, run: (_g: Game, p: Person, ok: boolean) => { bump(p, 'trust', ok ? 5 : -1); bump(p, 'rel', ok ? 3 : 0); },
  })),
  { id: 'kids', tab: 'deep', label: 'Do you want kids someday?', pool: 'deep', reveals: 'deeptalk', when: (g, p) => p.rel >= 40 && g.age >= 18 && g.ageOf(p) >= 18, run: (_g, p, ok) => bump(p, 'trust', ok ? 4 : 0) },
  { id: 'think', tab: 'deep', label: 'What do you think of me, honestly?', pool: 'think', when: (_g, p) => p.rel >= 40, run: (g, p, ok) => { g.stat('mood', ok ? 6 : -4); bump(p, 'trust', ok ? 3 : 0); } },
  // flirt (romance-eligible only)
  { id: 'compliment', tab: 'flirt', label: 'Compliment', pool: 'flirt', reveals: 'compliment', odds: (g, p) => base(g, p, 0.35) + p.attraction / 200, run: (_g, p, ok) => { bump(p, 'attraction', ok ? 6 : 0); bump(p, 'rel', ok ? 2 : -1); } },
  { id: 'pickup', tab: 'flirt', label: 'Cheesy pickup line', pool: 'flirt', odds: (g, p) => base(g, p, 0.3) + (hasTrait(p, 'funny') ? 0.2 : 0), run: (_g, p, ok) => bump(p, 'attraction', ok ? 5 : -2) },
  { id: 'tease', tab: 'flirt', label: 'Playful tease', pool: 'flirt', odds: (g, p) => base(g, p, 0.35) + p.attraction / 200, run: (_g, p, ok) => bump(p, 'attraction', ok ? 6 : -2) },
  { id: 'lookedgood', tab: 'flirt', label: '“You looked good today”', pool: 'flirt', odds: (g, p) => base(g, p, 0.35) + p.attraction / 180, run: (_g, p, ok) => bump(p, 'attraction', ok ? 7 : -1) },
  { id: 'doyoulike', tab: 'flirt', label: '“Do you like me?”', pool: 'doyoulike', odds: (_g, p) => Math.min(0.95, p.attraction / 90 + p.romance / 200), run: (_g, p, ok) => { if (ok && ['acquaintance', 'friend', 'crush'].includes(p.role)) p.role = 'talking'; } },
  { id: 'ilike', tab: 'flirt', label: '“I like you”', pool: 'ilike', odds: (_g, p) => Math.min(0.95, 0.1 + p.attraction / 80), run: (g, p, ok) => { if (ok) { if (!committed(p)) p.role = 'talking'; bump(p, 'romance', 10); g.burst('hearts'); } else { g.stat('mood', -8); bump(p, 'attraction', -5); } } },
  { id: 'selfie', tab: 'flirt', label: 'Send a selfie 📷', pool: 'selfie', photo: '📷 Selfie', odds: (g, p) => base(g, p, 0.4) + (g.s.stats.looks - 50) / 150, run: (_g, p, ok) => bump(p, 'attraction', ok ? 5 : 0) },
  { id: 'flirtyselfie', tab: 'flirt', label: 'Send a flirty selfie 📷', pool: 'flirtyselfie', photo: '📷 Flirty selfie', risk: '⚠ Could screenshot', when: (g, p) => canBeIntimate(g, p), odds: (_g, p) => Math.min(0.95, p.attraction / 90 + p.romance / 200), run: (g, p, ok) => photoAftermath(g, p, ok) },
  // plans
  { id: 'hangplan', tab: 'plans', label: 'Hang out?', pool: 'plans', run: (g, p, ok) => planned(g, p, ok) },
  { id: 'partyplan', tab: 'plans', label: 'Party tonight?', pool: 'plans', odds: (g, p) => base(g, p, hasTrait(p, 'partyanimal') ? 0.85 : hasTrait(p, 'homebody') ? 0.2 : 0.55), run: (g, p, ok) => planned(g, p, ok, 'party') },
  { id: 'studyplan', tab: 'plans', label: 'Study together?', pool: 'plans', when: (g) => !!g.s.education.current, run: (g, p, ok) => { planned(g, p, ok); if (ok) g.stat('smarts', 1); } },
  { id: 'gymplan', tab: 'plans', label: 'Gym together?', pool: 'plans', run: (g, p, ok) => { planned(g, p, ok); if (ok) g.stat('fitness', 1); } },
  { id: 'movieplan', tab: 'plans', label: 'Movie night?', pool: 'plans', run: (g, p, ok) => planned(g, p, ok, 'movie') },
  { id: 'comeover', tab: 'plans', label: 'Come over?', pool: 'plans', run: (g, p, ok) => planned(g, p, ok) },
  { id: 'askout', tab: 'plans', label: 'Ask them out', pool: 'askout', when: (g, p) => isRomanceEligible(g, p) && !committed(p), odds: (_g, p) => Math.min(0.95, 0.15 + p.attraction / 120 + p.rel / 300), run: (g, p, ok) => { if (ok) { p.role = 'dating'; bump(p, 'romance', 12); g.burst('hearts'); } else g.stat('mood', -6); } },
  // intimate (18+ both, Mature Content, not cannotConsent, committed/FWB)
  { id: 'comeover18', tab: 'intimate', label: '“Come over… 😏”', pool: 'intimate', odds: (g, p) => base(g, p, 0.45) + p.romance / 200, run: (_g, p, ok) => bump(p, 'romance', ok ? 5 : -1) },
  { id: 'lastnight', tab: 'intimate', label: '“I can’t stop thinking about last night”', pool: 'lastnight', run: (_g, p, ok) => bump(p, 'romance', ok ? 5 : 0) },
  { id: 'privatephoto', tab: 'intimate', label: 'Send a private photo 📷', pool: 'photo_partner', photo: '📷 Private photo', risk: '⚠ Could screenshot', odds: (g, p) => base(g, p, 0.5) + p.romance / 200, run: (g, p, ok) => photoAftermath(g, p, ok) },
  { id: 'askphoto', tab: 'intimate', label: 'Ask for a private photo', pool: 'askphoto', req: (g, p) => (g.flag(`photoNo:${p.id}`) >= 2 ? 'They said no. Respect it.' : null), odds: (_g, p) => Math.min(0.9, 0.2 + p.romance / 150 + p.trust / 300), run: (g, p, ok) => { if (!ok) { g.inc(`photoNo:${p.id}`); if (g.flag(`photoNo:${p.id}`) >= 2) { bump(p, 'trust', -8); g.karma(-2); } } else g.setFlag(`askedPhoto:${p.id}`, g.s.turn); } },
  { id: 'bootycall', tab: 'intimate', label: 'Late-night call 🌙', pool: 'intimate', when: (g) => g.phase === 'night', odds: (g, p) => base(g, p, 0.4) + p.romance / 200, run: (_g, p, ok) => bump(p, 'romance', ok ? 3 : -2) },
  // money
  { id: 'borrow', tab: 'money', label: 'Ask to borrow $200', pool: 'money', odds: (g, p) => base(g, p, hasTrait(p, 'generous') ? 0.75 : hasTrait(p, 'cheap') ? 0.1 : 0.35), run: (g, p, ok) => { if (ok) { g.money(200); p.memory.unshift({ clock: g.s.clock, text: 'Lent you $200', tone: 'neutral' }); } bump(p, 'rel', ok ? -1 : -3); } },
  { id: 'payback', tab: 'money', label: 'Ask for your money back', pool: 'money', when: (_g, p) => p.memory.some((m) => m.text.startsWith('You lent')), odds: (g, p) => base(g, p, hasTrait(p, 'liar') ? 0.2 : 0.55), run: (g, p, ok) => { if (ok) { g.money(200); p.memory = p.memory.filter((m) => !m.text.startsWith('You lent')); } else bump(p, 'trust', -4); } },
  { id: 'sendmoney', tab: 'money', label: 'Send $50', pool: 'support', req: (g) => (g.canAfford(50) ? null : 'Need $50'), odds: () => 0.95, run: (g, p) => { g.money(-50); bump(p, 'rel', 5); } },
  { id: 'allowance', tab: 'money', label: 'Ask for your allowance', pool: 'allowance', when: (_g, p) => p.labels.includes('sugar'), odds: () => 0.7, run: (g, _p, ok) => { if (ok) g.money(g.rand(400, 1500)); } },
  { id: 'paydinner', tab: 'money', label: 'Offer to pay for dinner', pool: 'plans', req: (g) => (g.canAfford(60) ? null : 'Need $60'), odds: () => 0.85, run: (g, p, ok) => { if (ok) { g.money(-60); bump(p, 'rel', 4); if (committed(p)) bump(p, 'romance', 4); } } },
  // support
  ...[['okay', 'Are you okay?'], ['here', 'I’m here for you'], ['congrats', 'Congratulations!'], ['bday', 'Happy birthday 🎂'], ['loss', 'Sorry for your loss'], ['sorry', 'I’m sorry']].map(([id, label]) => ({
    id, tab: 'support' as ChatTab, label, pool: 'support', odds: (g: Game, p: Person) => base(g, p, 0.75),
    run: (g: Game, p: Person, ok: boolean) => { bump(p, 'rel', ok ? 4 : 1); if (id === 'sorry') { bump(p, 'rivalry', -10); p.memory = p.memory.map((m) => (m.tone === 'bad' && g.chance(0.5) ? { ...m, tone: 'neutral' as const } : m)); } if (id === 'bday' && p.birthMonth === g.month) bump(p, 'rel', 4); },
  })),
  // conflict
  { id: 'insult', tab: 'conflict', label: 'Insult', pool: 'insult', run: (g, p) => { bump(p, 'rel', -10); bump(p, 'rivalry', 10); g.karma(-1); } },
  { id: 'roast', tab: 'conflict', label: 'Roast them', pool: 'insult', odds: (g, p) => base(g, p, hasTrait(p, 'funny') ? 0.7 : 0.4), run: (_g, p, ok) => { bump(p, 'rel', ok ? 2 : -6); } },
  { id: 'needtalk', tab: 'conflict', label: '“We need to talk”', pool: 'talkneed', run: (_g, p) => bump(p, 'trust', -2) },
  { id: 'accuse', tab: 'conflict', label: 'Accuse them of cheating', pool: 'accuse', when: (_g, p) => committed(p), odds: (_g, p) => (hasTrait(p, 'liar') ? 0.3 : 0.75), run: (_g, p, ok) => { if (ok) { bump(p, 'trust', -15); bump(p, 'romance', -10); } else { bump(p, 'romance', -20); } } },
  { id: 'breakuptext', tab: 'conflict', label: 'Break up by text', pool: 'breakup', when: (_g, p) => committed(p) || p.role === 'talking', risk: '⚠ Everyone will judge you', odds: () => 0.6, run: (g, p) => { p.role = 'ex'; p.romance = 0; bump(p, 'rel', -40); g.karma(-4); p.memory.unshift({ clock: g.s.clock, text: 'Dumped them by text', tone: 'bad' }); for (const f of g.peopleBy('friend')) if (g.chance(0.3)) bump(f, 'rel', -4); } },
  // underworld (18+, Dark Crime, adult target) — leaves a digital trail unless sent from a burner
  { id: 'menace', tab: 'underworld', label: 'Menace', pool: 'menace', risk: '⚠ Digital evidence', odds: (g, p) => base(g, p, 0.4) + g.s.stats.street / 200 - (hasTrait(p, 'hothead') ? 0.3 : 0), run: (g, p, ok) => { bump(p, 'rivalry', 15); if (!p.tags.includes('fear')) p.tags.push('fear'); if (!ok && !g.s.chats[p.id]?.slice(-1)[0]?.burner && g.chance(0.3)) addDigital(g); } },
  { id: 'threat', tab: 'underworld', label: 'Send a threat', pool: 'menace', risk: '⚠ Digital evidence', odds: (g) => 0.35 + g.s.stats.street / 200, run: (g, p) => { bump(p, 'rivalry', 25); g.karma(-4); } },
  { id: 'demandpay', tab: 'underworld', label: 'Demand payment', pool: 'menace', risk: '⚠ Digital evidence', when: (g, p) => g.s.underworld.blackmail.some((b) => b.pid === p.id) || p.tags.includes('fear'), odds: () => 0.6, run: (g, _p, ok) => { if (ok) g.money(g.rand(300, 1500)); } },
  { id: 'ordercrew', tab: 'underworld', label: 'Give an order', pool: 'crew', risk: '⚠ Digital evidence', when: (_g, p) => !!p.crewRole, odds: (_g, p) => (p.loyalty ?? 50) / 100, run: (g, p, ok) => { if (ok && g.s.underworld.business) g.s.underworld.business.quality = Math.min(100, g.s.underworld.business.quality + 4); if (!ok) p.loyalty = Math.max(0, (p.loyalty ?? 50) - 5); } },
  { id: 'deal', tab: 'underworld', label: 'Arrange a deal', pool: 'deal', risk: '⚠ Digital evidence', when: (g) => !!g.s.underworld.business, odds: () => 0.6, run: (g, _p, ok) => { if (ok) { const amt = g.rand(1000, 4000); g.s.underworld.dirty += amt; } } },
];
export const CHIP_BY_ID: Record<string, ChipDef> = Object.fromEntries(CHIPS.map((c) => [c.id, c]));

/** Update 0.8 — a yes makes a Plan for the next evening; the effects come when you actually go. */
function planned(g: Game, p: Person, ok: boolean, kind: PlanKind = 'hang') {
  if (!ok) return;
  bump(p, 'rel', 2);
  p.lastContact = g.s.clock;
  createPlan(g, p, committed(p) && kind === 'hang' ? 'date' : kind, 'mine');
}

/** Private-photo consequences: screenshots, leaks, an ex who keeps them. */
function photoAftermath(g: Game, p: Person, ok: boolean) {
  if (!p.tags.includes('photos')) p.tags.push('photos');
  if (ok) bump(p, 'romance', 6);
  else bump(p, 'romance', -8);
  if ((hasTrait(p, 'gossip') || hasTrait(p, 'manipulative')) && g.chance(0.3)) g.s.schedule.push({ at: g.s.clock + g.rand(1, 3), id: 'photo_leak', ctx: { pid: p.id } });
}

// ------------------------------------------------------------ threads & gating

export type ThreadState = 'open' | 'dead' | 'jail' | 'captive' | 'blocked' | 'nophone';

export function threadState(g: Game, p: Person): ThreadState {
  if (!hasPhone(g)) return 'nophone';
  if (!p.alive || p.status === 'dead') return 'dead';
  if (p.status === 'captive') return 'captive';
  if (p.status === 'jail') return 'jail';
  if (p.blocked || !p.hasNumber) return 'blocked';
  return 'open';
}

/** Which composer tabs exist in a chat. Under-18 players never get 🔥 or 🗡. */
export function tabsFor(g: Game, p: Person): ChatTab[] {
  const out: ChatTab[] = ['greet', 'talk'];
  if (p.rel >= 40) out.push('deep');
  // Update 0.9 — nobody who can't consent (very drunk, captive, blackmailed) gets flirted with, not even a selfie
  if (isRomanceEligible(g, p) && !cannotConsent(g, p)) out.push('flirt');
  out.push('plans');
  if (g.age >= 18 && canBeIntimate(g, p) && physical(p)) out.push('intimate');
  out.push('money', 'support', 'conflict');
  if (g.age >= 18 && darkCrimeOn() && isValidCrimeTarget(g, p, true)) out.push('underworld');
  return out;
}

export function chipsFor(g: Game, p: Person, tab: ChatTab): { chip: ChipDef; odds: number; reason: string | null }[] {
  if (!tabsFor(g, p).includes(tab)) return [];
  return CHIPS.filter((c) => c.tab === tab && (!c.when || c.when(g, p)))
    // hard gate: anything mature needs canBeIntimate (both 18+, Mature on, consent possible)
    .filter((c) => !CHAT_POOLS[c.pool]?.mature || canBeIntimate(g, p))
    .map((c) => ({ chip: c, odds: c.odds ? c.odds(g, p) : base(g, p, 0.7), reason: c.req?.(g, p) ?? null }));
}

/** Audit: every mature reply resolution (tested). */
export const CHAT_MATURE_AUDIT: { playerAge: number; npcAge: number; chip: string }[] = [];

function replyLine(g: Game, p: Person, pool: string, ok: boolean): string {
  const P = CHAT_POOLS[pool];
  if (P.mature) {
    CHAT_MATURE_AUDIT.push({ playerAge: g.age, npcAge: g.ageOf(p), chip: pool });
    MATURE_LINE_AUDIT.push({ key: `chat.${pool}`, playerAge: g.age, npcAge: g.ageOf(p) });
    if (!canBeIntimate(g, p)) throw new Error(`mature chat line ${pool} outside the 18+ gate`);
  }
  const lines = ok ? P.ok : P.fail;
  return say(lines[Math.floor(Math.random() * lines.length)], p, g.s.name);
}

export interface SendResult {
  error?: string;
  /** NPC reply (null = left on read / not yet) */
  reply: string | null;
  delay: number;
  /** a status line for the chat ("they'll reply later") */
  note?: string;
}

/** Update 0.8 — chips that are a real gamble show (and roll) odds. Everything else is kind and lands unless they're upset or busy. */
export const GAMBLE = new Set([
  'missyou', 'meme', 'voice', 'drunktext', 'compliment', 'pickup', 'tease', 'lookedgood', 'doyoulike', 'ilike', 'selfie', 'flirtyselfie',
  'partyplan', 'askout', 'comeover18', 'privatephoto', 'askphoto', 'bootycall', 'borrow', 'payback', 'allowance', 'roast', 'accuse',
  'breakuptext', 'menace', 'threat', 'demandpay', 'ordercrew', 'deal',
]);
export const isGamble = (c: ChipDef) => GAMBLE.has(c.id);
const MAD_CHIPS: Record<string, string> = { insult: 'insulted them', accuse: 'accused them', breakuptext: 'dumped them by text', menace: 'menaced them', threat: 'threatened them' };

/** Send a chip to a contact. Free, but 10 per contact per month; Underworld chips leave a digital trail unless sent from a burner. */
export function sendChip(g: Game, pid: string, chipId: string, burner = false): SendResult {
  const p = g.personById(pid);
  const chip = CHIP_BY_ID[chipId];
  if (!p || !chip) return { error: 'Unknown', reply: null, delay: 0 };
  if (threadState(g, p) !== 'open') return { error: 'Can’t message them', reply: null, delay: 0 };
  if (sentThisMonth(g, pid) >= MAX_PER_MONTH) return { error: `Limit reached — ${MAX_PER_MONTH} messages this month`, reply: null, delay: 0 };
  const allowed = chipsFor(g, p, chip.tab).find((c) => c.chip.id === chipId);
  if (!allowed || allowed.reason) return { error: allowed?.reason ?? 'Not available', reply: null, delay: 0 };
  countMessage(g, pid);
  p.lastContact = g.s.clock;

  // a fake number bounces on the first message (this used to be the "Text hi" button)
  if (p.fakeNumber) {
    pushMsg(g, pid, { from: 'me', text: chip.photo ? '' : chip.label, photo: chip.photo, turn: g.s.turn, read: true });
    p.hasNumber = false;
    p.fakeNumber = false;
    p.memory.unshift({ clock: g.s.clock, text: 'Gave you a fake number', tone: 'bad' });
    bump(p, 'rel', -5);
    return { error: `Not delivered — that number doesn’t exist. ${p.name} gave you a fake number. 😑`, reply: null, delay: 0 };
  }

  const useBurner = burner && itemCount(g, 'burner') > 0;
  if (chip.tab === 'underworld' && !useBurner) addDigital(g);

  // fast or drunk texting: a private photo can go to the wrong (adult) person
  let target = p;
  if (chip.photo && CHAT_POOLS[chip.pool]?.mature && (sentThisMonth(g, pid) >= MAX_PER_MONTH - 2 || g.flag('drunkTurn') >= g.s.turn - 1) && g.chance(0.15)) {
    const wrong = g.s.people.find((x) => x.id !== p.id && x.alive && x.hasNumber && canBeIntimate(g, x) && g.chance(0.3));
    if (wrong) target = wrong;
  }
  pushMsg(g, target.id, { from: 'me', text: chip.photo ? '' : chip.label, photo: chip.photo, burner: useBurner, turn: g.s.turn, read: false });
  if (target !== p) {
    const ok = g.chance(0.4);
    const reply = replyLine(g, target, 'photo_wrong', ok);
    pushMsg(g, target.id, { from: target.id, text: reply, turn: g.s.turn, kind: 'reaction' });
    bump(target, 'rel', ok ? -2 : -20);
    g.karma(-3);
    g.stat('mood', -15);
    if (['mother', 'father', 'sibling', 'child'].includes(target.role)) g.queue('wrong_chat_family', { pid: target.id });
    return { reply: `Sent to the wrong chat: ${target.name}. ${reply}`, delay: 900 };
  }

  const state = npcState(g, p);
  const before = { rel: p.rel, romance: p.romance, trust: p.trust, attraction: p.attraction, mood: g.s.stats.mood, money: g.s.money };
  const gamble = isGamble(chip);
  const mine = g.s.chats[pid][g.s.chats[pid].length - 1];
  // shy people sometimes leave a gamble on read; kind messages always get an answer
  if (gamble && (hasTrait(p, 'shy') || p.mood < 25) && g.chance(0.25)) {
    mine.read = true;
    bump(p, 'rel', -1);
    return { reply: null, delay: 0 };
  }
  let reply: string;
  if (state.mood === 'mad' && !['support', 'conflict'].includes(chip.tab)) {
    reply = `still mad about ${(state.reason ?? 'that').split(',')[0]}.`;
  } else {
    const ok = gamble ? Math.random() < allowed.odds : true;
    chip.run?.(g, p, ok);
    if (chip.reveals) for (const t of discover(p, chip.reveals, 20)) g.log(`🔍 You learned ${p.name} is ${t}.`, 'love', p.id);
    reply = replyLine(g, p, chip.pool, ok);
    if (MAD_CHIPS[chip.id] && (chip.id !== 'accuse' || ok)) setMad(g, p, MAD_CHIPS[chip.id]);
    if (chip.id === 'sorry') clearMad(g, p);
  }
  mine.read = state.mood !== 'busy';
  const turn = state.mood === 'busy' ? g.s.turn + 1 : g.s.turn;
  if (g.chance(0.3) && state.mood === 'ok') mine.reaction = g.pick(['❤️', '😂', '😮']);
  const theirPhoto = chip.id === 'askphoto' && reply && CHAT_POOLS.askphoto.ok.includes(reply) ? '📷 Private photo' : undefined;
  pushMsg(g, pid, { from: p.id, text: reply, photo: theirPhoto, turn, kind: 'reaction', effects: effectChip(g, p, before) || undefined });
  if (state.mood === 'busy') return { reply: null, delay: 0, note: `${p.name} is ${state.reason} — they’ll reply later.` };
  const delay = hasTrait(p, 'clingy') ? 300 : hasTrait(p, 'shy') ? 1600 : 800;
  return { reply, delay };
}

/** Unsend your last message — 30% they already saw it. */
export function unsend(g: Game, pid: string): string {
  const list = g.s.chats[pid];
  const idx = list ? [...list].reverse().findIndex((m) => m.from === 'me') : -1;
  if (!list || idx < 0) return '';
  const real = list.length - 1 - idx;
  const saw = list[real].read || g.chance(0.3);
  list.splice(real, 1);
  return saw ? 'Unsent… but they already saw it.' : 'Unsent. Crisis averted.';
}

// ------------------------------------------------------------ group chats

export function ensureGroups(g: Game) {
  const make = (id: GroupChat['kind'], name: string, icon: string, members: Person[]) => {
    const ids = members.filter((p) => p.alive && p.status === 'alive' && p.hasNumber).map((p) => p.id);
    const existing = g.s.groups.find((x) => x.kind === id);
    if (ids.length < 2) return;
    if (existing) existing.members = ids;
    else g.s.groups.push({ id: `grp:${id}`, name, icon, members: ids, kind: id });
  };
  make('family', 'Family 🏠', '🏠', g.peopleBy('mother', 'father', 'sibling', 'child'));
  make('friends', 'The Group Chat', '🫶', g.peopleBy('friend'));
  make('class', g.s.education.current ? 'Class Chat' : 'Old Classmates', '🎓', g.s.people.filter((p) => p.labels.includes('classmate')));
  make('work', 'Work Team', '💼', g.s.people.filter((p) => p.labels.includes('coworker') && !p.crewRole));
  if (g.age >= 18) make('crew', 'Crew', '🕶️', g.s.people.filter((p) => p.crewRole));
}

/** Groups only allow light, non-photo chips — nothing mature ever goes to a group. */
export const GROUP_TABS: ChatTab[] = ['greet', 'talk', 'plans', 'support', 'conflict'];
export const groupChips = (tab: ChatTab) => CHIPS.filter((c) => c.tab === tab && GROUP_TABS.includes(tab) && !c.photo && !CHAT_POOLS[c.pool]?.mature && !c.when);

export function sendGroup(g: Game, groupId: string, chipId: string): SendResult {
  const grp = g.s.groups.find((x) => x.id === groupId);
  const chip = CHIP_BY_ID[chipId];
  if (!grp || !chip || !groupChips(chip.tab).includes(chip)) return { error: 'Not available', reply: null, delay: 0 };
  if (sentThisMonth(g, groupId) >= MAX_PER_MONTH) return { error: `Limit reached — ${MAX_PER_MONTH} messages this month`, reply: null, delay: 0 };
  countMessage(g, groupId);
  pushMsg(g, groupId, { from: 'me', text: chip.label, turn: g.s.turn, read: true });
  const members = grp.members.map((id) => g.personById(id)).filter((p): p is Person => !!p && p.alive);
  const n = Math.min(members.length, g.rand(1, 3));
  let last = '';
  for (const p of [...members].sort(() => Math.random() - 0.5).slice(0, n)) {
    const ok = g.chance(base(g, p, 0.7));
    chip.run?.(g, p, ok);
    last = replyLine(g, p, chip.pool, ok);
    pushMsg(g, groupId, { from: p.id, text: last, turn: g.s.turn });
  }
  if (chip.tab === 'underworld' && grp.kind === 'crew') addDigital(g);
  return { reply: last, delay: 700 };
}

export const threadFor = (g: Game, id: string) => g.s.chats[id] ?? [];
