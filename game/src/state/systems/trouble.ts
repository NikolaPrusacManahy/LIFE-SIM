import type { Game } from '../Game';
import { sendToJail } from './crime';
import { fmt } from './finance';
import { confiscatePhone } from './phone';
import { legalAge } from '../rules/us';

// Update 0.3 — getting caught. Minors go through the juvenile system (parents, grounding,
// community service, probation, juvenile hall); adults get fines, records and jail.

export type OffenseKind = 'alcohol' | 'tobacco' | 'theft' | 'vandal' | 'fight' | 'drugs' | 'id' | 'other';

export interface Offense {
  name: string;
  sev: number; // 1 petty .. 5 major
  kind: OffenseKind;
  /** who caught you — flavours the event text */
  by?: 'parents' | 'police' | 'school' | 'security';
}

export const grounded = (g: Game) => g.flag('groundedUntil') > g.s.clock;
export const onProbation = (g: Game) => g.flag('probationUntil') > g.s.clock;

/** Roll a catch chance; on a catch, queue the bust event. Returns true if caught. */
export function riskCatch(g: Game, chance: number, o: Offense): boolean {
  if (g.s.god || !g.chance(chance)) return false;
  g.fx({ type: 'police' });
  g.queue('busted', { ...o }, true);
  return true;
}

/** Underage use of an adult-only thing (drink, vape, fake ID…). */
export function underageCatch(g: Game, chance: number, o: Offense) {
  return g.age < legalAge(g, o.kind === 'tobacco' ? 'tobacco' : 'alcohol') ? riskCatch(g, chance, o) : false;
}

export function ground(g: Game, months: number) {
  g.setFlag('groundedUntil', Math.max(g.flag('groundedUntil'), g.s.clock + months));
}

/** Apply consequences. Returns a short outcome line. */
export function punish(g: Game, o: Offense): string {
  const sev = o.sev + (onProbation(g) ? 1 : 0);
  if (g.age < 18) return juvenile(g, o, sev);
  return adult(g, o, sev);
}

function juvenile(g: Game, o: Offense, sev: number): string {
  const strikes = g.inc('juvStrikes');
  g.s.crime.juvRecord.push({ name: o.name, sev });
  g.karma(-2);
  for (const p of g.parents) g.rel(p, -8);
  if (strikes >= 3 || sev >= 3) {
    const months = Math.min(6, Math.max(1, sev + strikes - 2));
    sendToJail(g, months * 2, o.name); // halved for juveniles inside sendToJail
    return `Juvenile court sent you to juvenile hall for ${months} month${months > 1 ? 's' : ''}.`;
  }
  if (o.kind === 'alcohol' || o.kind === 'tobacco' || o.kind === 'id' || sev <= 1) {
    const months = sev <= 1 ? 1 : 2;
    ground(g, months);
    const phone = confiscatePhone(g, months);
    return `Confiscated. Your parents were called. Grounded for ${months} month${months > 1 ? 's' : ''} — no evenings or nights out.${phone}`;
  }
  const e = g.s.education.current;
  if (e && e.program === 'hs') {
    e.warnings++;
    e.perf = Math.max(0, e.perf - 8);
  }
  g.inc('serviceLeft', 4);
  g.setFlag('probationUntil', g.s.clock + 6);
  ground(g, 1);
  return 'Suspended from school. Juvenile court: 4 sessions of community service and 6 months of probation.';
}

function adult(g: Game, o: Offense, sev: number): string {
  if (o.kind === 'alcohol' && g.age < legalAge(g, 'alcohol') && sev <= 1) {
    g.money(-250);
    return `Underage drinking citation: ${fmt(250)} fine.`;
  }
  if (sev <= 1) {
    const fine = g.rand(300, 600);
    g.money(-fine);
    return `You paid a ${fmt(fine)} fine.`;
  }
  if (sev === 2) {
    g.money(-1000);
    g.s.crime.record.push(o.name);
    g.inc('serviceLeft', 6);
    g.setFlag('probationUntil', g.s.clock + 12);
    return `Convicted: ${fmt(1000)} fine, a permanent record, 6 sessions of community service and a year of probation.`;
  }
  const months = sev === 3 ? g.rand(3, 12) : g.rand(18, 48);
  sendToJail(g, months, o.name);
  return `Sentenced to ${months} months in ${sev === 3 ? 'county jail' : 'state prison'}.`;
}

/** At 18 the juvenile record is sealed, unless an offence was serious. */
export function sealJuvenileRecord(g: Game) {
  const serious = g.s.crime.juvRecord.filter((r) => r.sev >= 3);
  const sealed = g.s.crime.juvRecord.length - serious.length;
  for (const r of serious) g.s.crime.record.push(`${r.name} (juvenile)`);
  g.s.crime.juvRecord = [];
  g.setFlag('juvStrikes', 0);
  if (sealed > 0) g.log(`🗂️ Your juvenile record was sealed — a fresh start.${serious.length ? ' (Serious offences stay on file.)' : ''}`, 'milestone');
}
