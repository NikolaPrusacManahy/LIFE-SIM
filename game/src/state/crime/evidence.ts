import type { Game } from '../Game';
import type { CrimeScene, EvidenceTag } from './types';
import { itemCount } from '../inventory/items';
import { openCase } from './investigation';

// Update 0.5 — the cover-up puzzle. Abstract verbs only; the player sees clues, not answers.

export const TAG_LABEL: Record<EvidenceTag, string> = {
  body: 'Body', weapon: 'Weapon', trace: 'Trace', witness: 'Witness', camera: 'Camera', digital: 'Digital', money: 'Money trail',
  purchase: 'Purchase record', tox: 'Toxicology', vehicle: 'Vehicle', motive: 'Motive', alibi: 'No alibi', staged: 'Staged scene', suspicious: 'Suspicious behaviour',
};

/** What the player sees for each hidden tag. */
export const CLUES: Record<EvidenceTag, string[]> = {
  body: ['Someone will notice they’re gone.', 'You can’t just leave things like this.'],
  weapon: ['You’re still holding it.', 'It has your prints all over it.'],
  trace: ['You were here for a long time.', 'You touched a lot of things.'],
  witness: ['A neighbour’s light came on.', 'A dog started barking down the street.'],
  camera: ['There’s a doorbell camera across the street.', 'The store has a camera over the door.'],
  digital: ['You texted them an hour ago.', 'Your phone was on the whole time.'],
  money: ['The cash came from somewhere traceable.', 'Your bank will show the withdrawal.'],
  purchase: ['You bought it with your card.', 'The shop keeps receipts.'],
  tox: ['A lab test would find it.'],
  vehicle: ['Your car was parked right outside.', 'Someone might remember the plates.'],
  motive: ['Everyone knows you two were fighting.', 'People will ask who gains from this.'],
  alibi: ['Nobody knows where you were tonight.'],
  staged: ['Something about the scene looks… arranged.'],
  suspicious: ['You’re acting differently. People notice.'],
};

export interface CoverAction {
  id: string;
  label: string;
  icon: string;
  resolves: EvidenceTag[];
  /** base success */
  odds: (g: Game) => number;
  cost?: number;
  energy: number;
  /** too much of this looks suspicious */
  loud?: boolean;
  req?: (g: Game) => string | null;
  risk: string;
}

