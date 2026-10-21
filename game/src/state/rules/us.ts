import type { Game } from '../Game';
import type { Region } from '../types';

// Update 0.3 — United States ruleset. Every legal age lives here; activity files never hardcode them.
// Update 0.5.1 — rules/eu.ts supplies the same shape; each life picks one (`s.rules`).
import { EU } from './eu';

export type GateKey =
  | 'partTimeJob' | 'job' | 'hazardousJob'
  | 'permit' | 'license' | 'rentCar'
  | 'lease' | 'creditCard' | 'vote'
  | 'tattoo' | 'tobacco' | 'alcohol' | 'cannabis' | 'casino' | 'lottery'
  | 'marriage' | 'military' | 'gunRifle' | 'gunHandgun'
  | 'intimacy' | 'dating' | 'travel' | 'rehab' | 'steroids' | 'fakeId' | 'compete';

export type RulesId = 'us' | 'eu';

export interface Ruleset {
  id: RulesId;
  name: string;
  ages: Record<GateKey, number>;
  /** younger age allowed with a parent's consent */
  withConsent: Partial<Record<GateKey, number>>;
  /** per-region law toggles */
  cannabisLegal: Record<Region, boolean>;
  abortionAccess: Record<Region, boolean>;
  /** credit cards need proof of income below this age */
  creditIncomeAge: number;
  /** share of the listed (US) tuition you actually pay */
  tuitionMult: number;
}

export const US: Ruleset = {
  id: 'us',
  name: 'United States',
  ages: {
    partTimeJob: 14, job: 16, hazardousJob: 18,
    permit: 15, license: 16, rentCar: 25,
    lease: 18, creditCard: 18, vote: 18,
    tattoo: 18, tobacco: 21, alcohol: 21, cannabis: 21, casino: 21, lottery: 18,
    marriage: 18, military: 18, gunRifle: 18, gunHandgun: 21,
    intimacy: 18, dating: 18, travel: 18, rehab: 18, steroids: 18, fakeId: 16, compete: 18,
  },
  withConsent: { tattoo: 16, military: 17, compete: 16 },
  cannabisLegal: { city: true, country: false },
  abortionAccess: { city: true, country: false },
  creditIncomeAge: 21,
  tuitionMult: 1,
};

export const RULESETS: Record<RulesId, Ruleset> = { us: US, eu: EU };
/** The ruleset this life plays under (older saves: US). */
export const rulesFor = (g: Game): Ruleset => RULESETS[g.s.rules] ?? US;
/** Legal age for an action under this life's rules. */
export const legalAge = (g: Game, key: GateKey) => rulesFor(g).ages[key];
/** Yearly tuition you actually pay (EU public universities cost a fraction). */
export const tuitionFor = (g: Game, listed: number) => Math.round(listed * rulesFor(g).tuitionMult);

export interface GateResult {
  allowed: boolean;
  reason?: string;
  /** allowed only because a parent signed off */
  consent?: boolean;
}

/** Single source of truth for legal ages. Locked cards show `reason` ("Must be 21"). */
export function ageGate(action: GateKey, g: Game, rules: Ruleset = rulesFor(g)): GateResult {
  const min = rules.ages[action];
  if (action === 'cannabis' && !rules.cannabisLegal[g.s.region]) return { allowed: false, reason: 'Not legal here' };
  if (g.age >= min) return { allowed: true };
  const consentAge = rules.withConsent[action];
  if (consentAge !== undefined && g.age >= consentAge) {
    const ok = g.parents.some((p) => p.rel >= 50);
    return ok ? { allowed: true, consent: true } : { allowed: false, reason: 'Needs parent consent' };
  }
  return { allowed: false, reason: `Must be ${min}` };
}
