import type { Game } from '../Game';
import type { Person } from '../types';
import type { CrimeCase, CrimeScene, EvidenceTag } from './types';
import { CRIME_BY_ID } from './catalog';
import { newId } from '../Game';
import { untouchable } from '../systems/immunity';

// Update 0.5 — cases, the Detective, wanted stars, cold cases, the podcast.

const DETECTIVE_TRAITS = ['relentless', 'corrupt', 'rookie', 'burnedout', 'brilliant'];
export const DETECTIVE_LABEL: Record<string, string> = { relentless: 'Relentless', corrupt: 'Corrupt', rookie: 'Rookie', burnedout: 'Burned-out', brilliant: 'Brilliant' };

/** Strong tags weigh more toward an arrest. */
const WEIGHT: Record<EvidenceTag, number> = {
  body: 15, weapon: 25, trace: 20, witness: 25, camera: 25, digital: 20, money: 15, purchase: 20, tox: 15, vehicle: 15, motive: 15, alibi: 10, staged: 15, suspicious: 15,
};

export function detectiveOf(g: Game): Person | null {
  return g.s.people.find((p) => p.tags.includes('detective') && p.alive) ?? null;
}

/** The detective is a recurring nemesis: generated once, remembers you. */
export function ensureDetective(g: Game): Person {
  const d = detectiveOf(g);
  if (d) return d;
  const p = g.addPerson('acquaintance', { age: g.rand(30, 58), rel: 15, met: g.dateLabel, where: g.s.region === 'city' ? 'Metro PD' : 'County Sheriff', archetype: 'career' });
  p.tags.push('detective', `det:${g.pick(DETECTIVE_TRAITS)}`);
  p.subject = 'Homicide & Major Crimes';
  return p;
}

export const detectiveTrait = (p: Person | null) => (p?.tags.find((t) => t.startsWith('det:')) ?? 'det:rookie').slice(4);

/** Open a case from a finished cover-up scene (or a crime with no scene). */
export function openCase(g: Game, crimeId: string, scene: CrimeScene | null, victimId?: string, extra: EvidenceTag[] = []): CrimeCase {
  const def = CRIME_BY_ID[crimeId];
  const tags = scene ? [...new Set([...scene.tags, ...scene.added])].filter((t) => !scene.resolved.includes(t)) : [...extra];
  if (g.flag('digitalTrail') && !tags.includes('digital')) tags.push('digital');
  const c: CrimeCase = {
    id: scene?.caseId ?? newId(), crimeId, name: def?.name ?? crimeId, sev: def?.sev ?? 2, victimId, clock: g.s.clock,
    open: tags, found: [], progress: 0, wanted: 0, status: 'open', board: false, podcast: 0, suspect: false,
  };
  if (c.sev >= 3) c.detectiveId = ensureDetective(g).id;
  g.s.underworld.cases.push(c);
  if (c.sev >= 4) g.s.underworld.news = { text: newsLine(g, c), until: g.s.clock + 2 };
  return c;
}

function newsLine(g: Game, c: CrimeCase) {
  const where = g.s.region === 'city' ? 'the city' : 'the county';
  if (c.crimeId.startsWith('murder')) return `BREAKING: Body found in ${where}; police seek witnesses`;
  if (c.crimeId === 'kidnap') return `MISSING: Search continues across ${where}`;
  return `Police investigating ${c.name.toLowerCase()} in ${where}`;
}

export const caseStrength = (c: CrimeCase) => c.found.reduce((a, t) => a + WEIGHT[t], 0);

/** Wanted stars come from the strongest active case. */
export function recomputeWanted(g: Game) {
  const u = g.s.underworld;
  let w = 0;
  for (const c of u.cases) {
    if (c.status !== 'open' || !c.suspect) continue;
    const s = caseStrength(c);
    c.wanted = Math.min(5, Math.ceil(s / 25) + (c.sev >= 5 ? 1 : 0));
    w = Math.max(w, c.wanted);
  }
  u.wanted = w;
}

/** Monthly: police work every open case. */
export function investigationMonth(g: Game) {
  const u = g.s.underworld;
  const det = detectiveOf(g);
  const skill = { relentless: 0.2, brilliant: 0.22, corrupt: 0.08, rookie: 0.1, burnedout: 0.08 }[detectiveTrait(det)] ?? 0.12;
  for (const c of u.cases) {
    if (c.status === 'cold') {
      // "New DNA technology…"
      if (g.chance(0.012)) {
        c.status = 'open';
        c.progress = 40;
        if (c.open.length) c.found.push(c.open.shift()!);
        g.queue('cold_case', { caseId: c.id });
      }
      if (c.sev >= 5 && c.podcast < 6 && g.chance(0.08)) {
        c.podcast++;
        g.queue('podcast_episode', { caseId: c.id, ep: c.podcast });
      }
      continue;
    }
    if (c.status !== 'open') continue;
    const before = c.found.length;
    for (const t of [...c.open]) {
      if (g.chance(skill + c.sev * 0.02 + g.s.heat / 600)) {
        c.open = c.open.filter((x) => x !== t);
        c.found.push(t);
      }
    }
    c.progress = Math.min(100, caseStrength(c));
    if (c.found.some((t) => ['motive', 'witness', 'digital', 'camera', 'trace', 'purchase'].includes(t))) c.suspect = true;
    if (c.found.length > before && c.suspect && g.chance(0.5)) g.queue(g.chance(0.5) ? 'police_interview' : 'evidence_found', { caseId: c.id });
    // nothing found for two years → cold
    if (!c.found.length && g.s.clock - c.clock > 24) c.status = 'cold';
    if (c.found.length && !c.open.length && c.progress < 60 && g.s.clock - c.clock > 36) c.status = 'cold';
  }
  recomputeWanted(g);
  if (untouchable(g)) return; // Update 0.6 / 0.11 — they investigate; nobody comes for a god or a diplomat
  const hot = u.cases.find((c) => c.status === 'open' && c.suspect && c.progress >= 60);
  if (hot && !u.pursuit && !g.jailed) {
    if (u.wanted >= 4) g.queue('manhunt', { caseId: hot.id });
    else if (!g.queued('arrest')) g.queue('arrest', { caseId: hot.id });
  }
}

export const activeCases = (g: Game) => g.s.underworld.cases.filter((c) => c.status === 'open');

/** Messages and other digital trails leave evidence on open cases (unless sent from a burner). */
export function addDigital(g: Game) {
  let hit = false;
  for (const c of activeCases(g)) {
    if (!c.open.includes('digital') && !c.found.includes('digital')) {
      c.open.push('digital');
      hit = true;
    }
  }
  if (!hit) g.setFlag('digitalTrail');
}
