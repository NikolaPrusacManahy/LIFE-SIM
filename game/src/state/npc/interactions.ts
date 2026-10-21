import type { Game } from '../Game';
import type { Person, StatKey } from '../types';
import { cap, isRomanceEligible, isTeacher, romanceBlock, say } from './identity';
import { discover, knowsTrait, hasTrait } from './traits';
import { addLabel, dropLabel, relabel, ROMANCE_ROLES } from './labels';
import { line } from './lines';
import { itemCount, ITEMS, ITEM_BY_ID, spendItem } from '../inventory/items';
import { askNight, canBeIntimate, kiss, openTalk, talkBoundaries } from '../systems/intimacy';
import { studyPerf } from '../activities/helpers';
import { punish } from '../systems/trouble';
import { fmt } from '../systems/finance';
import { auditTarget, isValidCrimeTarget } from '../crime/consent';
import { commit, crimeLock } from '../crime/commit';
import { CRIME_BY_ID } from '../crime/catalog';
import { blackmail, DEMANDS, leverageOn, ransom, release, sendAway } from '../crime/captives';
import { CREW_ROLES, recruit } from '../crime/drugs';
import { openCase } from '../crime/investigation';
import type { CrewRole } from '../crime/types';
import { haremLock, inviteToHarem } from '../systems/god';
import { setMad } from './mood';
import type { ActionResult } from '../Game';
import { cannotConsent } from '../crime/consent';
import { VENUES, VENUE_ORDER, venueLock } from '../datenight/venues';
import { isRomanticDate, startDate } from '../datenight/date';
import type { DateVenue } from '../datenight/types';
import { hostLock } from '../datenight/venues';

const CAPITAL = ['murder_weapon', 'murder_gun', 'murder_poison', 'murder_sedative', 'murder_staged', 'murder_hire'];

// Update 0.4 — interactions grouped by relationship label. Each uses one time slot.

export type InteractionGroup = 'Talk' | 'Friends' | 'Romance' | 'Adult' | 'Rival' | 'Family' | 'Teacher' | 'Underworld';
export const GROUP_ICON: Record<InteractionGroup, string> = { Talk: '💬', Friends: '🤝', Romance: '💘', Adult: '🔞', Rival: '⚔️', Family: '🏠', Teacher: '🍎', Underworld: '🗡️' };

export interface InteractionOption {
  id: string;
  label: string;
  reason?: string | null;
}

export interface InteractionDef {
  id: string;
  label: string;
  icon: string;
  group: InteractionGroup;
  /** 18+ intimacy — gated by canBeIntimate() */
  mature?: boolean;
  /** romance — gated by isRomanceEligible() */
  romance?: boolean;
  /** Update 0.5 — crime against this person: adults only (isValidCrimeTarget) */
  crime?: boolean;
  /** needs Dark Crime on */
  dark?: boolean;
  /** only for someone you're holding */
  captive?: boolean;
  when: (g: Game, p: Person) => boolean;
  req?: (g: Game, p: Person) => string | null;
  options?: (g: Game, p: Person) => InteractionOption[];
  energy?: number;
  run: (g: Game, p: Person, opt?: string) => string;
}

const clamp = (v: number) => Math.max(0, Math.min(100, v));
export function bump(p: Person, axis: 'rel' | 'romance' | 'trust' | 'respect' | 'attraction' | 'rivalry', d: number) {
  const soft = d < 0 && axis !== 'rivalry' && knowsOrHas(p, 'kind') ? 0.5 : 1;
  p[axis] = clamp(p[axis] + d * soft);
}
const knowsOrHas = (p: Person, t: string) => hasTrait(p, t);

/** Social success odds for a stat-based interaction. */
export function socialOdds(g: Game, p: Person, stat: StatKey, base = 0.5) {
  let o = base + (g.s.stats[stat] - 50) / 120 + (p.mood - 50) / 300 + (p.rel - 50) / 250;
  if (hasTrait(p, 'shy') && p.rel < 40) o -= 0.12;
  if (g.s.karma < -40) o -= 0.15;
  if (g.s.fame >= 40) o += 0.06;
  if (g.flag('perfumeUntil') > g.s.clock) o += 0.06;
  return Math.max(0.06, Math.min(0.95, o));
}

const isFamily = (p: Person) => ['mother', 'father', 'sibling', 'child'].includes(p.role);
const isParent = (p: Person) => p.role === 'mother' || p.role === 'father';
const romantic = (p: Person) => ROMANCE_ROLES.includes(p.role);
const committed = (p: Person) => ['dating', 'partner', 'engaged', 'spouse'].includes(p.role);
const isProf = (p: Person) => p.role === 'professor';
const enrolledHS = (g: Game) => g.s.education.current?.program === 'hs';
const enrolledCollege = (g: Game) => !!g.s.education.current && g.s.education.current.program !== 'hs';
const noteTraits = (g: Game, p: Person, interaction: string) => {
  const found = discover(p, interaction);
  for (const t of found) g.log(`🔍 You learned ${p.name} is ${t}.`, 'love', p.id);
  return found.length ? ` (You learned: ${p.name} is ${found.join(', ')}.)` : '';
};
const touch = (g: Game, p: Person) => {
  p.lastContact = g.s.clock;
};
const memo = (g: Game, p: Person, text: string, tone: 'good' | 'bad' | 'neutral' = 'neutral') => {
  p.memory.unshift({ clock: g.s.clock, text, tone });
  if (p.memory.length > 20) p.memory.length = 20;
};

const HANG_OPTIONS = [
  { id: 'movies', label: '🎬 Movies ($14)' },
  { id: 'mall', label: '🛍️ Mall' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'sport', label: '⚽ Sports' },
  { id: 'study', label: '📚 Study' },
  { id: 'food', label: '🍜 Food ($20)' },
];
/** Update 0.10 — every date venue (the date itself is a scene: state/datenight). */
const DATE_OPTIONS = (g: Game): InteractionOption[] =>
  VENUE_ORDER.map((v) => ({ id: v, label: `${VENUES[v].icon} ${VENUES[v].name}${VENUES[v].cost ? ` ($${VENUES[v].cost})` : ''}`, reason: venueLock(g, v) }));

