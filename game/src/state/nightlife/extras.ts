import type { Game } from '../Game';
import type { Zone } from './types';
import { endNight, night, tick } from './night';
import { bump } from '../npc/interactions';
import { say } from '../npc/identity';
import { riskCatch } from '../systems/trouble';

// Update 0.8 — everything else you can do on a night out, and things that just happen.
// The player can only ever stop a drink spiking — never do it.

export interface NightAction {
  id: string;
  label: string;
  icon: string;
  desc: string;
  zone?: Zone;
  lock?: (g: Game) => string | null;
  run: (g: Game) => string;
}

const crowdNear = (g: Game) => night(g).crowd.filter((c) => !c.done && c.zone === night(g).zone);

export function moveTo(g: Game, z: Zone): string {
  const n = night(g);
  if (z === 'vip' && !n.vip) return 'The bouncer shakes his head.';
  n.zone = z;
  return '';
}

export const VIP_FEE = 50;

export const NIGHT_ACTIONS: NightAction[] = [
  {
    id: 'vip', label: `Get into VIP ($${VIP_FEE})`, icon: '👑', desc: 'Fame 40 gets you in free', lock: (g) => (night(g).vip ? 'You’re in' : night(g).type === 'eighteen' ? 'No VIP tonight' : g.s.fame >= 40 || g.canAfford(VIP_FEE) ? null : `Need $${VIP_FEE}`),
    run: (g) => { const n = night(g); if (g.s.fame < 40) { g.money(-VIP_FEE); n.spent += VIP_FEE; } n.vip = true; n.zone = 'vip'; g.fame(0.5); return g.s.fame >= 40 ? 'The bouncer recognised you. Straight in.' : 'Velvet rope, unhooked.'; },
  },
  {
    id: 'round', label: 'Buy a round', icon: '🍻', desc: 'Fame + · everyone nearby likes you', zone: 'bar', lock: (g) => (g.canAfford(60) ? null : 'Need $60'),
    run: (g) => { const n = night(g); g.money(-60); n.spent += 60; g.fame(0.6); for (const c of crowdNear(g)) c.conn = Math.min(100, c.conn + 10); return 'You bought the bar a round. You are everyone’s favourite person for ten minutes.'; },
  },
  {
    id: 'dance', label: 'Dance', icon: '💃', desc: 'Fitness/Looks check', zone: 'dance',
    run: (g) => { const n = night(g); const ok = g.check('fitness', 45) || g.check('looks', 55); g.stat('mood', ok ? 6 : 2); n.confidence = Math.min(100, n.confidence + (ok ? 8 : -4)); if (ok) for (const c of crowdNear(g)) c.conn = Math.min(100, c.conn + 6); return ok ? 'A circle formed around you. The crowd cheered.' : 'You danced like nobody was watching. Several people were watching.'; },
  },
  {
    id: 'karaoke', label: 'Karaoke', icon: '🎤', desc: 'Charm/Creativity', lock: (g) => (['karaoke', 'country', 'dive'].includes(night(g).type) ? null : 'No karaoke tonight'),
    run: (g) => { const ok = g.check('creativity', 45) || g.check('charm', 50); g.stat('mood', 6); g.fame(ok ? 0.6 : 0.1); night(g).confidence += ok ? 8 : -3; return ok ? 'You brought the house down!' : 'Off-key, full confidence. They loved it anyway.'; },
  },
  {
    id: 'trivia', label: 'Bar trivia', icon: '🧠', desc: 'Smarts · $50 prize', lock: (g) => (night(g).type === 'trivia' ? null : 'Trivia is on trivia night'),
    run: (g) => { if (g.check('smarts', 55)) { g.money(50); g.stat('smarts', 0.5); return 'Your team won! $50 bar tab.'; } return 'Second-to-last. You knew the answer to question 7, though.'; },
  },
  {
    id: 'pool', label: 'Shoot pool ($10 bet)', icon: '🎱', desc: 'Fitness/Smarts', zone: 'bar', lock: (g) => (night(g).venue === 'club' ? 'No table here' : g.canAfford(10) ? null : 'Need $10'),
    run: (g) => { if (g.check('smarts', 45)) { g.money(10); return 'Bank shot on the eight. Won the $10.'; } g.money(-10); night(g).spent += 10; return 'Scratched on the eight ball. Lost $10.'; },
  },
  {
    id: 'bull', label: 'Mechanical bull ($5)', icon: '🐂', desc: '$100 pot', lock: (g) => (night(g).venue === 'roadhouse' ? (g.canAfford(5) ? null : 'Need $5') : 'Roadhouse only'),
    run: (g) => { g.money(-5); if (g.check('fitness', 50)) { g.money(100); g.burst('confetti'); return 'Eight seconds! You won the $100 pot.'; } g.stat('health', -2); return 'Launched into the hay. Everyone cheered anyway.'; },
  },
  {
    id: 'linedance', label: 'Line dancing', icon: '🤠', desc: 'Make friends', lock: (g) => (night(g).venue === 'roadhouse' ? null : 'Roadhouse only'),
    run: (g) => { g.stat('mood', 6); for (const c of crowdNear(g)) c.conn = Math.min(100, c.conn + 8); return 'You finally nailed the whole routine.'; },
  },
  {
    id: 'dj', label: 'DJ a guest set', icon: '🎧', desc: 'Creativity 40+', lock: (g) => (night(g).venue !== 'club' ? 'Club only' : g.s.stats.creativity >= 40 ? null : 'Needs Creativity 40'),
    run: (g) => { if (g.check('creativity', 55)) { const amt = g.rand(150, 400) + Math.round(g.s.fame * 5); g.money(amt); g.fame(1); return `The floor went crazy. You earned $${amt}.`; } return 'You trainwrecked the transition. Polite clapping.'; },
  },
  {
    id: 'openmic', label: 'Open mic', icon: '🎙️', desc: 'Needs a guitar', lock: (g) => (night(g).venue === 'club' ? 'Bars only' : g.has('guitar') ? null : 'Needs a guitar'),
    run: (g) => { const amt = Math.round(20 + g.s.stats.creativity * 1.5 + g.s.fame * 3); g.money(amt); g.stat('creativity', 2); g.fame(0.8); return `A great set. Tip jar: $${amt}.`; },
  },
];

