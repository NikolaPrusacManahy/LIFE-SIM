import type { Game } from '../Game';
import type { Person } from '../types';
import type { EvidenceTag } from './types';
import { CRIME_BY_ID, MOTIVE_ROLES, type CrimeDef } from './catalog';
import { auditTarget, darkCrimeOn, isValidCrimeTarget } from './consent';
import { openCase } from './investigation';
import { addGuilt } from './guilt';
import { itemCount, spendItem } from '../inventory/items';
import { newId } from '../Game';

// Update 0.5 — committing a crime: odds → outcome → crime scene (cover-up) or case.

export const VIOLENT_AUDIT: { playerAge: number }[] = [];

/** Update 0.5.1 — carrying every item a crime can use (e.g. restraints AND sedative for a kidnapping) guarantees it. */
export const fullyEquipped = (g: Game, c: CrimeDef) => c.id === 'kidnap' && !!c.needs?.every((i) => itemCount(g, i) > 0);

export function crimeOddsFor(g: Game, c: CrimeDef, target?: Person | null): number {
  if (fullyEquipped(g, c)) return 1;
  let diff = c.diff;
  if (g.phase === 'night') diff -= 6;
  if (itemCount(g, 'lockpick') && c.id === 'burglary') diff -= 10;
  if (target) diff += (g.ageOf(target) < 30 ? 5 : 0) + (target.archetype === 'jock' || target.archetype === 'athlete' ? 8 : 0);
  diff += g.s.heat / 12;
  return g.statOdds(c.stat, diff);
}

export function crimeLock(g: Game, c: CrimeDef): string | null {
  if (g.age < 18) return 'Must be 18';
  if (c.dark && !darkCrimeOn()) return 'Dark Crime is off';
  if (g.s.god) return null; // Update 0.6 — a god needs no gear
  if (c.needs && !c.needs.some((i) => itemCount(g, i) > 0)) return 'Missing gear (Back Room)';
  if (c.id === 'kidnap' && !g.s.underworld.properties.some((p) => ['basement', 'warehouse', 'cabin'].includes(p.kind))) return 'Nowhere to hold someone';
  if (c.id === 'murder_hire' && (g.s.money < 20000 || g.s.stats.street < 40)) return 'Needs $20,000 and Street 40';
  if (c.id === 'fraud' && !g.has('laptop')) return 'Needs a laptop';
  return null;
}

/** Chips for crime cards: ⚠ Heat · 👁 Witness · ⚖ sentence. */
export function crimeChips(c: CrimeDef): string[] {
  const y = (n: number) => (n >= 12 ? `${Math.round(n / 12)}y` : `${n}mo`);
  return [`Heat +${c.heat}`, `👁 ${Math.round(c.witness * 100)}%`, c.sentence[1] ? `⚖ ${c.sentence[1] >= 600 ? '25y–life' : `${y(Math.max(1, c.sentence[0]))}–${y(c.sentence[1])}`}` : '⚖ Fine'];
}

export interface CrimeOutcome {
  ok: boolean;
  text: string;
}

