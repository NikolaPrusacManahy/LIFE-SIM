// Update 0.12 — cooking on a pan: oil, add the food, mix or flip, season, and take it off at the right moment.
// The UI ticks the heat in real time; scoring is pure.

export type FoodId = 'eggs' | 'bacon' | 'steak' | 'fish' | 'chicken' | 'pancakes';
export type CookStep = 'oil' | 'mix' | 'flip' | 'season';

export interface FoodDef {
  name: string;
  icon: string;
  /** steps this dish needs */
  needs: CookStep[];
  /** doneness gained per second on the hot side (0–100) */
  speed: number;
  /** the perfect doneness window */
  target: [number, number];
  /** 2 sides (flip) or one (mix) */
  sides: 1 | 2;
}

export const FOODS: Record<FoodId, FoodDef> = {
  eggs: { name: 'Scrambled eggs', icon: '🍳', needs: ['oil', 'mix', 'season'], speed: 14, target: [55, 80], sides: 1 },
  bacon: { name: 'Crispy bacon', icon: '🥓', needs: ['flip'], speed: 16, target: [65, 90], sides: 2 },
  steak: { name: 'Steak', icon: '🥩', needs: ['oil', 'flip', 'season'], speed: 12, target: [55, 78], sides: 2 },
  fish: { name: 'Pan-fried fish', icon: '🐟', needs: ['oil', 'flip', 'season'], speed: 13, target: [60, 82], sides: 2 },
  chicken: { name: 'Chicken legs', icon: '🍗', needs: ['oil', 'flip', 'season'], speed: 8, target: [72, 92], sides: 2 },
  pancakes: { name: 'Pancakes', icon: '🥞', needs: ['oil', 'flip'], speed: 15, target: [55, 80], sides: 2 },
};
export const FOOD_ORDER = Object.keys(FOODS) as FoodId[];

export interface PanState {
  /** doneness of each side (one-sided dishes use [0]) */
  sides: [number, number];
  /** which side is on the heat */
  down: 0 | 1;
  oiled: boolean;
  mixed: number;
  seasoned: number;
  flips: number;
  /** added the food to a cold, dry pan */
  dry: boolean;
}

export const freshPan = (): PanState => ({ sides: [0, 0], down: 0, oiled: false, mixed: 0, seasoned: 0, flips: 0, dry: false });

/** One heat tick of `sec` seconds. Mixing spreads the heat evenly. */
export function heat(f: FoodDef, s: PanState, sec: number): PanState {
  const n: PanState = { ...s, sides: [...s.sides] as [number, number] };
  const gain = f.speed * sec * (s.oiled || !f.needs.includes('oil') ? 1 : 1.35);
  n.sides[f.sides === 1 ? 0 : s.down] = Math.min(120, n.sides[f.sides === 1 ? 0 : s.down] + gain);
  return n;
}

export function act(f: FoodDef, s: PanState, step: CookStep): PanState {
  const n: PanState = { ...s, sides: [...s.sides] as [number, number] };
  if (step === 'oil') n.oiled = true;
  if (step === 'mix') n.mixed++;
  if (step === 'season') n.seasoned++;
  if (step === 'flip' && f.sides === 2) {
    n.down = s.down === 0 ? 1 : 0;
    n.flips++;
  }
  return n;
}

export type Doneness = 'raw' | 'undercooked' | 'perfect' | 'overcooked' | 'burnt';
export function donenessOf(f: FoodDef, v: number): Doneness {
  if (v < f.target[0] * 0.5) return 'raw';
  if (v < f.target[0]) return 'undercooked';
  if (v <= f.target[1]) return 'perfect';
  if (v <= f.target[1] + 15) return 'overcooked';
  return 'burnt';
}

/** 0–1: each side in the window, and each needed step done (seasoning once or twice, not five times). */
export function cookScore(f: FoodDef, s: PanState): { score: number; notes: string[] } {
  const notes: string[] = [];
  const sides = f.sides === 1 ? [s.sides[0]] : s.sides;
  let pts = 0;
  let max = 0;
  for (const v of sides) {
    max += 2;
    const d = donenessOf(f, v);
    pts += d === 'perfect' ? 2 : d === 'undercooked' || d === 'overcooked' ? 1 : 0;
    if (d !== 'perfect') notes.push(`${d}`);
  }
  for (const step of f.needs) {
    max += 1;
    const ok = step === 'oil' ? s.oiled : step === 'mix' ? s.mixed >= 2 : step === 'season' ? s.seasoned >= 1 && s.seasoned <= 2 : s.flips >= 1;
    if (ok) pts += 1;
    else notes.push(step === 'season' && s.seasoned > 2 ? 'too salty' : `forgot to ${step}`);
  }
  return { score: max ? pts / max : 0, notes };
}