export function nightAct(g: Game, id: string): string {
  const a = NIGHT_ACTIONS.find((x) => x.id === id);
  const n = g.s.night;
  if (!a || !n || n.time <= 0 || n.incident) return '';
  if (a.zone && a.zone !== n.zone) return '';
  const lock = a.lock?.(g);
  if (lock) return lock;
  const line = a.run(g);
  tick(g, line);
  maybeIncident(g);
  return line;
}

/** Darts: three throws, each 0–1 accuracy from the UI's timing bar. */
export function darts(g: Game, throws: number[]): string {
  const n = night(g);
  if (!n || n.time <= 0) return '';
  const score = Math.round(throws.reduce((a, t) => a + Math.max(0, 60 - Math.abs(0.5 - t) * 120), 0));
  const won = score >= 120;
  if (won) g.money(20);
  const line = won ? `🎯 ${score} points — you won $20 off a stranger.` : `🎯 ${score} points. The wall has more holes than the board.`;
  tick(g, line);
  return line;
}

// ---------------- incidents (resolved inside the scene)

export function maybeIncident(g: Game) {
  const n = night(g);
  if (n.incident || n.time <= 0) return;
  const r = Math.random();
  const others = n.crowd.map((c, i) => ({ c, i })).filter((x) => !x.c.done);
  if (!others.length) return;
  const known = others.find((x) => x.c.known && (x.c.p.role === 'ex' || x.c.p.rivalry >= 50));
  if (known && r < 0.12) n.incident = { kind: 'drama', who: known.i };
  else if (r < 0.06) n.incident = { kind: 'spike', who: g.pick(others).i };
  else if (n.intox >= 70 && r < 0.14 && g.has('phone')) n.incident = { kind: 'phone', who: 0 };
}

export const INCIDENT_CHOICES: Record<'spike' | 'drama' | 'phone', { id: string; label: string }[]> = {
  spike: [{ id: 'stop', label: '🛑 Step in and stop it' }, { id: 'tell', label: '🗣️ Tell the bartender' }, { id: 'ignore', label: 'Look away' }],
  drama: [{ id: 'talk', label: '🤝 Keep it civil' }, { id: 'fight', label: '🥊 Settle it outside' }, { id: 'go', label: '🚪 Leave the area' }],
  phone: [{ id: 'search', label: '🔎 Retrace your steps' }, { id: 'shrug', label: 'Deal with it tomorrow' }],
};

export function incidentText(g: Game): string {
  const n = night(g);
  const inc = n.incident;
  if (!inc) return '';
  const c = n.crowd[inc.who];
  if (inc.kind === 'spike') return say('You see someone slip something into {name}’s drink while {they} {is} looking away.', c.p, g.s.name);
  if (inc.kind === 'drama') return say(`${c.p.role === 'ex' ? 'Your ex' : 'Your rival'} {name} is here — and heading your way.`, c.p, g.s.name);
  return 'Your pocket is empty. Where’s your phone?';
}

export function resolveIncident(g: Game, choice: string): string {
  const n = night(g);
  const inc = n.incident;
  if (!inc) return '';
  n.incident = null;
  const c = n.crowd[inc.who];
  let line: string;
  if (inc.kind === 'spike') {
    if (choice === 'stop' || choice === 'tell') {
      g.karma(choice === 'stop' ? 8 : 5);
      c.conn = Math.min(100, c.conn + 40);
      c.p.trust = Math.min(100, c.p.trust + 30);
      if (choice === 'stop') { g.fame(1); g.milestone('Stopped a drink spiking'); }
      line = say(choice === 'stop' ? 'You knocked the drink away and called security. {name} can’t stop thanking you.' : 'The bartender swapped the drink and threw the guy out. {name} is safe.', c.p, g.s.name);
    } else {
      g.karma(-6);
      g.stat('mood', -6);
      line = 'You looked away. It sits with you all night.';
    }
  } else if (inc.kind === 'drama') {
    if (choice === 'fight') {
      g.stat('street', 2);
      bump(c.p, 'rivalry', 15);
      if (riskCatch(g, 0.25, { name: 'Bar fight', sev: 1, kind: 'fight', by: 'security' })) { endNight(g); return 'Security threw you both out. Police are outside.'; }
      if (g.check('fitness', 50)) line = 'It was over fast. You walked back in to applause.';
      else { g.stat('health', -10); line = 'You lost. The bouncer kicked you out with an ice pack.'; endNight(g); return line; }
    } else if (choice === 'talk') {
      const ok = g.check('charm', 50);
      bump(c.p, 'rivalry', ok ? -10 : 5);
      line = ok ? 'Awkward, but civil. Maybe even… fine?' : 'It got loud. People stared.';
    } else line = 'You moved to the other side of the room.';
  } else {
    if (choice === 'search' && g.chance(0.6)) line = 'Found it under a booth seat. Sticky, but alive.';
    else {
      g.take('phone');
      g.setFlag('phoneLostTurn', g.s.turn);
      line = 'Gone. You’ll need a new phone.';
    }
  }
  tick(g, line);
  return line;
}
