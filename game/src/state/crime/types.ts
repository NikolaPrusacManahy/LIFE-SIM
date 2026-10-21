// Update 0.5 — Underworld state types.

export type EvidenceTag =
  | 'body' | 'weapon' | 'trace' | 'witness' | 'camera' | 'digital' | 'money' | 'purchase'
  | 'tox' | 'vehicle' | 'motive' | 'alibi' | 'staged' | 'suspicious';

export type CrimeTier = 'juvenile' | 'petty' | 'property' | 'organised' | 'violent' | 'capital';

export interface CrimeScene {
  caseId: string;
  crimeId: string;
  victimId?: string;
  /** the hidden truth: what this scene needs covering */
  tags: EvidenceTag[];
  resolved: EvidenceTag[];
  /** extra tags created by overdoing the cover-up */
  added: EvidenceTag[];
  actionsLeft: number;
  used: string[];
}

export interface CrimeCase {
  id: string;
  crimeId: string;
  name: string;
  sev: number;
  victimId?: string;
  clock: number;
  /** tags still out there for police to find */
  open: EvidenceTag[];
  found: EvidenceTag[];
  progress: number;
  detectiveId?: string;
  wanted: number;
  status: 'open' | 'cold' | 'closed' | 'charged';
  board: boolean;
  podcast: number;
  /** player is a suspect (named) */
  suspect: boolean;
}

export type PropertyKind = 'garage' | 'basement' | 'warehouse' | 'storage' | 'cabin' | 'front' | 'boat';

export interface OwnedProperty {
  id: string;
  kind: PropertyKind;
  suspicion: number;
  upgrades: string[];
}

export type ProductId = 'green' | 'pills' | 'dust' | 'static';

export interface DrugOp {
  product: ProductId;
  stock: number;
  quality: number;
  territories: string[];
  lastProfit: number;
  months: number;
}

export interface Pursuit {
  since: number;
  /** police heat zones spreading, 0–100 */
  zone: number;
  disguise: number;
  settled: boolean;
}

export type CrewRole = 'chemist' | 'muscle' | 'driver' | 'accountant' | 'lookout' | 'lawyer';

export interface BlackmailDeal {
  pid: string;
  demand: string;
  monthly: number;
  since: number;
}

export interface HeistPlan {
  target: 'casino' | 'bank' | 'truck' | 'gallery';
  entry: string;
  escape: string;
  crew: string[];
}

export interface Underworld {
  wanted: number;
  cases: CrimeCase[];
  scene: CrimeScene | null;
  properties: OwnedProperty[];
  business: DrugOp | null;
  /** unlaundered cash */
  dirty: number;
  guilt: number;
  pursuit: Pursuit | null;
  /** met a black-market contact */
  contact: boolean;
  /** leverage you hold: pid → reasons */
  leverage: Record<string, string[]>;
  blackmail: BlackmailDeal[];
  heist: HeistPlan | null;
  news: { text: string; until: number } | null;
  /** lies told to people close to you */
  coverStory: number;
  fled: boolean;
  /** cases inherited by your heir */
  inheritedCases: number;
}

export const blankUnderworld = (): Underworld => ({
  wanted: 0, cases: [], scene: null, properties: [], business: null, dirty: 0, guilt: 0, pursuit: null, contact: false,
  leverage: {}, blackmail: [], heist: null, news: null, coverStory: 0, fled: false, inheritedCases: 0,
});

/** Update 0.5 — chat messages (real messenger). */
export interface ChatMsg {
  id: string;
  /** 'me', or the sender's person id (groups) */
  from: string;
  text: string;
  turn: number;
  photo?: string;
  reaction?: string;
  read: boolean;
  burner?: boolean;
  /** pending reply chips offered after this message */
  branch?: string[];
}

export interface GroupChat {
  id: string;
  name: string;
  icon: string;
  members: string[];
  kind: 'family' | 'friends' | 'class' | 'work' | 'crew';
}
