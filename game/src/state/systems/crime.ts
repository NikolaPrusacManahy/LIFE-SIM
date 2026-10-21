import type { Game } from '../Game';
import type { StatKey } from '../types';
import { ORG_BY_ID, type OrgDef } from '../data/orgs';
import { CAREER_BY_ID } from '../data/careers';
import { fmt } from './finance';
import { dropOut } from './education';

export interface CrimeSpec {
  name: string;
  sev: number; // 1 petty .. 5 major felony
  stat: StatKey;
  diff: number;
  reward: [number, number];
  heat: number;
  karma: number;
  street?: number;
  win: (amt: number) => string;
  fail: string;
}

export function crimeOdds(g: Game, c: CrimeSpec) {
  let diff = c.diff;
  if (g.phase === 'night') diff -= 6;
  if (g.s.crime.org) diff -= 4 + g.s.crime.org.rank * 2;
  diff += g.s.heat / 10;
  return g.statOdds(c.stat, diff);
}

export function commitCrime(g: Game, c: CrimeSpec): { ok: boolean; text: string } {
  g.s.crime.crimes++;
  g.karma(c.karma);
  if (g.s.crime.crimes === 1) g.achieve('firstcrime');
  if (g.s.job && CAREER_BY_ID[g.s.job.careerId].noRecord) g.inc('dirtycop');
  if (Math.random() < crimeOdds(g, c)) {
    const amt = c.reward[1] > 0 ? g.rand(c.reward[0], c.reward[1]) : 0;
    if (amt) g.money(amt);
    g.stat('street', c.street ?? c.sev * 1.5);
    g.heat(c.heat);
    g.stat('mood', 3);
    if (amt) g.burst('coins');
    if (g.s.crime.org) g.s.crime.org.respect += c.sev;
    return { ok: true, text: c.win(amt) };
  }
  g.heat(c.heat * 1.6);
  const caughtP = 0.3 + c.sev * 0.07 + g.s.heat / 250;
  if (g.chance(caughtP)) {
    g.fx({ type: 'police' });
    g.queue('busted', { name: c.name, sev: c.sev, kind: 'theft' }, true);
    return { ok: false, text: `${c.fail} Red and blue lights flood the street...` };
  }
  g.stat('mood', -3);
  g.fx({ type: 'shake', power: 4 });
  return { ok: false, text: `${c.fail} You slipped away before anyone could stop you.` };
}

export function sentenceMonths(sev: number) {
  const table: [number, number][] = [[0, 0], [1, 3], [4, 9], [12, 30], [36, 72], [96, 240]];
  const [a, b] = table[Math.max(0, Math.min(5, sev))];
  return Math.round(a + Math.random() * (b - a));
}

/** Update 0.3 — every incarceration, so tests can prove minors only ever go to juvenile hall. */
export const JAIL_AUDIT: { age: number; juvie: boolean; months: number }[] = [];

export function sendToJail(g: Game, months: number, crime: string) {
  const s = g.s;
  months = Math.max(1, Math.round(months));
  const juvie = g.age < 18;
  if (juvie) months = Math.max(1, Math.round(months * 0.5));
  if (!juvie) s.crime.record.push(crime);
  JAIL_AUDIT.push({ age: g.age, juvie, months });
  s.crime.jail = { monthsLeft: months, total: months, behavior: 50, juvie, paroleTried: false };
  s.crime.fugitive = false;
  s.location = 'jail';
  g.heat(-100);
  g.stat('mood', -20);
  g.fx({ type: 'shake', power: 10 });
  g.banner(juvie ? 'JUVIE' : 'SENTENCED', 0xff4d6d);
  if (s.job) {
    const c = CAREER_BY_ID[s.job.careerId];
    g.log(`${c.place} let you go.`, 'bad');
    s.job = null;
  }
  // juvenile hall keeps you in (reduced) high school; adults lose their enrollment
  if (s.education.current && !juvie) dropOut(g, 'Expelled while incarcerated');
  if (!['parents', 'homeless'].includes(s.housing) && !['house', 'farmhouse', 'ranch', 'mansion'].includes(s.housing)) {
    s.housing = g.parents.some((p) => p.rel > 30) ? 'parents' : 'homeless';
  }
  const p = g.partner;
  if (p && months > 24 && g.chance(0.5)) {
    p.role = 'ex';
    g.log(`${p.name} couldn't wait ${Math.round(months / 12)} years. They left you.`, 'bad');
  }
  g.achieve(juvie ? 'juvie' : 'jailbird');
  g.milestone(`Sentenced to ${fmtMonths(months)} for ${crime}${juvie ? ' (juvenile hall)' : ''}`);
}