export const INTERACTIONS: InteractionDef[] = [
  // ======================= Talk (anyone)
  {
    id: 'chat', label: 'Chat', icon: '💬', group: 'Talk', energy: 4, when: () => true,
    run: (g, p) => {
      const ok = Math.random() < socialOdds(g, p, 'charm', 0.65);
      bump(p, 'rel', ok ? 4 : -1);
      if (ok && hasTrait(p, 'funny')) g.stat('mood', 2);
      return line(g, 'chat', p, ok) + noteTraits(g, p, 'chat');
    },
  },
  {
    id: 'compliment', label: 'Compliment', icon: '🌟', group: 'Talk', energy: 3, when: () => true,
    run: (g, p) => {
      const ok = Math.random() < socialOdds(g, p, 'charm', hasTrait(p, 'vain') ? 0.7 : 0.55);
      bump(p, 'rel', ok ? 5 : -2);
      if (ok && isRomanceEligible(g, p)) bump(p, 'attraction', 4);
      return line(g, 'compliment', p, ok) + noteTraits(g, p, 'compliment');
    },
  },
  {
    id: 'joke', label: 'Joke', icon: '😂', group: 'Talk', energy: 3, when: () => true,
    run: (g, p) => {
      const ok = Math.random() < socialOdds(g, p, 'charm', 0.5) * (hasTrait(p, 'funny') ? 1.15 : 1);
      bump(p, 'rel', ok ? 5 : -2);
      if (ok) g.stat('mood', 2);
      return line(g, 'joke', p, ok) + noteTraits(g, p, 'joke');
    },
  },
  {
    id: 'asklife', label: 'Ask about their life', icon: '🗨️', group: 'Talk', energy: 5, when: (g, p) => !isTeacher(p) || p.respect >= 40,
    run: (g, p) => {
      bump(p, 'rel', 3);
      bump(p, 'trust', 2);
      return say(g.pick(['{They} tell{s} you about {their} family. It’s complicated.', '{They} open{s} up about {their} dreams.', '{They} talk{s} about {their} job and {their} weekend plans.']), p) + noteTraits(g, p, 'asklife');
    },
  },
  {
    id: 'number', label: 'Ask for their number', icon: '📱', group: 'Talk', energy: 2, when: (g, p) => !p.hasNumber && !isFamily(p) && !isTeacher(p),
    run: (g, p) => {
      let o = 0.25 + p.rel / 140 + (g.s.stats.charm - 50) / 200 + (g.s.stats.looks - 50) / 300 + p.attraction / 300;
      if (p.mood > 70) o += 0.08;
      if (Math.random() < Math.max(0.08, Math.min(0.95, o))) {
        if (hasTrait(p, 'liar') && g.chance(0.3)) {
          p.fakeNumber = true;
          p.hasNumber = true;
          return say('{They} type{s} a number into your phone with a smile.', p);
        }
        p.hasNumber = true;
        p.theyHaveNumber = true;
        bump(p, 'rel', 3);
        relabel(g, p);
        return line(g, 'number', p, true);
      }
      bump(p, 'rel', -2);
      return line(g, 'number', p, false);
    },
  },
  {
    id: 'insult', label: 'Insult', icon: '🤬', group: 'Talk', energy: 3, when: (_g, p) => !isFamily(p) || p.role === 'sibling',
    run: (g, p) => {
      bump(p, 'rel', -12);
      bump(p, 'rivalry', 15);
      g.stat('street', 1);
      g.karma(-2);
      memo(g, p, 'You insulted them', 'bad');
      relabel(g, p);
      return line(g, 'insult', p, true) + noteTraits(g, p, 'insult');
    },
  },

  // ======================= Friends+
  {
    id: 'hangout', label: 'Hang out', icon: '🎳', group: 'Friends', energy: 12,
    when: (_g, p) => !isTeacher(p) && (p.rel >= 25 || isFamily(p) || romantic(p)),
    options: () => HANG_OPTIONS,
    run: (g, p, opt = 'food') => {
      const cost = opt === 'movies' ? 14 : opt === 'food' ? 20 : 0;
      if (cost && !g.canAfford(cost)) return 'You couldn’t afford it, so you just walked around.';
      if (cost) g.money(-cost);
      const ok = !(hasTrait(p, 'lazy') && opt === 'study' && g.chance(0.5));
      bump(p, 'rel', ok ? 7 : 2);
      if (romantic(p)) bump(p, 'romance', 3);
      g.stat('mood', hasTrait(p, 'funny') ? 8 : 5);
      if (opt === 'study') { g.stat('smarts', 1.5); studyPerf(g, 2); }
      if (opt === 'sport') g.stat('fitness', 1.5);
      if (opt === 'gaming') g.stat('creativity', 0.5);
      if (p.role === 'child') g.inc(`parented:${p.id}`);
      return line(g, 'hangout', p, ok) + noteTraits(g, p, `hang_${opt}`);
    },
  },
  {
    id: 'deeptalk', label: 'Deep talk', icon: '🫂', group: 'Friends', energy: 6, when: (_g, p) => !isTeacher(p) && (p.rel >= 35 || isFamily(p) || romantic(p)),
    run: (g, p) => {
      const ok = Math.random() < socialOdds(g, p, 'charm', 0.65);
      bump(p, 'rel', ok ? 4 : 0);
      bump(p, 'trust', ok ? 6 : 1);
      g.stat('mood', 3);
      return line(g, 'deeptalk', p, ok) + noteTraits(g, p, 'deeptalk');
    },
  },
  {
    id: 'secret', label: 'Share a secret', icon: '🤫', group: 'Friends', energy: 4, when: (_g, p) => !isTeacher(p) && p.rel >= 40,
    run: (g, p) => {
      bump(p, 'trust', 8);
      bump(p, 'rel', 3);
      if (hasTrait(p, 'gossip') && g.chance(0.6)) g.s.schedule.push({ at: g.s.clock + 1, id: 'secret_spread', ctx: { pid: p.id } });
      memo(g, p, 'You trusted them with a secret', 'good');
      return say('You told {name} something private. {They} promise{s} to keep it.', p) + noteTraits(g, p, 'secret');
    },
  },
  {
    id: 'askhelp', label: 'Ask for help', icon: '🙋', group: 'Friends', energy: 6, when: (_g, p) => !isTeacher(p) && p.rel >= 30,
    run: (g, p) => {
      bump(p, 'rel', 2);
      if (hasTrait(p, 'smart')) { g.stat('smarts', 2); studyPerf(g, 3); }
      g.stat('mood', 2);
      return say(hasTrait(p, 'kind') || hasTrait(p, 'loyal') ? '{They} drop{s} everything to help you.' : '{They} help{s} — eventually.', p) + noteTraits(g, p, 'askhelp');
    },
  },
  {
    id: 'askmoney', label: 'Ask for money', icon: '💸', group: 'Friends', energy: 3,
    when: (g, p) => (isParent(p) && g.age < 30) || (p.role === 'child' && g.ageOf(p) >= 18) || (p.rel >= 50 && !isTeacher(p) && !isFamily(p)),
    req: (g, p) => (g.onCooldown(`ask:${p.id}`) ? 'Asked recently' : null),
    run: (g, p) => {
      g.cooldown(`ask:${p.id}`, 16);
      const wealth = isParent(p) ? (g.s.background === 'rich' ? 2500 : g.s.background === 'middle' ? 400 : 60) : hasTrait(p, 'secretrich') ? 1500 : 200;
      const o = (hasTrait(p, 'generous') ? 0.75 : hasTrait(p, 'cheap') ? 0.15 : 0.4) + p.rel / 250;
      if (Math.random() < o) {
        const amt = Math.round(wealth * (0.5 + Math.random()));
        g.money(amt);
        bump(p, 'rel', -3);
        return say(`{name} sighed and handed you ${fmt(amt)}.`, p) + noteTraits(g, p, 'askmoney');
      }
      bump(p, 'rel', -6);
      return say('{name} said no. "Money doesn’t grow on trees."', p) + noteTraits(g, p, 'askmoney');
    },
  },
  {
    id: 'lend', label: 'Lend $200', icon: '🤲', group: 'Friends', energy: 2, when: (_g, p) => !isTeacher(p) && p.rel >= 40 && !isParent(p),
    req: (g) => (g.canAfford(200) ? null : 'Need $200'),
    run: (g, p) => {
      g.money(-200);
      bump(p, 'rel', 8);
      bump(p, 'trust', 4);
      memo(g, p, 'You lent them $200', 'good');
      if (!hasTrait(p, 'secretbroke') && !hasTrait(p, 'liar')) g.s.schedule.push({ at: g.s.clock + g.rand(1, 4), id: 'loan_repaid', ctx: { pid: p.id } });
      return say('{name} hugs you. "I’ll pay you back, I swear."', p);
    },
  },
  {
    id: 'gift', label: 'Give a gift', icon: '🎁', group: 'Friends', energy: 2, when: (_g, p) => !isTeacher(p) || p.role === 'professor',
    options: (g) => [
      ...ITEMS.filter((it) => it.gift && itemCount(g, it.id) > 0).map((it) => ({ id: it.id, label: `${it.icon} ${it.name}` })),
      { id: 'cash', label: '💵 Something nice ($50)', reason: g.canAfford(50) ? null : 'Need $50' },
    ],
    run: (g, p, opt = 'cash') => {
      let gain = 6;
      if (opt === 'cash') g.money(-50);
      else if (spendItem(g, opt)) {
        const it = ITEM_BY_ID[opt];
        gain = it.gift ?? 6;
        if (opt === 'flowers' && hasTrait(p, 'allergic')) {
          bump(p, 'rel', -2);
          return say('{name} sneezes violently. Turns out {they} {is} allergic to flowers.', p) + noteTraits(g, p, 'gift');
        }
        if (it.romantic && committed(p)) bump(p, 'romance', gain * (hasTrait(p, 'romantic') ? 1.4 : 1));
        if (opt === 'promise_ring' && committed(p)) memo(g, p, 'You gave them a promise ring', 'good');
      }
      bump(p, 'rel', gain);
      if (hasTrait(p, 'cheap')) g.inc(`giftsTo:${p.id}`);
      g.burst('hearts');
      return say(g.pick(['{name} loved it.', '{name} lit up.', '"You didn’t have to!" {They} clearly {is} thrilled.']), p) + noteTraits(g, p, 'gift');
    },
  },
  {
    id: 'invite', label: 'Invite to a party', icon: '🎉', group: 'Friends', energy: 10, when: (g, p) => !isTeacher(p) && p.rel >= 30 && g.phase !== 'morning',
    run: (g, p) => {
      bump(p, 'rel', hasTrait(p, 'homebody') ? 1 : 6);
      g.stat('mood', 7);
      g.stat('charm', 1);
      return say(hasTrait(p, 'homebody') ? '{name} came for an hour, then went home.' : '{name} brought snacks and stayed until 2am.', p) + noteTraits(g, p, 'invite');
    },
  },
  {
    id: 'prank', label: 'Prank them', icon: '🃏', group: 'Friends', energy: 6, when: (_g, p) => !isTeacher(p) && p.rel >= 40,
    run: (g, p) => {
      if (Math.random() < socialOdds(g, p, 'creativity', hasTrait(p, 'funny') ? 0.7 : 0.45)) {
        bump(p, 'rel', 4);
        return say('{name} screamed, then laughed for ten minutes.', p);
      }
      bump(p, 'rel', -8);
      if (hasTrait(p, 'hothead')) bump(p, 'rivalry', 10);
      return say('{name} did not find it funny. At all.', p) + noteTraits(g, p, 'confront');
    },
  },
  {
    id: 'gossip', label: 'Gossip about someone', icon: '🗣️', group: 'Friends', energy: 4, when: (_g, p) => !isTeacher(p) && p.rel >= 30,
    run: (g, p) => {
      bump(p, 'rel', 3);
      g.karma(-2);
      if (hasTrait(p, 'gossip') && g.chance(0.4)) g.s.schedule.push({ at: g.s.clock + 1, id: 'secret_spread', ctx: { pid: p.id, gossip: true } });
      return say('You and {name} tore someone apart. Fun. A little mean.', p) + noteTraits(g, p, 'gossip');
    },
  },
  {
    id: 'confront', label: 'Confront them', icon: '😠', group: 'Friends', energy: 6, when: (_g, p) => !isTeacher(p) && (p.memory.some((m) => m.tone === 'bad') || knowsTrait(p, 'liar') || knowsTrait(p, 'manipulative')),
    run: (g, p) => {
      if (Math.random() < socialOdds(g, p, 'charm', 0.5)) {
        bump(p, 'trust', 6);
        return say('{They} admitted it and apologized. You cleared the air.', p) + noteTraits(g, p, 'confront');
      }
      bump(p, 'rel', -10);
      bump(p, 'rivalry', 8);
      return say('{They} got defensive. It turned into a fight.', p) + noteTraits(g, p, 'confront');
    },
  },
  {
    id: 'apologise', label: 'Apologise', icon: '🙏', group: 'Friends', energy: 4, when: (_g, p) => p.rivalry >= 20 || p.memory.some((m) => m.tone === 'bad'),
    run: (g, p) => {
      bump(p, 'rivalry', -12);
      bump(p, 'rel', 6);
      g.karma(1);
      memo(g, p, 'You apologised', 'good');
      relabel(g, p);
      return say('{name} accepted your apology. Mostly.', p);
    },
  },
  {
    id: 'bestie', label: 'Best friends?', icon: '💞', group: 'Friends', energy: 4, when: (_g, p) => p.role === 'friend' && p.rel >= 85 && p.trust >= 75 && !p.tags.includes('bestie'),
    run: (g, p) => {
      p.tags.push('bestie');
      g.burst('hearts');
      g.milestone(`${p.name} became your best friend`);
      return say('"Obviously." {name} hugs you. Best friends.', p);
    },
  },

  // ======================= Romance (age-appropriate)
  {
    id: 'flirt', label: 'Flirt', icon: '😘', group: 'Romance', romance: true, energy: 4,
    when: (g, p) => !isTeacher(p) && !isFamily(p) && (!isProf(p) || g.age >= 18),
    req: (g, p) => romanceBlock(g, p),
    run: (g, p) => {
      const o = socialOdds(g, p, 'charm', 0.35) + (g.s.stats.looks - 50) / 200 + p.attraction / 250;
      if (Math.random() < o) {
        bump(p, 'attraction', 10);
        bump(p, 'romance', 6);
        if (['acquaintance', 'friend', 'coworker', 'ex', 'crew'].includes(p.role) || p.role === 'crush') p.role = p.attraction >= 40 ? 'talking' : 'crush';
        g.burst('hearts');
        return line(g, 'flirt', p, true) + noteTraits(g, p, 'flirt');
      }
      bump(p, 'rel', -3);
      return line(g, 'flirt', p, false);
    },
  },
  {
    id: 'askout', label: 'Ask them out', icon: '🌹', group: 'Romance', romance: true, energy: 4,
    when: (g, p) => ['crush', 'talking', 'fling'].includes(p.role) || (p.role === 'friend' && p.attraction >= 30),
    req: (g, p) => romanceBlock(g, p) ?? (g.age < 14 ? 'Too young' : null),
    run: (g, p) => {
      const o = 0.3 + p.attraction / 150 + p.rel / 300 + (g.s.stats.charm - 50) / 200;
      if (Math.random() < o) {
        p.role = 'dating';
        bump(p, 'romance', 12);
        g.burst('hearts');
        if (!g.flag('firstLove')) { g.setFlag('firstLove'); g.milestone(`Started dating ${p.name}`); }
        return say('{name} said yes! You’re dating.', p) + noteTraits(g, p, 'askout');
      }
      bump(p, 'rel', -8);
      g.stat('mood', -8);
      return say('{name} said {they} just want{s} to be friends. Ouch.', p) + noteTraits(g, p, 'askout');
    },
  },
  {
    // Update 0.10 — invite them over: a date at your place
    id: 'invite_over', label: 'Invite them over', icon: '🏠', group: 'Romance', romance: true, energy: 6, when: (g, p) => isRomanticDate(g, p),
    req: (g) => hostLock(g),
    run: (g, p) => startDate(g, p, 'home'),
  },
  {
    // Update 0.10 — romantic dates only; opens the date scene (spark, venue actions, moments)
    id: 'date', label: 'Go on a date', icon: '🕯️', group: 'Romance', romance: true, energy: 12, when: (g, p) => isRomanticDate(g, p),
    options: DATE_OPTIONS,
    run: (g, p, opt = 'park') => startDate(g, p, (VENUES[opt as DateVenue] ? opt : 'park') as DateVenue) + noteTraits(g, p, 'date'),
  },
  {
    id: 'holdhands', label: 'Hold hands', icon: '🤝', group: 'Romance', romance: true, energy: 1, when: (_g, p) => committed(p),
    run: (g, p) => { bump(p, 'romance', 3); g.stat('mood', 3); return say('You and {name} walk hand in hand. Simple. Perfect.', p); },
  },
  {
    id: 'official', label: 'Make it official', icon: '❤️', group: 'Romance', romance: true, energy: 3, when: (_g, p) => p.role === 'dating',
    req: (_g, p) => (p.romance >= 60 ? null : 'Romance 60 needed'),
    run: (g, p) => {
      if (hasTrait(p, 'commitphobe') && g.chance(0.5)) { bump(p, 'romance', -6); return say('{name} hesitated. "Can we not label it yet?"', p) + noteTraits(g, p, 'official'); }
      p.role = 'partner';
      bump(p, 'romance', 6);
      g.banner('❤️ Official', 0xff5c8a);
      return say('It’s official: you and {name} are together.', p);
    },
  },
  {
    id: 'meetparents', label: 'Meet the parents', icon: '👪', group: 'Romance', romance: true, energy: 10, when: (_g, p) => ['partner', 'engaged'].includes(p.role) && !p.tags.includes('metparents'),
    run: (g, p) => {
      p.tags.push('metparents');
      const ok = Math.random() < socialOdds(g, p, 'charm', 0.6);
      bump(p, 'romance', ok ? 8 : -4);
      return say(ok ? '{Their} parents loved you. {Their} mom asked when the wedding is.' : '{Their} dad grilled you about your "plans". Rough.', p);
    },
  },
  {
    id: 'breakup', label: 'Break up', icon: '💔', group: 'Romance', energy: 4, when: (_g, p) => ['dating', 'partner', 'engaged', 'talking'].includes(p.role),
    run: (g, p) => {
      p.role = 'ex';
      p.romance = 10;
      bump(p, 'rel', -30);
      memo(g, p, 'You broke up with them', 'bad');
      g.stat('mood', -8);
      return say('You ended things with {name}. It hurts, but it’s done.', p);
    },
  },

  // ======================= Adult romance (both 18+)
  {
    id: 'movein', label: 'Move in together', icon: '🏡', group: 'Adult', energy: 10,
    when: (g, p) => g.age >= 18 && g.ageOf(p) >= 18 && ['partner', 'engaged', 'spouse'].includes(p.role) && !p.tags.includes('livein'),
    req: (g) => (g.livesWithParents || g.s.housing === 'homeless' ? 'Get your own place first' : null),
    run: (g, p) => { p.tags.push('livein'); bump(p, 'romance', 8); g.milestone(`Moved in with ${p.name}`); return say('{name} moved in. {Their} stuff is everywhere. You love it.', p); },
  },
  {
    id: 'propose', label: 'Propose', icon: '💍', group: 'Adult', energy: 6,
    when: (g, p) => g.age >= 18 && g.ageOf(p) >= 18 && p.role === 'partner',
    req: (g, p) => (!['ring_basic', 'ring_nice', 'ring_lux'].some((r) => itemCount(g, r)) ? 'Buy an engagement ring' : p.romance < 70 ? 'Romance 70 needed' : null),
    run: (g, p) => {
      const ring = ['ring_lux', 'ring_nice', 'ring_basic'].find((r) => itemCount(g, r))!;
      const bonus = ring === 'ring_lux' ? 0.2 : ring === 'ring_nice' ? 0.1 : 0;
      const o = 0.35 + p.romance / 200 + bonus - (hasTrait(p, 'commitphobe') ? 0.25 : 0);
      if (Math.random() < o) {
        spendItem(g, ring);
        p.role = 'engaged';
        bump(p, 'romance', 10);
        g.burst('hearts');
        g.banner('💍 Engaged!', 0xff5c8a);
        g.milestone(`Got engaged to ${p.name}`);
        g.queue('wedding', { pid: p.id }, true);
        return say('{name} said YES!', p);
      }
      bump(p, 'romance', -15);
      g.stat('mood', -15);
      g.fx({ type: 'shake', power: 3 });
      return say('{name} looked away. "I’m not ready." The ring box snapped shut.', p) + noteTraits(g, p, 'official');
    },
  },
  {
    id: 'baby', label: 'Try for a baby', icon: '🍼', group: 'Adult', energy: 6,
    when: (g, p) => ['spouse', 'partner', 'engaged'].includes(p.role) && g.age >= 18 && g.ageOf(p) >= 18 && g.age <= 50,
    req: (g) => (g.flag('babyPending') ? 'Baby on the way' : null),
    run: (g, p) => {
      if (hasTrait(p, 'nokids')) { bump(p, 'romance', -8); return say('{name} doesn’t want kids. This is a real conversation now.', p) + noteTraits(g, p, 'deeptalk'); }
      if (g.chance(0.35)) {
        g.setFlag('pregnantUntil', g.s.clock + 9);
        g.setFlag('babyPending');
        if (!p.tags.includes('coparent')) p.tags.push('coparent');
        g.burst('hearts');
        g.milestone(`A baby is on the way with ${p.name}`);
        return 'Two pink lines! A baby is on the way.';
      }
      bump(p, 'romance', 3);
      return 'Nothing yet — but you’re closer than ever.';
    },
  },
  { id: 'boundaries', label: 'Talk about boundaries', icon: '🫶', group: 'Adult', energy: 4, when: (g, p) => g.age >= 18 && g.ageOf(p) >= 18 && committed(p), run: (g, p) => talkBoundaries(g, p) },
  { id: 'open', label: 'Open relationship talk', icon: '🗝️', group: 'Adult', energy: 4, when: (g, p) => g.age >= 18 && g.ageOf(p) >= 18 && ['partner', 'spouse', 'engaged'].includes(p.role), req: (_g, p) => (p.romance >= 80 ? null : 'Needs a very strong bond'), run: (g, p) => openTalk(g, p) },
  {
    id: 'therapy', label: 'Couples therapy ($150)', icon: '🛋️', group: 'Adult', energy: 6, when: (g, p) => g.age >= 18 && ['partner', 'spouse', 'engaged'].includes(p.role),
    req: (g) => (g.canAfford(150) ? null : 'Need $150'),
    run: (g, p) => { g.money(-150); bump(p, 'romance', 10); bump(p, 'trust', 8); for (const m of p.memory) if (m.tone === 'bad') m.tone = 'neutral'; return say('Hard conversations. You and {name} leave holding hands.', p); },
  },
  {
    id: 'divorce', label: 'Divorce', icon: '⚖️', group: 'Adult', energy: 6, when: (_g, p) => p.role === 'spouse',
    run: (g, p) => {
      p.role = 'ex';
      p.rel = 5;
      const split = Math.round(Math.max(0, g.s.money) * 0.5);
      g.money(-split);
      g.stat('mood', -15);
      memo(g, p, 'The divorce', 'bad');
      g.milestone(`Divorced ${p.name}`);
      return say(`The divorce is final. {name} walked away with ${fmt(split)}.`, p);
    },
  },
  { id: 'kiss', label: 'Kiss', icon: '💋', group: 'Adult', mature: true, energy: 2, when: (g, p) => canBeIntimate(g, p) && (romantic(p) || p.role === 'fling' || p.labels.includes('fwb')), req: (_g, p) => (p.rel < 40 ? 'Get closer first' : null), run: (g, p) => kiss(g, p) },
  { id: 'night', label: 'Spend the night', icon: '🌙', group: 'Adult', mature: true, energy: 8, when: (g, p) => canBeIntimate(g, p) && (romantic(p) || p.role === 'fling' || p.labels.includes('fwb') || p.labels.includes('situationship')), req: (_g, p) => (p.rel < 60 && !p.labels.includes('fwb') ? 'Get closer first' : null), run: (g, p) => askNight(g, p) },
  {
    id: 'fwb', label: 'Friends with benefits?', icon: '🔥', group: 'Adult', mature: true, energy: 4,
    when: (g, p) => canBeIntimate(g, p) && ['friend', 'acquaintance', 'ex', 'fling'].includes(p.role) && !p.labels.includes('fwb') && isRomanceEligible(g, p),
    req: (_g, p) => (p.rel < 40 ? 'Friendship 40 needed' : null),
    run: (g, p) => {
      if (Math.random() < 0.25 + p.attraction / 150 + (hasTrait(p, 'adventurous') ? 0.15 : 0) - (hasTrait(p, 'romantic') ? 0.15 : 0)) {
        addLabel(p, 'fwb');
        return say('{name} thinks about it, then grins. "No feelings. Deal."', p);
      }
      bump(p, 'rel', -4);
      return say('{name} laughs nervously. "I don’t think I could do that."', p);
    },
  },

  // ======================= Rivals
  {
    id: 'sabotage', label: 'Sabotage', icon: '🪤', group: 'Rival', energy: 8, when: (_g, p) => p.rivalry >= 30 && !isTeacher(p),
    run: (g, p) => {
      g.karma(-4);
      bump(p, 'rivalry', 10);
      if (g.chance(0.3)) { memo(g, p, 'You sabotaged them', 'bad'); g.stat('mood', -4); return say('{name} caught you red-handed. Everyone heard about it.', p); }
      return say('{name}’s plans fell apart. Nobody knows it was you.', p);
    },
  },
  {
    id: 'challenge', label: 'Challenge them', icon: '🏁', group: 'Rival', energy: 14, when: (_g, p) => p.rivalry >= 20 || p.labels.includes('rival'),
    options: () => [{ id: 'fitness', label: '🏃 A race' }, { id: 'smarts', label: '🧠 Grades / quiz' }, { id: 'charm', label: '🎤 Popularity' }],
    run: (g, p, opt = 'fitness') => {
      if (g.check(opt as StatKey, 50)) { bump(p, 'respect', 10); g.stat('mood', 8); g.fame(1); return say('You won. {name} shook your hand through gritted teeth.', p) + noteTraits(g, p, 'challenge'); }
      bump(p, 'rivalry', 8);
      g.stat('mood', -6);
      return say('{name} won. And {they} won’t let you forget it.', p) + noteTraits(g, p, 'challenge');
    },
  },
  {
    id: 'rumour', label: 'Spread a rumour', icon: '📣', group: 'Rival', energy: 4, when: (_g, p) => p.rivalry >= 30,
    run: (g, p) => { g.karma(-4); bump(p, 'rivalry', 12); return say('By lunch, everyone was whispering about {name}.', p); },
  },
  {
    id: 'peace', label: 'Make peace', icon: '🕊️', group: 'Rival', energy: 6, when: (_g, p) => p.rivalry >= 30,
    run: (g, p) => {
      if (Math.random() < socialOdds(g, p, 'charm', 0.45)) { bump(p, 'rivalry', -30); bump(p, 'rel', 10); relabel(g, p); return say('You and {name} called a truce. Maybe even friends?', p); }
      return say('{name} laughed in your face.', p);
    },
  },
  {
    id: 'fight', label: 'Fight', icon: '🥊', group: 'Rival', energy: 18, when: (_g, p) => p.rivalry >= 40 && !isTeacher(p) && !isFamily(p),
    run: (g, p) => {
      bump(p, 'rivalry', 10);
      g.stat('street', 2);
      const won = g.check('fitness', 50);
      if (!won) g.stat('health', -10);
      if (g.chance(0.4)) {
        const o = punish(g, { name: g.age < 18 ? 'School fight' : 'Assault', sev: g.age < 18 ? 2 : 2, kind: 'fight', by: g.age < 18 ? 'school' : 'police' });
        return say(`${won ? 'You won the fight.' : '{name} won the fight.'} Then the consequences: `, p) + o;
      }
      return say(won ? 'You won. {name} won’t forget it.' : '{name} knocked you down. Humiliating.', p);
    },
  },

  // ======================= Family
  {
    id: 'helphome', label: 'Help at home', icon: '🧽', group: 'Family', energy: 10, when: (g, p) => isParent(p) && g.livesWithParents,
    run: (g, p) => { bump(p, 'rel', 6); if (g.age < 18) g.money(25); return say('{name} noticed and said thanks. That felt good.', p); },
  },
  {
    id: 'argue', label: 'Argue', icon: '😤', group: 'Family', energy: 6, when: (_g, p) => isFamily(p),
    run: (g, p) => { bump(p, 'rel', -10); g.stat('mood', g.hasTrait('hothead') ? 3 : -4); g.inc('independence'); return say('Doors were slammed. {name} isn’t speaking to you.', p); },
  },
  {
    id: 'advice', label: 'Ask for advice', icon: '🧭', group: 'Family', energy: 4, when: (_g, p) => isParent(p) || p.role === 'mentor' || p.labels.includes('mentor'),
    run: (g, p) => { bump(p, 'rel', 3); g.stat('smarts', 1); if (g.s.job) g.s.job.perf = Math.min(100, g.s.job.perf + 5); return say('{name} gave you advice that actually worked.', p); },
  },
  {
    id: 'borrowcar', label: 'Borrow the car', icon: '🚗', group: 'Family', energy: 2, when: (g, p) => isParent(p) && g.livesWithParents && g.age >= 16,
    req: (g) => (g.flag('license') ? null : 'Need a license'),
    run: (g, p) => {
      if (Math.random() < 0.3 + p.rel / 150) { bump(p, 'rel', -1); g.stat('mood', 6); return say('{name} tossed you the keys. "Back by midnight."', p); }
      return say('"Not a chance." {name} kept the keys.', p);
    },
  },
  {
    id: 'care', label: 'Take care of them', icon: '🫶', group: 'Family', energy: 14, when: (g, p) => isParent(p) && g.ageOf(p) >= 65,
    run: (g, p) => { bump(p, 'rel', 10); g.karma(3); g.stat('mood', -2); return say('You spent the day with {name}: appointments, groceries, stories.', p); },
  },
  {
    id: 'visit', label: 'Ask them to visit', icon: '📞', group: 'Family', energy: 2, when: (g) => g.jailed,
    req: (_g, p) => (p.rel < 30 ? 'They won’t come' : null),
    run: (g, p) => { bump(p, 'rel', 2); g.stat('mood', 10); return say('{name} came to visit. For one hour, you weren’t a number.', p); },
  },

  // ======================= Teachers & professors (teachers are never romance-eligible)
  {
    id: 't_help', label: 'Ask for help after class', icon: '🙋', group: 'Teacher', energy: 8,
    when: (g, p) => (p.role === 'teacher' && enrolledHS(g)) || (isProf(p) && enrolledCollege(g)),
    run: (g, p) => { g.stat('smarts', 2); studyPerf(g, 3); bump(p, 'respect', 6); return say('{name} walked you through it until it clicked.', p); },
  },
  {
    id: 't_extra', label: 'Office hours / extra credit', icon: '➕', group: 'Teacher', energy: 14,
    when: (g, p) => (p.role === 'teacher' && enrolledHS(g)) || (isProf(p) && enrolledCollege(g)),
    run: (g, p) => { studyPerf(g, 5); bump(p, 'respect', 3); return say('Extra credit, earned. {name} looked impressed.', p); },
  },
  {
    id: 't_argue', label: 'Argue a grade', icon: '📝', group: 'Teacher', energy: 6,
    when: (g, p) => (p.role === 'teacher' && enrolledHS(g)) || (isProf(p) && enrolledCollege(g)),
    run: (g, p) => {
      if (g.check(g.s.stats.charm > g.s.stats.smarts ? 'charm' : 'smarts', 55)) { studyPerf(g, 4); bump(p, 'respect', -2); return say('{name} reconsidered. Grade bumped.', p); }
      bump(p, 'respect', -6);
      return say('{name} was not persuaded.', p);
    },
  },
  {
    id: 't_pet', label: 'Be the teacher’s pet', icon: '🍎', group: 'Teacher', energy: 6, when: (g, p) => p.role === 'teacher' && enrolledHS(g),
    run: (g, p) => { bump(p, 'respect', 10); for (const c of g.s.people.filter((x) => x.labels.includes('classmate'))) bump(c, 'rel', -2); return say('{name} beamed. Your classmates rolled their eyes.', p); },
  },
  {
    id: 't_talkback', label: 'Talk back', icon: '🙄', group: 'Teacher', energy: 4, when: (g, p) => p.role === 'teacher' && enrolledHS(g),
    run: (g, p) => {
      bump(p, 'respect', -12);
      g.fame(1);
      for (const c of g.s.people.filter((x) => x.labels.includes('classmate'))) bump(c, 'rel', 1);
      if (g.chance(0.4) && g.s.education.current) { g.s.education.current.warnings++; return say('Detention. {name} wrote you up. The class loved it.', p); }
      return say('The class went "ooooh". {name} glared.', p);
    },
  },
  {
    id: 't_rec', label: 'Ask for a recommendation letter', icon: '✉️', group: 'Teacher', energy: 4,
    when: (g, p) => (p.role === 'teacher' && enrolledHS(g) && g.age >= 17) || (isProf(p) && enrolledCollege(g)),
    req: (g, p) => (g.flag(`rec:${p.id}`) ? 'Already wrote one' : null),
    run: (g, p) => {
      g.setFlag(`rec:${p.id}`);
      const q = p.respect;
      g.setFlag(isProf(p) ? 'gradRec' : 'recLetter', Math.max(g.flag(isProf(p) ? 'gradRec' : 'recLetter'), q));
      return say(q >= 70 ? '{name} wrote a glowing letter. Admissions will notice.' : q >= 45 ? '{name} wrote a decent letter.' : '{name} wrote… a letter. A short one.', p);
    },
  },
  {
    id: 't_confide', label: 'Confide a problem', icon: '💭', group: 'Teacher', energy: 6, when: (g, p) => (p.role === 'teacher' && enrolledHS(g)) || (isProf(p) && enrolledCollege(g)),
    run: (g, p) => { bump(p, 'respect', 5); bump(p, 'trust', 6); g.stat('mood', 6); relabel(g, p); return say('{name} listened and pointed you to the counselor. You feel lighter.', p); },
  },
  {
    id: 't_club', label: 'Join their club', icon: '♟️', group: 'Teacher', energy: 12, when: (g, p) => p.role === 'teacher' && enrolledHS(g) && !p.tags.includes('club'),
    run: (g, p) => { p.tags.push('club'); bump(p, 'respect', 8); g.stat('smarts', 1); g.stat('creativity', 1); return say(`You joined ${'{name}'}’s ${p.subject ?? 'after-school'} club.`, p); },
  },
  {
    id: 't_gift', label: 'Thank-you gift ($15)', icon: '🎁', group: 'Teacher', energy: 2, when: (g, p) => (p.role === 'teacher' && enrolledHS(g)) || isProf(p),
    req: (g) => (g.canAfford(15) ? null : 'Need $15'),
    run: (g, p) => { g.money(-15); bump(p, 'respect', 5); return say('{name} put your card on {their} desk.', p); },
  },
  {
    id: 't_report', label: 'Report unfair treatment', icon: '🚩', group: 'Teacher', energy: 6, when: (g, p) => p.role === 'teacher' && enrolledHS(g) && p.tags.includes('unfair'),
    run: (g, p) => { g.queue('teacher_investigation', { pid: p.id }, true); return say('You filed a complaint about {name}.', p); },
  },
  {
    id: 'p_ra', label: 'Research assistant job', icon: '🔬', group: 'Teacher', energy: 18, when: (g, p) => isProf(p) && enrolledCollege(g),
    req: (g, p) => (g.s.stats.smarts < 65 ? 'Needs Smarts 65' : p.respect < 60 ? 'Respect 60 needed' : null),
    run: (g, p) => { g.money(250); g.stat('smarts', 2.5); bump(p, 'respect', 4); return say('A long day in {name}’s lab. $250 and your name on a poster.', p); },
  },
  {
    id: 'p_flirt', label: 'Flirt with the professor', icon: '😳', group: 'Adult', mature: true, energy: 4,
    when: (g, p) => isProf(p) && enrolledCollege(g) && canBeIntimate(g, p),
    req: (g, p) => (isRomanceEligible(g, p) ? null : romanceBlock(g, p)),
    run: (g, p) => {
      if (Math.random() < 0.15 + p.attraction / 400) {
        addLabel(p, 'affair');
        bump(p, 'attraction', 15);
        g.s.schedule.push({ at: g.s.clock + g.rand(1, 3), id: 'prof_scandal', ctx: { pid: p.id } });
        return say('{name} doesn’t shut it down. This is a very bad idea.', p);
      }
      bump(p, 'respect', -20);
      return say('{name} goes cold. "That is inappropriate. Office hours are over."', p);
    },
  },
  // ======================= Underworld (Update 0.5) — adults only, gated by isValidCrimeTarget()
  // Update 0.6 — gods may keep a circle of willing adult partners; each one decides
  {
    id: 'g_harem', label: 'Invite into your circle', icon: '👑', group: 'Romance', romance: true, energy: 4, when: (g) => g.s.god,
    req: (g, p) => haremLock(g, p),
    run: (g, p) => inviteToHarem(g, p),
  },
  {
    id: 'u_threaten', label: 'Threaten them', icon: '😠', group: 'Underworld', crime: true, energy: 6, when: (_g, p) => !isFamily(p) || p.role === 'sibling',
    run: (g, p) => {
      auditTarget(g, p, 'threaten');
      g.karma(-5);
      bump(p, 'rivalry', 20);
      bump(p, 'rel', -15);
      if (!p.tags.includes('fear')) p.tags.push('fear');
      if (hasTrait(p, 'hothead')) return say('{name}: "Come say that to my face." This isn’t over.', p);
      if (g.chance(0.3)) { openCase(g, 'assault', null, p.id, ['witness', 'digital']).suspect = true; return say('{name} went pale — then went to the police.', p); }
      return say('{name} backed down. {They} won’t look at you anymore.', p);
    },
  },
  { id: 'u_assault', label: 'Assault', icon: '🥊', group: 'Underworld', crime: true, energy: 18, when: (_g, p) => !isTeacher(p), run: (g, p) => commit(g, 'assault', p).text },
  { id: 'u_rob', label: 'Rob them', icon: '💰', group: 'Underworld', crime: true, dark: true, energy: 16, when: () => true, req: (g) => crimeLock(g, CRIME_BY_ID.robbery), run: (g, p) => commit(g, 'robbery', p).text },
  {
    id: 'u_kidnap', label: 'Take them', icon: '🪢', group: 'Underworld', crime: true, dark: true, energy: 24, when: () => true,
    req: (g) => crimeLock(g, CRIME_BY_ID.kidnap),
    run: (g, p) => commit(g, 'kidnap', p).text,
  },
  {
    id: 'u_kill', label: 'End it', icon: '⚰️', group: 'Underworld', crime: true, dark: true, energy: 24, when: () => true,
    options: (g) => CAPITAL.map((id) => ({ id, label: `${CRIME_BY_ID[id].icon} ${CRIME_BY_ID[id].name}`, reason: crimeLock(g, CRIME_BY_ID[id]) })),
    run: (g, p, opt = 'murder_staged') => commit(g, opt, p).text,
  },
  {
    id: 'u_blackmail', label: 'Blackmail', icon: '📸', group: 'Underworld', crime: true, energy: 6, when: () => true,
    req: (g, p) => (leverageOn(g, p).length ? null : 'No leverage on them'),
    options: () => DEMANDS.map((d) => ({ id: d.id, label: d.label })),
    run: (g, p, opt = 'cash') => blackmail(g, p, opt),
  },
  {
    id: 'u_recruit', label: 'Recruit to your crew', icon: '🕶️', group: 'Underworld', crime: true, dark: true, energy: 8, when: (_g, p) => !p.crewRole && !isFamily(p) && !isTeacher(p),
    req: (g, p) => (p.rel < 35 ? 'Friendship 35 needed' : g.s.stats.street < 20 ? 'Needs Street 20' : null),
    options: () => CREW_ROLES.map((r) => ({ id: r.id, label: `${r.icon} ${r.name}` })),
    run: (g, p, opt = 'muscle') => recruit(g, p, opt as CrewRole),
  },
  // captive-only options
  { id: 'c_ransom', label: 'Demand ransom', icon: '💵', group: 'Underworld', captive: true, energy: 6, when: (_g, p) => p.status === 'captive', run: (g, p) => ransom(g, p) },
  { id: 'c_release', label: 'Let them go', icon: '🚪', group: 'Underworld', captive: true, energy: 4, when: (_g, p) => p.status === 'captive', run: (g, p) => release(g, p) },
  { id: 'c_away', label: 'Send them far away', icon: '🚌', group: 'Underworld', captive: true, energy: 8, when: (_g, p) => p.status === 'captive', run: (g, p) => sendAway(g, p) },
];