export const COVER_ACTIONS: CoverAction[] = [
  { id: 'dispose', label: 'Dispose of the weapon', icon: '🗑️', resolves: ['weapon'], odds: (g) => 0.6 + g.s.stats.smarts / 400, energy: 8, risk: 'May be found later' },
  { id: 'clean', label: 'Clean the scene', icon: '🧽', resolves: ['trace'], odds: (g) => 0.5 + g.s.stats.smarts / 300 + (itemCount(g, 'gloves') ? 0.15 : 0), energy: 14, risk: 'Incomplete clean' },
  { id: 'hide', label: 'Move them somewhere hidden', icon: '🌲', resolves: ['body'], odds: (g) => 0.45 + g.s.stats.fitness / 300, energy: 20, loud: true, risk: 'Discovered years later' },
  { id: 'stage', label: 'Stage it as an accident', icon: '🎭', resolves: ['body', 'motive'], odds: (g) => 0.3 + g.s.stats.smarts / 200, energy: 14, risk: 'A detective notices' },
  { id: 'burn', label: 'Burn the evidence', icon: '🔥', resolves: ['trace', 'weapon'], odds: () => 0.65, energy: 10, loud: true, risk: 'Fire draws attention' },
  { id: 'alibi', label: 'Ask a friend to cover for you', icon: '🤝', resolves: ['alibi'], odds: (g) => 0.4 + Math.max(0, ...g.peopleBy('friend', 'partner', 'spouse').map((p) => p.trust)) / 150, energy: 4, req: (g) => (g.peopleBy('friend', 'partner', 'spouse').length ? null : 'Nobody to ask'), risk: 'They may crack' },
  { id: 'phone', label: 'Wipe and ditch the phone', icon: '📵', resolves: ['digital'], odds: () => 0.7, energy: 4, risk: 'Cloud backup' },
  { id: 'witness', label: 'Lean on the witness', icon: '🤫', resolves: ['witness'], odds: (g) => 0.35 + g.s.stats.street / 200, energy: 10, risk: 'They go to police' },
  { id: 'fixer', label: 'Pay a fixer', icon: '🕴️', resolves: ['trace', 'camera', 'vehicle', 'money'], odds: () => 0.8, cost: 15000, energy: 2, req: (g) => (g.s.stats.street >= 40 ? null : 'Needs Street 40'), risk: 'The fixer owns you' },
  { id: 'camera', label: 'Get the footage erased', icon: '📼', resolves: ['camera'], odds: (g) => 0.35 + g.s.stats.smarts / 250, energy: 12, risk: 'A copy exists' },
  { id: 'car', label: 'Ditch the car', icon: '🚗', resolves: ['vehicle'], odds: () => 0.6, energy: 10, loud: true, risk: 'Insurance questions' },
  { id: 'launder', label: 'Move the money around', icon: '💱', resolves: ['money', 'purchase'], odds: (g) => 0.4 + g.s.stats.smarts / 250, energy: 6, risk: 'Paper trail remains' },
  { id: 'frame', label: 'Point suspicion elsewhere', icon: '🎯', resolves: ['motive'], odds: (g) => 0.35 + g.s.stats.charm / 300, energy: 8, risk: 'Suspicion doubles if it fails' },
  { id: 'natural', label: 'Make it look natural', icon: '🍂', resolves: ['staged', 'tox'], odds: (g) => 0.3 + g.s.stats.smarts / 250, energy: 10, risk: 'Autopsies are thorough' },
  { id: 'normal', label: 'Do nothing. Act normal.', icon: '😐', resolves: ['alibi', 'suspicious'], odds: (g) => 0.3 + g.s.stats.charm / 250, energy: 0, risk: 'Charm check in questioning' },
];
export const COVER_BY_ID: Record<string, CoverAction> = Object.fromEntries(COVER_ACTIONS.map((a) => [a.id, a]));

/** Every tag a crime can create must have at least one action that resolves it (tested). */
export const coverableTags = new Set(COVER_ACTIONS.flatMap((a) => a.resolves));

export function sceneClues(scene: CrimeScene): { tag: EvidenceTag; text: string }[] {
  // deterministic per scene: the same clue text every render
  return [...scene.tags, ...scene.added].map((tag, i) => {
    const pool = CLUES[tag];
    return { tag, text: pool[(scene.caseId.charCodeAt(0) + i) % pool.length] };
  });
}

/** Spend one action. Returns a short outcome line. */
export function coverUp(g: Game, actionId: string): string {
  const scene = g.s.underworld.scene;
  const a = COVER_BY_ID[actionId];
  if (!scene || !a || scene.actionsLeft <= 0 || scene.used.includes(actionId)) return '';
  const lock = a.req?.(g);
  if (lock) return lock;
  scene.used.push(actionId);
  scene.actionsLeft--;
  if (a.cost) g.money(-a.cost);
  if (a.energy) g.stat('energy', -a.energy);
  const loudCount = scene.used.filter((id) => COVER_BY_ID[id]?.loud).length;
  if (a.loud && loudCount >= 2 && !scene.added.includes('suspicious')) scene.added.push('suspicious');
  if (a.id === 'fixer') g.s.underworld.leverage['__fixer'] = ['owns you'];
  if (Math.random() < a.odds(g)) {
    for (const t of a.resolves) if (!scene.resolved.includes(t)) scene.resolved.push(t);
    return `${a.label}: done.`;
  }
  if (a.id === 'frame' && !scene.added.includes('motive')) scene.added.push('motive');
  if (a.id === 'witness' && !scene.added.includes('witness')) scene.added.push('witness');
  return `${a.label}: it didn’t go cleanly.`;
}

/** Close the scene: whatever wasn't covered becomes evidence in a new case. */
export function finishScene(g: Game): string {
  const scene = g.s.underworld.scene;
  if (!scene) return '';
  g.s.underworld.scene = null;
  const c = openCase(g, scene.crimeId, scene, scene.victimId);
  const left = c.open.length;
  return left === 0 ? 'You covered everything. Probably.' : `You did what you could. ${left} thing${left > 1 ? 's' : ''} left behind.`;
}
