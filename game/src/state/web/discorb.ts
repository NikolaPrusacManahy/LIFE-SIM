import type { Game } from '../Game';
import type { Person } from '../types';
import type { WebAction } from './types';
import { bump } from '../npc/interactions';
import { itemCount } from '../inventory/items';
import { isRomanceEligible } from '../npc/identity';

// Update 0.8 — Discorb: topic rooms, online friends with UNVERIFIED info.
// HARD RULE: romance with an online contact needs a real age of 18+ AND meeting in person (verified).
// A profile can lie; meeting a minor triggers a safety event that ends romance with them for good.

export const ROOMS: Record<string, string> = { gaming: '🎮 #gaming', anime: '🌸 #anime', weather: '🌦️ #weather-nerds', coding: '💻 #coding', local: '🏙️ #local-city' };

export const isOnline = (p: Person) => p.tags.includes('online');
export const isVerified = (p: Person) => !isOnline(p) || p.tags.includes('verified');
/** The age their profile shows (unverified profiles can lie). */
export const claimedAge = (g: Game, p: Person) => {
  const t = p.tags.find((x) => x.startsWith('claims:'));
  return t ? Number(t.slice(7)) : g.ageOf(p);
};

export const onlineFriends = (g: Game) => g.s.people.filter((p) => (isOnline(p) || (p.persona === 'gamer' && p.hasNumber)) && p.alive && p.status === 'alive' && !p.blocked);

/** Meet someone online. Under-18 players only meet honest peers; adults meet mostly adults — some profiles lie. */
export function meetOnline(g: Game, topic: string): string {
  const roll = Math.random();
  let real: number;
  let claims: number;
  if (g.age < 18) {
    real = Math.max(13, Math.min(17, g.age + g.rand(-1, 1)));
    claims = real;
  } else if (roll < 0.05) {
    real = g.rand(14, 17);
    claims = g.rand(18, 20);
  } else {
    real = g.rand(18, 40);
    claims = roll < 0.12 ? Math.max(18, real - g.rand(3, 8)) : real;
  }
  const p = g.addPerson('acquaintance', { age: real, rel: 25, met: 'Discorb', where: `Discorb ${ROOMS[topic] ?? ''}`.trim(), tags: ['online', `claims:${claims}`] });
  p.hasNumber = false;
  p.theyHaveNumber = false;
  return `You started chatting with ${p.name} (says ${claims}) in ${ROOMS[topic] ?? 'a room'}.`;
}

export const DISCORB: WebAction[] = [
  ...Object.keys(ROOMS).map((topic): WebAction => ({
    id: `room_${topic}`, label: `Hang out in ${ROOMS[topic]}`, icon: '💬', desc: 'Meet people · toxic sometimes',
    run: (g) => {
      const r = Math.random();
      if (r < 0.18) { g.stat('mood', -4); return `${ROOMS[topic]} was toxic today. You muted it.`; }
      if (r < 0.24) { g.queue('web_scam'); return 'Someone DM’d you a “free gift card” link…'; }
      if (g.s.fame >= 40 && r < 0.28) { g.queue('web_dox'); return 'A stranger posted your neighbourhood in the chat.'; }
      g.stat('mood', 3);
      return meetOnline(g, topic);
    },
  })),
];

/** Update 0.12 — a webcam for video calls */
export const hasWebcam = (g: Game) => !!(g.s.pc.parts.webcam || itemCount(g, 'pc_cam1'));

/** Friend actions take the friend's id as the argument. */
export const FRIEND_ACTIONS: WebAction[] = [
  {
    // Update 0.12 — gamers would rather call than text. With a webcam it can be a date; the first is a face reveal.
    id: 'call', label: 'Video call', icon: '📞', desc: 'Webcam · can be a date',
    run: (g, pid) => {
      const p = g.personById(pid ?? '');
      if (!p) return '';
      const cam = hasWebcam(g);
      bump(p, 'rel', p.persona === 'gamer' ? 8 : 5);
      g.stat('mood', 4);
      const romantic = cam && isVerified(p) && isRomanceEligible(g, p) && (p.attraction >= 30 || p.romance >= 20);
      if (!romantic) return cam ? `A long call with ${p.name}. You played until 3am.` : `A voice call with ${p.name} (no webcam). Fun anyway.`;
      const reveal = !p.tags.includes('faceReveal');
      if (reveal) p.tags.push('faceReveal');
      bump(p, 'romance', reveal ? 10 : 6);
      bump(p, 'attraction', reveal ? 8 : 3);
      p.lastContact = g.s.clock;
      return reveal ? `📷 Face reveal! You and ${p.name} turned your cameras on for the first time. Nobody played the game.` : `💜 A Discorb date with ${p.name}: cameras on, game paused, talking for hours.`;
    },
  },
  {
    id: 'chat', label: 'Chat', icon: '💬', desc: 'Friendship +',
    run: (g, pid) => {
      const p = g.personById(pid ?? '');
      if (!p) return '';
      bump(p, 'rel', 5);
      // a profile that lies sometimes slips up
      if (g.age >= 18 && g.ageOf(p) < 18 && g.chance(0.25)) g.queue('online_minor', { pid: p.id, how: 'slip' });
      return `You talked with ${p.name} for hours.`;
    },
  },
  {
    id: 'numbers', label: 'Exchange numbers', icon: '📱', desc: 'They appear in Messages', lock: () => null,
    run: (g, pid) => {
      const p = g.personById(pid ?? '');
      if (!p) return '';
      if (p.rel < 40) return `${p.name} isn’t ready to share a number yet.`;
      p.hasNumber = true;
      p.theyHaveNumber = true;
      return `You swapped numbers with ${p.name}.`;
    },
  },
  {
    id: 'meet', label: 'Meet up in person', icon: '☕', desc: 'Verify who they are',
    run: (g, pid) => {
      const p = g.personById(pid ?? '');
      if (!p) return '';
      if (p.rel < 45) return `${p.name} doesn’t want to meet yet.`;
      const claims = claimedAge(g, p);
      p.tags = p.tags.filter((t) => !t.startsWith('claims:'));
      p.tags.push('verified');
      p.where = 'Met online';
      if (g.age >= 18 && g.ageOf(p) < 18) {
        g.queue('online_minor', { pid: p.id, how: 'meet' });
        return `${p.name} showed up — and they’re clearly a kid.`;
      }
      if (claims !== g.ageOf(p)) {
        g.stat('mood', -4);
        bump(p, 'trust', -15);
        return `Catfished — ${p.name} is ${g.ageOf(p)}, not ${claims}. Awkward coffee.`;
      }
      bump(p, 'rel', 6);
      p.role = 'friend';
      return `${p.name} is exactly who they said. Good coffee, good company.`;
    },
  },
];