export const INTERACTION_BY_ID: Record<string, InteractionDef> = Object.fromEntries(INTERACTIONS.map((i) => [i.id, i]));

export interface ResolvedInteraction {
  def: InteractionDef;
  ok: boolean;
  reason?: string;
  options?: InteractionOption[];
}

/** What can you do with this person right now? Romance and mature entries are gated here. */
export function interactionsFor(g: Game, p: Person): ResolvedInteraction[] {
  if (p.status === 'captive') return INTERACTIONS.filter((i) => i.captive).map((def) => ({ def, ok: g.canAct() }));
  if (!p.alive || p.status !== 'alive' || p.blocked) return [];
  const list = g.jailed ? INTERACTIONS.filter((i) => i.id === 'visit') : INTERACTIONS.filter((i) => !i.captive);
  const out: ResolvedInteraction[] = [];
  for (const def of list) {
    if (def.mature && !canBeIntimate(g, p)) continue;
    if (def.romance && isTeacher(p)) continue;
    // Update 0.9 — no romance with anyone who can't consent (breaking up is still allowed)
    if (def.romance && def.id !== 'breakup' && cannotConsent(g, p)) continue;
    if (def.crime && !isValidCrimeTarget(g, p, !!def.dark)) continue;
    if (!def.when(g, p)) continue;
    if (def.romance && def.id !== 'flirt' && !isRomanceEligible(g, p)) continue;
    const reason = def.req?.(g, p) ?? (!usesSlot(def) && g.usedNow(onceKey(p.id, def.id)) ? 'Once per time of day' : null);
    out.push({ def, ok: !reason && g.canAct(), reason: reason ?? undefined, options: def.options?.(g, p) });
  }
  return out;
}

