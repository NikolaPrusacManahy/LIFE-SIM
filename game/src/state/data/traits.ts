import type { StatKey } from '../types';

export interface TraitDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  mult?: Partial<Record<StatKey, number>>;
  start?: Partial<Record<StatKey, number>>;
}

export const TRAITS: TraitDef[] = [
  { id: 'genius', name: 'Genius', icon: '🧠', desc: 'Learns 60% faster. Starts sharper.', mult: { smarts: 1.6 }, start: { smarts: 18 } },
  { id: 'athletic', name: 'Athletic', icon: '💪', desc: 'Fitness gains +50%. Natural athlete.', mult: { fitness: 1.5 }, start: { fitness: 15 } },
  { id: 'charming', name: 'Silver Tongue', icon: '😏', desc: 'Charm gains +50%. People just like you.', mult: { charm: 1.5 }, start: { charm: 14 } },
  { id: 'artistic', name: 'Artistic Soul', icon: '🎨', desc: 'Creativity gains +60%.', mult: { creativity: 1.6 }, start: { creativity: 16 } },
  { id: 'streetwise', name: 'Streetwise', icon: '🗡️', desc: 'Street gains +50%. Grew up fast.', mult: { street: 1.5 }, start: { street: 14 } },
  { id: 'gorgeous', name: 'Gorgeous', icon: '✨', desc: 'Starts with stunning looks.', mult: { looks: 1.3 }, start: { looks: 25 } },
  { id: 'lucky', name: 'Lucky', icon: '🍀', desc: 'Every risky roll tilts a little your way.' },
  { id: 'nightowl', name: 'Night Owl', icon: '🦉', desc: 'Evening & night activities cost 35% less energy.' },
  { id: 'ambitious', name: 'Ambitious', icon: '📈', desc: 'Work & school performance gains +40%.' },
  { id: 'empath', name: 'Empath', icon: '💞', desc: 'Relationships grow 50% faster.' },
  { id: 'hothead', name: 'Hothead', icon: '🔥', desc: 'Wins fights more often. Draws more heat.' },
  { id: 'iron', name: 'Iron Constitution', icon: '🛡️', desc: 'Tougher body, ages slower.', start: { health: 10 } },
  { id: 'rebel', name: 'Rebel', icon: '🤘', desc: 'Street +30%, mood boost from breaking rules. Teachers hate you.', mult: { street: 1.3 } },
];

export const TRAIT_BY_ID: Record<string, TraitDef> = Object.fromEntries(TRAITS.map((t) => [t.id, t]));
