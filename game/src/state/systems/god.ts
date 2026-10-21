import type { Game } from '../Game';
import type { Person } from '../types';
import { auditTarget, cannotConsent, darkCrimeOn } from '../crime/consent';
import { isRomanceEligible } from '../npc/identity';
import { addGuilt } from '../crime/guilt';
import { GOD_WEALTH } from '../Game';

// Update 0.6 — God Mode ("Born a god" in the creator). Immortal, untouchable; the world still reacts.
// HARD RULES still apply: nobody under 18 is ever a target, smiting needs Dark Crime on,
// the harem is adults who say yes themselves (no power compels love), and destruction kills no one.

export const isGod = (g: Game) => !!g.s.god;

/** Every person a god power has struck (tests prove all are adults). */
export const GOD_TARGET_AUDIT: { npcAge: number; playerAge: number }[] = [];

const news = (g: Game, text: string, months = 2) => {
  g.s.underworld.news = { text, until: g.s.clock + months };
};
const followers = (g: Game, n: number) => g.inc('followers', n);

export interface GodPower {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** reason it can't be used right now */
  lock?: (g: Game) => string | null;
  cooldown?: number;
  run: (g: Game) => string;
}

export const GOD_POWERS: GodPower[] = [
  {
    id: 'fly', name: 'Fly', icon: '🕊️', desc: 'Cross the land in minutes.',
    run: (g) => {
      g.s.region = g.s.region === 'city' ? 'country' : 'city';
      g.s.location = 'home';
      g.stat('mood', 10);
      g.burst('sparkle');
      followers(g, 5);
      if (g.chance(0.4)) news(g, 'Witnesses report a person flying over the highway');
      return g.s.region === 'city' ? 'You land on a rooftop above the city lights.' : 'You drift down into a quiet field at dusk.';
    },
  },
  {
    id: 'strength', name: 'Feat of Strength', icon: '💪', desc: 'Lift a bus. Stop a train.',
    run: (g) => {
      g.fx({ type: 'shake', power: 8 });
      g.fame(5);
      followers(g, 20);
      news(g, 'Viral video: stranger lifts a city bus with one hand');
      return g.pick(['You lifted a bus off a stuck car. The crowd went silent.', 'A runaway train stopped against your palm.', 'You tore a steel door open like paper.']);
    },
  },
  {
    id: 'fireball', name: 'Fireball', icon: '🔥', desc: 'Scorch an empty lot. Pure spectacle.',
    run: (g) => {
      g.fx({ type: 'flash', color: 0xff7a1a });
      g.fx({ type: 'shake', power: 10 });
      g.burst('smoke');
      g.karma(-3);
      followers(g, 15);
      news(g, 'Mysterious fireball lights up the night sky');
      return 'A ball of fire left your hand and turned an empty lot to glass.';
    },
  },
  {
    id: 'smite', name: 'Smite', icon: '⚡', desc: 'Strike down an adult. Needs Dark Crime.',
    lock: (g) => (g.age < 18 ? 'Must be 18' : !darkCrimeOn() ? 'Dark Crime is off' : smiteTargets(g).length ? null : 'No one to strike'),
    run: () => '', // targeted — see smite()
  },
  {
    id: 'level', name: 'Level the City', icon: '🌋', desc: 'Evacuated first. Nothing left standing.', cooldown: 24,
    lock: (g) => (g.age < 18 ? 'Must be 18' : g.flag('ruinsUntil') > g.s.clock ? 'Still in ruins' : null),
    run: (g) => {
      g.s.flags.ruinsUntil = g.s.clock + 24;
      g.fx({ type: 'flash', color: 0xff4d1a });
      g.fx({ type: 'shake', power: 16 });
      g.burst('smoke');
      g.banner('THE CITY FALLS', 0xff4d1a);
      g.karma(-40);
      g.fame(30);
      followers(g, 500);
      addGuilt(g, 10);
      news(g, 'City evacuated, then erased — no casualties reported', 6);
      for (const p of g.s.people) if (p.alive && p.status === 'alive') p.mood = Math.max(0, p.mood - 25);
      g.milestone('Levelled a city');
      return 'You gave them one hour to leave. Everyone made it out. Then the skyline came down.';
    },
  },
  {
    id: 'supernova', name: 'Supernova', icon: '🌟', desc: 'Turn night to day across the world.', cooldown: 12,
    run: (g) => {
      g.fx({ type: 'flash', color: 0xffffff });
      g.fx({ type: 'shake', power: 14 });
      g.burst('sparkle');
      g.banner('SUPERNOVA', 0xfff3b0);
      g.fame(20);
      followers(g, 1000);
      news(g, 'A second sun burned for an hour. Scientists have no explanation', 4);
      return 'You opened your hands and a star bloomed overhead. For an hour, there was no night.';
    },
  },
  {
    id: 'bless', name: 'Answer Prayers', icon: '🙏', desc: 'Heal the sick, feed the poor.',
    run: (g) => {
      g.karma(15);
      for (const p of g.s.people) if (p.alive && p.status === 'alive') p.mood = Math.min(100, p.mood + 10);
      followers(g, 200);
      news(g, 'Hospital reports dozens of “miracle” recoveries overnight');
      return 'A hospital ward emptied overnight. Nobody could explain it.';
    },
  },
  {
    id: 'worship', name: 'Gather Worshippers', icon: '🛐', desc: 'Grow your following.',
    run: (g) => {
      followers(g, 100 + Math.floor(g.s.fame * 5));
      return `A crowd knelt in the square. ${g.flag('followers').toLocaleString()} followers now.`;
    },
  },
];
export const GOD_POWER_BY_ID: Record<string, GodPower> = Object.fromEntries(GOD_POWERS.map((p) => [p.id, p]));