/** Run an interaction (spends a time slot via Game.spendTurn in the UI). */
const MAD_AFTER: Record<string, string> = {
  insult: 'insulted them', argue: 'argued with them', confront: 'confronted them', fight: 'fought them', sabotage: 'sabotaged them', rumour: 'spread a rumour', breakup: 'broke up with them', prank: 'pranked them', u_threaten: 'threatened them', t_talkback: 'talked back',
};

/** Update 0.8 — these take real time (outings, care, crimes). Everything else on a profile is free, once per time slot. */
export const USES_SLOT = new Set([
  'hangout', 'date', 'invite_over', 'invite', 'care', 'helphome', 'visit', 'therapy', 'meetparents', 'night', 'fight', 'challenge',
  't_help', 't_extra', 't_club', 'p_ra', 'u_assault', 'u_rob', 'u_kidnap', 'u_kill', 'c_ransom', 'c_away',
]);
export const usesSlot = (def: InteractionDef) => USES_SLOT.has(def.id);
const onceKey = (pid: string, id: string) => `ia:${pid}:${id}`;

/** Run an interaction from the UI or the simulator: outings use the slot, the rest are free. */
export function doInteraction(g: Game, pid: string, id: string, opt?: string): ActionResult | null {
  const def = INTERACTION_BY_ID[id];
  if (!def) return null;
  const fn = () => interact(g, pid, id, opt);
  return usesSlot(def) ? g.spendTurn(def.label, def.icon, fn, pid) : g.freeAction(def.label, def.icon, fn, pid);
}

