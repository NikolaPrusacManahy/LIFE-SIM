// Update 0.11 — START-UP: your company (saved).

export type IdeaId = 'game' | 'llm' | 'factory' | 'watch' | 'phone' | 'social' | 'ev' | 'biotech' | 'fashion' | 'delivery' | 'rockets';
/** How easily it appeals to investors: easy = quick yeses, low ceiling; moonshot = hard sell, huge ceiling. */
export type Appeal = 'easy' | 'normal' | 'moonshot';
export type Building = 'room' | 'office' | 'facility' | 'hq' | 'skyscraper';
export type Status = 'founder' | 'ceo' | 'tycoon' | 'magnate' | 'diplomatic';
export type SkillBranch = 'profit' | 'speed' | 'payroll' | 'pitch';

export interface Investor {
  name: string;
  amount: number;
  /** share of the company they got */
  stake: number;
}

export interface Startup {
  name: string;
  idea: IdeaId;
  appeal: Appeal;
  founded: number;
  building: Building;
  /** company money (not yours) */
  cash: number;
  /** public + investor appeal, 0–100 */
  hype: number;
  /** product development toward the next launch, 0–100 */
  progress: number;
  /** product quality, 0–100 (better teams, later versions) */
  quality: number;
  /** launched product versions (0 = nothing on sale yet) */
  version: number;
  /** monthly revenue right now */
  revenue: number;
  /** last month's profit (revenue − costs) */
  profit: number;
  staff: { employees: number; supervisors: number; manager: boolean; hr: boolean };
  investors: Investor[];
  /** your share of the company (0–1) */
  stake: number;
  skills: Record<SkillBranch, number>;
  points: number;
  status: Status;
  /** months in the red (3 = it folds) */
  redMonths: number;
  /** profitable months in a row (every 6 → a skill point) */
  greenMonths: number;
  /** total dividends paid into your own bank account (after tax) */
  paid: number;
  closed: boolean;
}