export const fmtMonths = (m: number) => (m >= 12 ? `${(m / 12).toFixed(m % 12 ? 1 : 0)} years` : `${m} month${m === 1 ? '' : 's'}`);

export function release(g: Game, how = 'released') {
  const s = g.s;
  if (!s.crime.jail) return;
  s.crime.jail = null;
  s.location = 'home';
  g.stat('mood', 15);
  g.burst('sparkle');
  g.milestone(`Walked out of prison (${how})`);
}

export function jailMonth(g: Game) {
  const j = g.s.crime.jail;
  if (!j) return;
  j.monthsLeft--;
  if (g.s.crime.org) g.s.crime.org.respect += 1;
  if (j.monthsLeft <= 0) {
    g.queue('jail_release');
    return;
  }
  if (!j.paroleTried && j.total >= 6 && j.monthsLeft <= j.total / 2) {
    j.paroleTried = true;
    g.queue('parole_hearing');
  }
}

// ---------------------------------------------------------------- organizations
export function orgOf(g: Game): { def: OrgDef; rankTitle: string; rank: number } | null {
  const o = g.s.crime.org;
  if (!o) return null;
  const def = ORG_BY_ID[o.id];
  return { def, rank: o.rank, rankTitle: def.ranks[o.rank].title };
}

export function joinOrg(g: Game, id: string) {
  const def = ORG_BY_ID[id];
  g.s.crime.org = { id, rank: 0, respect: 0, joinedAge: g.age, idle: 0 };
  g.stat('street', 6);
  g.banner(`${def.icon} ${def.name}`, 0xff4d6d);
  g.milestone(`Joined the ${def.name}`);
  g.achieve(def.kind === 'mafia' ? 'family' : 'gang');
  for (let i = 0; i < 2; i++) g.addPerson('crew', { rel: 45, tags: [id], met: def.name });
}

export function leaveOrg(g: Game, how: string) {
  const o = g.s.crime.org;
  if (!o) return;
  const def = ORG_BY_ID[o.id];
  g.s.crime.formerOrgs.push(o.id);
  g.s.crime.org = null;
  for (const p of g.s.people) if (p.role === 'crew' && p.tags.includes(def.id)) p.role = 'rival';
  g.milestone(`Left the ${def.name} (${how})`);
}

export function orgRankUp(g: Game) {
  const o = g.s.crime.org;
  if (!o) return;
  const def = ORG_BY_ID[o.id];
  if (o.rank >= def.ranks.length - 1) return;
  o.rank++;
  g.stat('street', 5);
  g.banner(`${def.icon} ${def.ranks[o.rank].title}`, 0xff4d6d);
  g.burst('confetti');
  g.milestone(`Rose to ${def.ranks[o.rank].title} of the ${def.name}`);
  if (o.rank === def.ranks.length - 1) g.achieve(def.kind === 'mafia' ? 'don' : 'kingpin');
}

export function orgMonth(g: Game) {
  const o = g.s.crime.org;
  if (!o) return;
  const def = ORG_BY_ID[o.id];
  const rank = def.ranks[o.rank];
  if (!g.jailed) {
    g.money(rank.pay);
    g.heat(0.6 + o.rank * 0.5);
    o.idle++;
    if (o.idle > 3) {
      o.respect = Math.max(0, o.respect - 6);
      if (o.idle === 4) g.log(`${def.icon} The ${def.name} wonder where you’ve been. Respect is slipping.`, 'crime');
    }
  }
  const next = def.ranks[o.rank + 1];
  if (next && o.respect >= next.respect && !g.queued('org_promo') && !g.queued('made_ceremony') && !g.queued('don_coup')) {
    if (def.kind === 'mafia' && o.rank === 0) g.queue('made_ceremony');
    else if (o.rank === def.ranks.length - 2) g.queue('don_coup');
    else g.queue('org_promo');
  }
}

export const describeBribe = (sev: number) => fmt(400 * sev * sev);