export function interact(g: Game, pid: string, id: string, opt?: string): string {
  const p = g.personById(pid);
  const def = INTERACTION_BY_ID[id];
  if (!p || !def) return '';
  if (def.mature && !canBeIntimate(g, p)) return '';
  if (def.romance && def.id !== 'flirt' && !isRomanceEligible(g, p)) return '';
  if (def.romance && def.id !== 'breakup' && cannotConsent(g, p)) return '';
  if (def.crime && !isValidCrimeTarget(g, p, !!def.dark)) return '';
  if (def.captive && p.status !== 'captive') return '';
  if (!usesSlot(def)) {
    if (g.usedNow(onceKey(pid, id))) return '';
    g.markUsed(onceKey(pid, id));
  }
  if (def.energy) g.stat('energy', -def.energy);
  touch(g, p);
  const text = def.run(g, p, opt);
  // Update 0.8 — hostile in-person actions leave them upset, so their texts make sense
  if (MAD_AFTER[def.id]) setMad(g, p, MAD_AFTER[def.id]);
  relabel(g, p);
  return cap(text);
}

/** Free a person from the UI flow: drop all romance flags (e.g. after they move away). */
export function clearRomance(p: Person) {
  dropLabel(p, 'fwb');
  dropLabel(p, 'situationship');
}

