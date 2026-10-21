import type { Game } from '../Game';
import type { WebAction } from './types';
import { itemCount } from '../inventory/items';
import { consume } from '../systems/addiction';

// Update 0.8 — ViewTube (videos) and Twitchy (streaming). Parody names, no real brands.

const pcScore = (g: Game) => (g.s.session?.device === 'pc' ? g.s.pc.score : g.s.session?.device === 'laptop' ? 20 : 10);
const hasGear = (g: Game) => !!(g.s.pc.parts.webcam || itemCount(g, 'pc_cam1')) && !!(g.s.pc.parts.mic || itemCount(g, 'pc_mic1'));

const TUTORIALS: Record<string, { label: string; stat: 'smarts' | 'fitness' | 'creativity' | 'charm'; guide: string }> = {
  coding: { label: 'Learn to code (tutorial)', stat: 'smarts', guide: 'coding' },
  cooking: { label: 'Cooking tutorial', stat: 'creativity', guide: 'cooking' },
  fitness: { label: 'Home workout video', stat: 'fitness', guide: 'fitness' },
  pc: { label: '“How to build a PC” guide', stat: 'smarts', guide: 'pc' },
};

const COMMENTS_GOOD = ['“this made my whole week”', '“underrated channel fr”', '“the editing on this 🔥”'];
const COMMENTS_BAD = ['“first”', '“who asked”', '“ratio + you fell off”', '“mid”'];

export const VIEWTUBE: WebAction[] = [
  { id: 'watch', label: 'Watch videos', icon: '📺', desc: 'Mood +', run: (g) => { g.stat('mood', 5); g.stat('energy', 3); return g.pick(['Three hours of cat videos. No regrets.', 'A 40-minute essay about a cartoon. Riveting.', 'You fell down a documentary rabbit hole.']); } },
  ...Object.entries(TUTORIALS).map(([id, t]): WebAction => ({
    id: `tut_${id}`, label: t.label, icon: '🎓', desc: `${t.stat[0].toUpperCase()}${t.stat.slice(1)} +`,
    run: (g) => { g.stat(t.stat, 2); if (!g.s.web.guides.includes(t.guide)) g.s.web.guides.push(t.guide); return id === 'pc' ? 'You know where the thermal paste goes now.' : `You followed along. ${t.stat} +2.`; },
  })),
  { id: 'channel', label: 'Start a channel', icon: '🎬', desc: 'Your own ViewTube', lock: (g) => (g.s.web.channel ? 'Already have one' : null), free: true, run: (g) => { g.s.web.channel = { subs: 0, videos: 0 }; return 'Channel created. Zero subscribers. Everyone starts somewhere.'; } },
  {
    id: 'upload', label: 'Edit & upload a video', icon: '⬆️', desc: 'Subs, fame, ad money', lock: (g) => (!g.s.web.channel ? 'Start a channel first' : null),
    run: (g) => {
      const ch = g.s.web.channel!;
      ch.videos++;
      const gain = Math.round((g.s.stats.creativity / 10 + pcScore(g) / 8) * (0.5 + Math.random() * 1.5) * (1 + ch.subs / 2000));
      const viral = g.chance(0.04 + g.s.stats.creativity / 2000);
      ch.subs += viral ? gain * 25 : gain;
      if (viral) { g.fame(6); g.burst('sparkle'); return `It went VIRAL. +${(gain * 25).toLocaleString()} subscribers overnight.`; }
      g.fame(0.3);
      return `Uploaded video #${ch.videos}. +${gain} subscribers (${ch.subs.toLocaleString()} total).`;
    },
  },
  {
    id: 'comments', label: 'Read the comments', icon: '💬', desc: 'Brave', lock: (g) => (!g.s.web.channel?.videos ? 'Upload something first' : null),
    run: (g) => { const good = g.chance(0.55); g.stat('mood', good ? 3 : -4); return `${good ? g.pick(COMMENTS_GOOD) : g.pick(COMMENTS_BAD)} — ${good ? 'you screenshotted it.' : 'you closed the tab.'}`; },
  },
];

const STREAMERS = ['xXSnipeQueenXx (chaotic energy)', 'ChillBroDan (cozy farming)', 'ProfessorPixel (speedruns)', 'MamaMia_Gaming (wholesome)'];

export const TWITCHY: WebAction[] = [
  { id: 'watch', label: 'Watch a stream', icon: '👀', desc: 'Mood +', run: (g) => { g.stat('mood', 4); consume(g, 'gaming', 1); return `You watched ${g.pick(STREAMERS)}. Chat was a war zone.`; } },
  { id: 'donate', label: 'Donate $20', icon: '💜', desc: 'A shout-out', lock: (g) => (g.canAfford(20) ? null : 'Need $20'), run: (g) => { g.money(-20); g.stat('mood', 6); return 'They read your name out loud. You screamed a little.'; } },
  {
    id: 'live', label: 'Go live', icon: '🔴', desc: 'Needs webcam + mic', lock: (g) => (g.age < 13 ? 'Must be 13' : !hasGear(g) ? 'Needs a webcam and a mic' : g.s.session?.device === 'library' ? 'Not on a library PC' : null),
    run: (g) => {
      const st = (g.s.web.stream ??= { followers: 0, lives: 0 });
      st.lives++;
      const viewers = Math.round((g.s.stats.charm / 5 + pcScore(g) / 3 + (g.s.pc.parts.rgb ? 6 : 0)) * (1 + st.followers / 500));
      const tips = Math.round(viewers * (0.2 + Math.random() * 0.6));
      st.followers += Math.round(viewers / 4);
      g.money(tips);
      consume(g, 'gaming', 3);
      const roll = Math.random();
      if (roll < 0.08) { st.followers += viewers * 3; g.fame(4); return `A big streamer RAIDED you! ${viewers * 3} new followers.`; }
      if (roll < 0.18) { g.stat('mood', -6); return `${viewers} viewers — and a wave of toxic chatters. You banned 30 people.`; }
      if (roll < 0.24) { g.fame(5); return `A clip of you went viral. ${viewers} viewers, $${tips} in tips.`; }
      if (g.s.pc.parts.rgb && g.chance(0.3)) return `“nice setup” x40 in chat. ${viewers} viewers, $${tips} in tips.`;
      return `${viewers} viewers, $${tips} in tips. ${st.followers.toLocaleString()} followers.`;
    },
  },
];
