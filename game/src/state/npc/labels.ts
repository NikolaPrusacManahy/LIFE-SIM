import type { Game } from '../Game';
import type { Person, Role, SideLabel } from '../types';

// Update 0.4 — friendship track, romance track, stacking side labels.

export type FriendTier = 'stranger' | 'acquaintance' | 'friend' | 'close' | 'best';
export const TIER_LABEL: Record<FriendTier, string> = { stranger: 'Stranger', acquaintance: 'Acquaintance', friend: 'Friend', close: 'Close friend', best: 'Best friend' };

export const ROMANCE_ROLES: Role[] = ['crush', 'talking', 'dating', 'partner', 'engaged', 'spouse'];
export const FAMILY_ROLES: Role[] = ['mother', 'father', 'sibling', 'child'];

export function friendTier(p: Person): FriendTier {
  if (p.rel < 10) return 'stranger';
  if (p.rel < 35 || !p.hasNumber) return 'acquaintance';
  if (p.rel < 65 || p.trust < 50) return 'friend';
  if (p.rel < 85 || p.trust < 75 || !p.tags.includes('bestie')) return 'close';
  return 'best';
}

export const SIDE_LABEL: Record<SideLabel, string> = {
  rival: 'Rival', enemy: 'Enemy', mentor: 'Mentor', classmate: 'Classmate', coworker: 'Coworker', roommate: 'Roommate', neighbour: 'Neighbour',
  teacher: 'Teacher', professor: 'Professor', situationship: 'Situationship', fwb: 'Friends with benefits', sugar: 'Sugar arrangement', sugarbaby: 'Sugar arrangement',
  affair: 'Affair', ons: 'One-night stand',
};

const ROLE_NAME: Partial<Record<Role, string>> = {
  mother: 'Mom', father: 'Dad', sibling: 'Sibling', child: 'Child', crush: 'Crush', talking: 'Talking', dating: 'Dating', partner: 'Partner',
  engaged: 'Engaged', spouse: 'Spouse', ex: 'Ex', teacher: 'Teacher', professor: 'Professor', mentor: 'Mentor', fling: 'Fling', crew: 'Crew', rival: 'Rival', coworker: 'Coworker',
};

/** Primary label for chips: family/romance role, else the friendship tier. */
export function primaryLabel(p: Person): string {
  if (p.role === 'teacher') return p.subject ? `${p.subject} teacher` : 'Teacher';
  if (p.role === 'professor') return p.subject ? `Professor · ${p.subject}` : 'Professor';
  if (ROLE_NAME[p.role] && p.role !== 'coworker' && p.role !== 'rival') return ROLE_NAME[p.role]!;
  return TIER_LABEL[friendTier(p)];
}

export function allLabels(p: Person): string[] {
  const out = [primaryLabel(p)];
  for (const l of p.labels) if (SIDE_LABEL[l] && !out.includes(SIDE_LABEL[l])) out.push(SIDE_LABEL[l]);
  return out;
}

export function addLabel(p: Person, l: SideLabel) {
  if (!p.labels.includes(l)) p.labels.push(l);
}
export function dropLabel(p: Person, l: SideLabel) {
  p.labels = p.labels.filter((x) => x !== l);
}

/** Keep roles/labels in sync with the numbers. */
export function relabel(g: Game, p: Person) {
  if (!p.alive) return;
  if (p.role === 'acquaintance' && p.rel >= 35 && p.hasNumber) {
    p.role = 'friend';
    g.log(`🤝 You and ${p.name} are friends now.`, 'love', p.id);
  } else if (p.role === 'friend' && p.rel < 22) {
    p.role = 'acquaintance';
  }
  if (p.rivalry >= 80) addLabel(p, 'enemy');
  else if (p.rivalry >= 50) addLabel(p, 'rival');
  else if (p.rivalry < 35) {
    dropLabel(p, 'rival');
    dropLabel(p, 'enemy');
  }
  if ((p.role === 'teacher' || p.role === 'professor' || p.labels.includes('coworker')) && p.respect >= 70) addLabel(p, 'mentor');
}

/** Contacts grouping for the People screen. */
export function contactGroup(p: Person): string {
  if (!p.alive || p.status === 'dead') return 'In memory';
  if (FAMILY_ROLES.includes(p.role)) return 'Family';
  if (['spouse', 'engaged', 'partner', 'dating'].includes(p.role)) return 'Partner';
  if (['crush', 'talking', 'fling'].includes(p.role) || p.labels.some((l) => ['fwb', 'situationship', 'sugar', 'sugarbaby', 'affair', 'ons'].includes(l))) return 'Romance';
  if (p.role === 'ex') return 'Exes';
  if (p.labels.includes('rival') || p.labels.includes('enemy') || p.role === 'rival') return 'Rivals';
  if (p.role === 'teacher' || p.role === 'professor' || p.labels.includes('classmate')) return 'School';
  if (p.role === 'coworker' || p.role === 'mentor' || p.labels.includes('coworker')) return 'Work';
  if (p.role === 'friend' || p.role === 'crew') return 'Friends';
  return 'Other';
}

export const GROUP_ORDER = ['Partner', 'Family', 'Friends', 'Romance', 'School', 'Work', 'Exes', 'Rivals', 'Other', 'In memory'];
