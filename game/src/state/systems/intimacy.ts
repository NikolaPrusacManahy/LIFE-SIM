import type { Game } from '../Game';
import type { HiddenTraits, Person, StiKind } from '../types';
import { settings } from '../settings';
import { cannotConsent } from '../crime/consent';
import { itemCount, spendItem } from '../inventory/items';
import { line } from '../npc/lines';

// Update 0.3 — adult relationships (non-explicit). HARD RULES:
//  1. Every action here requires BOTH people to be 18+ AND Mature Content on — checked through canBeIntimate().
//  2. Consent is a mechanic: a "no" only ever offers respectful responses.
//  3. Outcomes are a fade-to-black line plus consequences (pregnancy, STIs, trust).

export interface IntimacyAudit {
  what: string;
  playerAge: number;
  partnerAge: number;
}
/** Every intimacy outcome is recorded so tests can prove no minor is ever involved. */
export const INTIMACY_AUDIT: IntimacyAudit[] = [];

export function canBeIntimate(g: Game, p: Person | null | undefined): boolean {
  return !!p && p.alive && settings.mature && g.age >= 18 && g.ageOf(p) >= 18 && !g.jailed && !cannotConsent(g, p);
}

function audit(g: Game, p: Person, what: string) {
  if (!canBeIntimate(g, p)) throw new Error(`intimacy gate violated: ${what}`);
  INTIMACY_AUDIT.push({ what, playerAge: g.age, partnerAge: g.ageOf(p) });
  if (INTIMACY_AUDIT.length > 5000) INTIMACY_AUDIT.splice(0, 1000);
}

const STI_POOL: [StiKind, number][] = [['chlamydia', 0.45], ['gonorrhea', 0.2], ['herpes', 0.25], ['hiv', 0.1]];
export const STI_LABEL: Record<StiKind, string> = { none: 'None', chlamydia: 'Chlamydia', gonorrhea: 'Gonorrhea', herpes: 'Herpes', hiv: 'HIV' };
export const STI_CURABLE: Record<StiKind, boolean> = { none: true, chlamydia: true, gonorrhea: true, herpes: false, hiv: false };

function rollSti(g: Game, risk: number): StiKind {
  if (!g.chance(risk)) return 'none';
  let r = Math.random();
  for (const [k, w] of STI_POOL) {
    r -= w;
    if (r <= 0) return k;
  }
  return 'chlamydia';
}

/** Hidden partner stats, generated the first time they matter. */
export function hiddenOf(g: Game, p: Person): HiddenTraits {
  if (!p.hidden) {
    const r = () => Math.round(Math.random() * 100) / 100;
    p.hidden = {
      sti: g.ageOf(p) >= 18 ? rollSti(g, p.role === 'fling' ? 0.14 : 0.06) : 'none',
      fidelity: 0.4 + r() * 0.6,
      wantsKids: r(),
      jealousy: r(),
      commitment: r(),
      attraction: 0.3 + r() * 0.7,
      onPill: Math.random() < 0.25,
    };
  }
  return p.hidden;
}

export function consentOdds(g: Game, p: Person, what: 'kiss' | 'night'): number {
  const h = hiddenOf(g, p);
  const need = what === 'kiss' ? 40 : 60;
  let o = 0.35 + (p.rel - need) / 70 + (h.attraction - 0.5) * 0.5 + (g.s.stats.looks - 50) / 250 + (g.s.stats.charm - 50) / 300;
  if (g.flag(`bound:${p.id}`)) o += 0.1;
  if (what === 'night' && p.sexuality === 'ace') o -= 0.35;
  if (g.s.stats.mood < 25) o -= 0.1;
  return Math.max(0.05, Math.min(0.95, o));
}

/** The player's current infection, if any. */
export function playerSti(g: Game): StiKind {
  for (const [k] of STI_POOL) if (g.flag(`sti:${k}`)) return k;
  return 'none';
}

export const condoms = (g: Game) => itemCount(g, 'condoms');
export const onBirthControl = (g: Game) => g.flag('pillUntil') > g.s.clock;

const canConceive = (g: Game, p: Person) => g.s.gender !== p.gender || g.s.gender === 'nonbinary' || p.gender === 'nonbinary';

/** Asking to kiss: a soft no is handled inline with no pushing. */
export function kiss(g: Game, p: Person): string {
  if (!canBeIntimate(g, p)) return '';
  if (g.chance(consentOdds(g, p, 'kiss'))) {
    audit(g, p, 'kiss');
    g.rel(p, 6);
    g.stat('mood', 5);
    g.burst('hearts');
    if (p.role === 'friend' || p.role === 'ex' || p.role === 'coworker') p.role = 'crush';
    return `You and ${p.name} shared a kiss.`;
  }
  g.rel(p, -1);
  return `${p.name} smiled and leaned back. "Not yet." You nodded — no pressure.`;
}

/** Asking to spend the night: yes → protection choice; no → respectful response only. */
export function askNight(g: Game, p: Person): string {
  if (!canBeIntimate(g, p)) return '';
  if (g.chance(consentOdds(g, p, 'night'))) return `You asked ${p.name} if they wanted to stay. They said yes. ${beginNight(g, p)}`;
  g.queue('consent_no', { pid: p.id }, true);
  return `You asked ${p.name} if they wanted to stay over.`;
}

/** Update 0.4 — route a yes through the first-time and roommate flows before the protection choice. */
export function beginNight(g: Game, p: Person): string {
  if (!canBeIntimate(g, p)) return '';
  if (!g.flag('hadFirstTime')) {
    g.queue('first_time', { pid: p.id }, true);
    return '';
  }
  const roommate = g.s.people.find((x) => x.labels.includes('roommate') && x.status === 'alive');
  if (g.s.housing === 'shared' && roommate && g.chance(0.5)) {
    g.queue('sexile', { pid: p.id }, true);
    return '';
  }
  g.queue('protection_choice', { pid: p.id }, true);
  return '';
}