/** Run a crime. Person crimes take a target; all targets pass isValidCrimeTarget + audit. */
export function commit(g: Game, crimeId: string, target?: Person | null): CrimeOutcome {
  const c = CRIME_BY_ID[crimeId];
  if (!c) return { ok: false, text: '' };
  const lock = crimeLock(g, c);
  if (lock) return { ok: false, text: lock };
  if (c.person) {
    if (!target || !isValidCrimeTarget(g, target, c.dark)) return { ok: false, text: 'Not a valid target.' };
    auditTarget(g, target, crimeId);
  }
  if (c.tier === 'violent' || c.tier === 'capital') VIOLENT_AUDIT.push({ playerAge: g.age });
  const u = g.s.underworld;
  g.karma(c.karma);
  g.inc('crimes05');
  g.s.crime.crimes++;
  const sure = fullyEquipped(g, c);
  const ok = sure || g.s.god || Math.random() < crimeOddsFor(g, c, target);
  // consumables (a guaranteed job uses up the whole kit)
  if (sure) {
    for (const i of c.needs!) if (['sedative', 'poison', 'restraints'].includes(i)) spendItem(g, i);
  } else if (c.needs) {
    const used = c.needs.find((i) => itemCount(g, i) > 0);
    if (used && ['sedative', 'poison', 'restraints'].includes(used)) spendItem(g, used);
  }
  if (!ok) {
    g.heat(c.heat * 1.4);
    g.fx({ type: 'shake', power: 5 });
    if (c.person && target) {
      target.rivalry = Math.min(100, target.rivalry + 40);
      target.rel = Math.max(0, target.rel - 40);
      target.memory.unshift({ clock: g.s.clock, text: `You tried something terrible (${c.name.toLowerCase()})`, tone: 'bad' });
      if (g.chance(0.5)) g.queue('busted', { name: c.name, sev: c.sev, kind: 'other', by: 'police' }, true);
      return { ok: false, text: `It went wrong. ${target.name} got away — and saw your face.` };
    }
    if (g.chance(0.35 + c.sev * 0.08)) {
      g.queue('busted', { name: c.name, sev: Math.min(c.sev, 3), kind: 'theft', by: 'police' }, true);
      return { ok: false, text: 'It went wrong. Sirens.' };
    }
    return { ok: false, text: 'It went wrong, but you got away.' };
  }

  // success
  g.heat(c.heat);
  g.stat('street', 1 + c.sev);
  const reward = c.reward[1] ? g.rand(c.reward[0], c.reward[1]) : 0;
  if (reward) {
    if (c.tier === 'organised') u.dirty += reward;
    else g.money(reward);
    g.burst('coins');
  }
  if (c.guilt) addGuilt(g, c.guilt);
  if (!u.contact && c.tier !== 'petty' && g.chance(0.4)) {
    u.contact = true;
    g.log('🕶️ Someone slipped you a number: “If you ever need gear… the Back Room.”', 'crime');
  }

  // which evidence this one left behind
  const tags: EvidenceTag[] = c.tags.filter((t) => t !== 'witness' || g.chance(c.witness * (itemCount(g, 'mask') ? 0.5 : 1)));
  if (itemCount(g, 'gloves') && tags.includes('trace') && g.chance(0.6)) tags.splice(tags.indexOf('trace'), 1);
  if (target && (MOTIVE_ROLES.includes(target.role) || target.rivalry >= 40 || target.labels.includes('rival')) && !tags.includes('motive')) tags.push('motive');
  if (target && target.hasNumber && !tags.includes('digital') && g.chance(0.5)) tags.push('digital');
  if (c.needs?.includes('poison') && !tags.includes('purchase')) tags.push('purchase');
  if (g.phase === 'night' && !tags.includes('alibi') && c.sev >= 4) tags.push('alibi');

  applyVictim(g, c, target ?? null);
  if (g.s.god) return { ok: true, text: c.line }; // no scene, no case — nobody can touch you

  if (c.sev >= 3 && tags.length) {
    u.scene = { caseId: newId(), crimeId, victimId: target?.id, tags, resolved: [], added: [], actionsLeft: 2 + Math.floor(g.s.stats.smarts / 35) + (g.s.stats.energy > 50 ? 1 : 0), used: [] };
  } else if (tags.length) {
    openCase(g, crimeId, null, target?.id, tags.filter(() => g.chance(0.5)));
  }
  return { ok: true, text: c.line };
}

function applyVictim(g: Game, c: CrimeDef, t: Person | null) {
  if (!t) return;
  t.memory.unshift({ clock: g.s.clock, text: c.tier === 'capital' ? 'Last saw you' : `You hurt them (${c.name.toLowerCase()})`, tone: 'bad' });
  if (c.id === 'assault') {
    t.rel = Math.max(0, t.rel - 50);
    t.rivalry = Math.min(100, t.rivalry + 50);
    t.mood = 10;
  } else if (c.id === 'robbery') {
    t.rel = Math.max(0, t.rel - 60);
    t.rivalry = Math.min(100, t.rivalry + 40);
  } else if (c.id === 'kidnap') {
    t.status = 'captive';
    t.tags.push('captive');
    t.mood = 10;
    g.s.flags[`captiveSince:${t.id}`] = g.s.clock;
  } else if (c.tier === 'capital') {
    t.alive = false;
    t.status = 'dead';
    g.setFlag(`killed:${t.id}`);
    // slayer rule: you can't inherit from your victim
    if (['mother', 'father', 'spouse'].includes(t.role)) g.setFlag('slayer');
    // their people grieve — and start asking questions
    g.s.schedule.push({ at: g.s.clock + 1, id: 'victim_family', ctx: { pid: t.id } });
  }
}
