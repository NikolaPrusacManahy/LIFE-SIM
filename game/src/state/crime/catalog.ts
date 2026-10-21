import type { CrimeTier, EvidenceTag } from './types';

// Update 0.5 — crime catalog. Odds, heat, evidence and sentences are game numbers; text stays abstract.

export interface CrimeDef {
  id: string;
  name: string;
  icon: string;
  tier: CrimeTier;
  /** needs Dark Crime on */
  dark: boolean;
  /** targets a known person */
  person: boolean;
  stat: 'fitness' | 'smarts' | 'charm' | 'street';
  diff: number;
  heat: number;
  karma: number;
  /** evidence tags this crime can leave (some are rolled) */
  tags: EvidenceTag[];
  /** chance a witness exists */
  witness: number;
  sentence: [number, number];
  reward: [number, number];
  /** items any one of which is needed */
  needs?: string[];
  guilt: number;
  /** severity for the justice system (1–5) */
  sev: number;
  line: string;
}

export const CRIMES: CrimeDef[] = [
  // ---- petty (18+)
  { id: 'pickpocket', name: 'Pickpocket', icon: '👛', tier: 'petty', dark: false, person: false, stat: 'street', diff: 40, heat: 4, karma: -3, tags: ['witness', 'camera'], witness: 0.25, sentence: [0, 2], reward: [40, 220], guilt: 0, sev: 1, line: 'A wallet changed hands. Nobody noticed. Probably.' },
  { id: 'scam', name: 'Run a Scam', icon: '🎲', tier: 'petty', dark: false, person: false, stat: 'charm', diff: 45, heat: 5, karma: -4, tags: ['digital', 'witness'], witness: 0.2, sentence: [0, 4], reward: [100, 700], guilt: 1, sev: 1, line: 'They believed every word.' },
  { id: 'fakegoods', name: 'Sell Fake Goods', icon: '👜', tier: 'petty', dark: false, person: false, stat: 'charm', diff: 35, heat: 4, karma: -2, tags: ['money', 'witness'], witness: 0.2, sentence: [0, 3], reward: [80, 400], guilt: 0, sev: 1, line: 'The “designer” bags sold out.' },
  // ---- property
  { id: 'burglary', name: 'Burglary', icon: '🏚️', tier: 'property', dark: false, person: false, stat: 'street', diff: 55, heat: 12, karma: -8, tags: ['trace', 'witness', 'camera'], witness: 0.3, sentence: [12, 48], reward: [800, 6000], needs: ['lockpick', 'crowbar'], guilt: 3, sev: 3, line: 'In and out. The house never woke up.' },
  { id: 'cartheft', name: 'Steal a Car', icon: '🚘', tier: 'property', dark: false, person: false, stat: 'street', diff: 55, heat: 12, karma: -6, tags: ['vehicle', 'camera', 'trace'], witness: 0.3, sentence: [12, 36], reward: [1500, 7000], guilt: 2, sev: 3, line: 'The engine turned over. You were gone.' },
  { id: 'fraud', name: 'Fraud Scheme', icon: '🧾', tier: 'property', dark: false, person: false, stat: 'smarts', diff: 60, heat: 10, karma: -6, tags: ['digital', 'money'], witness: 0.05, sentence: [12, 60], reward: [3000, 20000], guilt: 2, sev: 3, line: 'The numbers moved where you wanted them.' },
  { id: 'arson', name: 'Arson', icon: '🔥', tier: 'property', dark: true, person: false, stat: 'smarts', diff: 55, heat: 18, karma: -15, tags: ['trace', 'witness', 'purchase', 'motive'], witness: 0.25, sentence: [24, 60], reward: [0, 0], guilt: 6, sev: 3, line: 'By morning, it was ashes.' },
  // ---- organised
  { id: 'smuggle', name: 'Smuggling Run', icon: '⚓', tier: 'organised', dark: true, person: false, stat: 'street', diff: 60, heat: 15, karma: -8, tags: ['vehicle', 'money', 'witness'], witness: 0.2, sentence: [60, 180], reward: [5000, 25000], guilt: 2, sev: 4, line: 'The container cleared the docks.' },
  { id: 'racket', name: 'Protection Racket', icon: '🛡️', tier: 'organised', dark: true, person: false, stat: 'street', diff: 55, heat: 14, karma: -10, tags: ['witness', 'money', 'motive'], witness: 0.4, sentence: [60, 160], reward: [2000, 9000], guilt: 3, sev: 4, line: 'The shop owners paid. They didn’t look you in the eye.' },
  // ---- violent (on people you know)
  { id: 'assault', name: 'Assault', icon: '🥊', tier: 'violent', dark: false, person: true, stat: 'fitness', diff: 45, heat: 15, karma: -10, tags: ['witness', 'trace', 'motive'], witness: 0.4, sentence: [6, 36], reward: [0, 0], guilt: 6, sev: 2, line: 'It was over in seconds. They won’t forget it.' },
  { id: 'robbery', name: 'Armed Robbery', icon: '💰', tier: 'violent', dark: true, person: true, stat: 'street', diff: 55, heat: 25, karma: -15, tags: ['weapon', 'witness', 'camera', 'motive'], witness: 0.45, sentence: [60, 180], reward: [500, 5000], needs: ['knife', 'combat_knife', 'pistol'], guilt: 10, sev: 4, line: 'They handed it all over. Their hands were shaking. So were yours.' },
  { id: 'kidnap', name: 'Kidnapping', icon: '🪢', tier: 'violent', dark: true, person: true, stat: 'fitness', diff: 60, heat: 35, karma: -25, tags: ['witness', 'trace', 'vehicle', 'digital', 'motive'], witness: 0.35, sentence: [96, 300], reward: [0, 0], needs: ['restraints', 'sedative'], guilt: 20, sev: 5, line: 'It happened fast. Now someone is missing, and you know where they are.' },
  // ---- capital
  { id: 'murder_weapon', name: 'Confrontation', icon: '🗡️', tier: 'capital', dark: true, person: true, stat: 'fitness', diff: 55, heat: 45, karma: -40, tags: ['body', 'weapon', 'trace', 'witness', 'motive'], witness: 0.35, sentence: [300, 600], reward: [0, 0], needs: ['knife', 'combat_knife', 'crowbar'], guilt: 40, sev: 5, line: 'It’s over. Your hands won’t stop shaking.' },
  { id: 'murder_gun', name: 'Gun', icon: '🔫', tier: 'capital', dark: true, person: true, stat: 'street', diff: 50, heat: 55, karma: -40, tags: ['body', 'weapon', 'witness', 'motive', 'purchase'], witness: 0.5, sentence: [300, 600], reward: [0, 0], needs: ['pistol'], guilt: 40, sev: 5, line: 'One sound, then silence.' },
  { id: 'murder_poison', name: 'Poison', icon: '🧪', tier: 'capital', dark: true, person: true, stat: 'smarts', diff: 55, heat: 35, karma: -40, tags: ['body', 'tox', 'purchase', 'motive'], witness: 0.1, sentence: [300, 600], reward: [0, 0], needs: ['poison'], guilt: 40, sev: 5, line: 'They got sick a week later. Nobody suspected a thing. Yet.' },
  { id: 'murder_sedative', name: 'Sedative “Accident”', icon: '💉', tier: 'capital', dark: true, person: true, stat: 'smarts', diff: 60, heat: 35, karma: -40, tags: ['body', 'tox', 'staged'], witness: 0.1, sentence: [300, 600], reward: [0, 0], needs: ['sedative'], guilt: 40, sev: 5, line: 'They never woke up.' },
  { id: 'murder_staged', name: 'Staged Accident', icon: '🎭', tier: 'capital', dark: true, person: true, stat: 'smarts', diff: 65, heat: 30, karma: -40, tags: ['body', 'staged', 'motive'], witness: 0.15, sentence: [300, 600], reward: [0, 0], guilt: 40, sev: 5, line: 'The report said accident. You know better.' },
  { id: 'murder_hire', name: 'Hire Someone', icon: '🕴️', tier: 'capital', dark: true, person: true, stat: 'street', diff: 50, heat: 25, karma: -40, tags: ['body', 'money', 'motive'], witness: 0.05, sentence: [300, 600], reward: [0, 0], guilt: 35, sev: 5, line: 'You made a call. A week later, it was done.' },
];
export const CRIME_BY_ID: Record<string, CrimeDef> = Object.fromEntries(CRIMES.map((c) => [c.id, c]));

export const MOTIVE_ROLES = ['spouse', 'partner', 'ex', 'engaged', 'dating', 'mother', 'father', 'sibling', 'rival', 'boss'];

export const fmtSentence = (m: [number, number]) => {
  const y = (n: number) => (n >= 12 ? `${Math.round(n / 12)} yrs` : `${n} mo`);
  return m[1] === 0 ? 'Fine' : m[1] >= 600 ? '25 yrs–life' : `${y(Math.max(1, m[0]))}–${y(m[1])}`;
};