export function powerLock(g: Game, p: GodPower): string | null {
  if (!isGod(g)) return 'Not a god';
  if (p.cooldown && g.onCooldown(`god:${p.id}`)) return 'Recharging';
  return p.lock?.(g) ?? null;
}

export function castPower(g: Game, id: string): string {
  const p = GOD_POWER_BY_ID[id];
  if (!p || powerLock(g, p)) return '';
  if (p.cooldown) g.cooldown(`god:${p.id}`, p.cooldown);
  return p.run(g);
}

/** Adults only, ever. */
export function smiteTargets(g: Game): Person[] {
  if (g.age < 18 || !darkCrimeOn()) return [];
  return g.s.people.filter((p) => p.alive && p.status === 'alive' && g.ageOf(p) >= 18);
}

export function smite(g: Game, pid: string): string {
  const p = g.personById(pid);
  if (!p || powerLock(g, GOD_POWER_BY_ID.smite) || !smiteTargets(g).includes(p)) return '';
  auditTarget(g, p, 'smite');
  GOD_TARGET_AUDIT.push({ npcAge: g.ageOf(p), playerAge: g.age });
  p.alive = false;
  p.status = 'dead';
  g.setFlag(`killed:${p.id}`);
  g.fx({ type: 'flash', color: 0xbfe3ff });
  g.fx({ type: 'shake', power: 9 });
  g.karma(-30);
  g.fame(5);
  addGuilt(g, 12);
  followers(g, 50);
  g.s.schedule.push({ at: g.s.clock + 1, id: 'victim_family', ctx: { pid: p.id } });
  news(g, 'Lightning from a clear sky: one dead, witnesses describe “a figure”');
  return `Lightning from a clear sky. ${p.name} was gone before the thunder.`;
}

// ---------------------------------------------------------------- harem (willing adults only)

export const haremMembers = (g: Game) => g.s.people.filter((p) => p.alive && p.tags.includes('harem'));

/** Can you invite this person into your circle? They still decide. */
export function haremLock(g: Game, p: Person): string | null {
  if (!isGod(g)) return 'Not a god';
  if (g.age < 18 || g.ageOf(p) < 18) return 'Adults only';
  if (cannotConsent(g, p)) return 'They can’t give a real answer';
  if (p.tags.includes('harem')) return 'Already with you';
  if (!isRomanceEligible(g, p)) return 'Not into you';
  if (!['dating', 'partner', 'engaged', 'spouse', 'crush', 'talking'].includes(p.role)) return 'Get closer first';
  return null;
}

export const haremOdds = (g: Game, p: Person) => Math.max(0.1, Math.min(0.9, 0.25 + p.romance / 200 + p.attraction / 250 + (g.s.stats.charm - 50) / 300));

export function inviteToHarem(g: Game, p: Person): string {
  if (haremLock(g, p)) return '';
  if (Math.random() < haremOdds(g, p)) {
    p.tags.push('harem', 'open');
    if (['crush', 'talking'].includes(p.role)) p.role = 'dating';
    p.romance = Math.min(100, p.romance + 10);
    g.burst('hearts');
    return `${p.name} thought about it for a long time — then said yes. No secrets between any of you.`;
  }
  p.rel = Math.max(0, p.rel - 8);
  return `${p.name} said no. They want it to be just the two of you, or nothing.`;
}

// ---------------------------------------------------------------- monthly

export function godMonth(g: Game) {
  if (!isGod(g)) return;
  g.s.money = GOD_WEALTH;
  g.s.debt = 0;
  g.s.stats.health = 100;
  if (g.flag('ruinsUntil') && g.flag('ruinsUntil') <= g.s.clock) {
    g.s.flags.ruinsUntil = 0;
    g.log('🏗️ The city has been rebuilt. They put up a statue. It isn’t of you.', 'milestone');
  }
}