/** The fade-to-black outcome plus every consequence. */
export function encounter(g: Game, p: Person, protection: 'condom' | 'pill' | 'none'): string {
  audit(g, p, 'night');
  const h = hiddenOf(g, p);
  g.stat('mood', 12);
  g.rel(p, 8);
  g.burst('hearts');
  g.inc('encounters');
  // a few drinks in, protection gets forgotten
  if (protection === 'condom' && g.flag('drunkTurn') >= g.s.turn - 1 && g.chance(0.25)) protection = 'none';
  if (protection === 'condom') spendItem(g, 'condoms');
  const first = !g.flag('hadFirstTime');
  g.setFlag('hadFirstTime');
  if (p.role === 'fling') g.inc('flings');

  // cheating on someone else?
  const other = g.firstBy('spouse', 'partner');
  if (other && other.id !== p.id) g.inc(`cheatOn:${other.id}`);

  // pregnancy
  const pillOn = onBirthControl(g) || h.onPill;
  const preg = protection === 'condom' ? 0.025 : pillOn ? 0.01 : 0.18;
  if (canConceive(g, p) && !g.flag('pregNewsAt') && !g.flag('babyPending') && g.chance(preg)) {
    g.setFlag('pregNewsAt', g.s.clock + 1);
    if (!p.tags.includes('coparent')) p.tags.push('coparent');
  }
  // STIs, both directions
  const mine = playerSti(g);
  if (h.sti !== 'none' && mine === 'none' && g.chance(protection === 'condom' ? 0.03 : 0.35)) {
    g.setFlag(`sti:${h.sti}`, g.s.clock);
    g.setFlag('stiSymptomsAt', g.s.clock + g.rand(1, 2));
  }
  if (mine !== 'none' && h.sti === 'none' && g.chance(protection === 'condom' ? 0.03 : 0.35)) h.sti = mine;

  // aftermath flavour
  let after = '';
  if (first) {
    const regret = g.chance(g.flag('talkedFirst') || g.flag('workshop') ? 0.08 : 0.2);
    g.stat('mood', regret ? -8 : 6);
    after = regret ? ' Afterwards, you weren’t sure it was the right moment.' : ' Awkward, sweet, and yours.';
  } else if (p.role === 'fling' && g.chance(0.12)) {
    g.stat('mood', -6);
    after = ' In the morning, you felt a little empty.';
  }
  if (p.role === 'fling' && g.phase === 'night' && g.chance(0.3)) g.queue('walk_of_shame');
  if (g.s.housing === 'shared' && g.chance(0.08)) g.queue('walkin');
  return line(g, p.labels.includes('fwb') ? 'fwb' : 'night', p, true) + after;
}

export function talkBoundaries(g: Game, p: Person): string {
  g.setFlag(`bound:${p.id}`);
  g.rel(p, 4);
  g.stat('charm', 0.5);
  return `You and ${p.name} talked honestly about what you both want. Fewer misunderstandings ahead.`;
}

export function openTalk(g: Game, p: Person): string {
  const h = hiddenOf(g, p);
  const r = Math.random();
  if (r < 0.3 + (1 - h.jealousy) * 0.3) {
    p.tags.push('open');
    return `${p.name} thought about it, then agreed — with clear rules.`;
  }
  if (r < 0.85 || h.commitment > 0.5) {
    g.rel(p, -12);
    return `${p.name} said no. Firmly. The topic is closed.`;
  }
  p.role = 'ex';
  g.stat('mood', -12);
  return `${p.name} was hurt. "If you want that, we’re done." They left.`;
}

/** Monthly consequences: pregnancy news, STI symptoms, cheating discovery. */
export function intimacyMonth(g: Game) {
  const s = g.s;
  if (g.flag('pregNewsAt') && s.clock >= g.flag('pregNewsAt')) {
    s.flags.pregNewsAt = 0;
    const p = s.people.find((x) => x.tags.includes('coparent') && x.alive);
    if (p) g.queue('pregnancy_news', { pid: p.id });
  }
  const sti = playerSti(g);
  if (sti !== 'none') {
    if (!g.flag('stiKnown') && g.flag('stiSymptomsAt') && s.clock >= g.flag('stiSymptomsAt')) {
      s.flags.stiSymptomsAt = 0;
      g.queue('sti_symptoms', { sti });
    }
    if (!g.flag('stiTreated')) g.stat('health', sti === 'hiv' ? -1.2 : -0.6);
  }
  for (const p of g.peopleBy('partner', 'spouse')) {
    const n = g.flag(`cheatOn:${p.id}`);
    if (n > 0 && !p.tags.includes('open') && !g.queued('cheating_discovered') && g.chance(0.06 + hiddenOf(g, p).jealousy * 0.12 + n * 0.02)) {
      g.queue('cheating_discovered', { pid: p.id });
    }
  }
}

/** Clinic visit: test + treatment. */
export function stiTest(g: Game): string {
  const sti = playerSti(g);
  if (sti === 'none') return 'All clear. Negative on everything.';
  g.setFlag('stiKnown');
  if (STI_CURABLE[sti]) {
    g.setFlag(`sti:${sti}`, 0);
    g.setFlag('stiKnown', 0);
    g.stat('health', 4);
    return `Positive for ${STI_LABEL[sti]}. A course of antibiotics later, it’s cleared.`;
  }
  g.setFlag('stiTreated');
  return `Positive for ${STI_LABEL[sti]}. It’s manageable with ongoing treatment — the doctor set you up with a plan.`;
}

