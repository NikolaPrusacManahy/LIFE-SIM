import type { Game } from '../Game';
import type { WebAction } from './types';
import { consume } from '../systems/addiction';
import { weatherAt } from '../systems/weather';
import { MONTHS } from '../types';
import { meetOnline } from './discorb';
import { untouchable } from '../systems/immunity';

// Update 0.8 — Chirp (satire of toxic social media: no slurs, no real people), OtakuPit, GameHub,
// WeatherNerds, LearnHub, JobHunt CV, SpicyHub (a blurred placeholder only).

const HOT_TAKES = ['pineapple belongs on pizza and I will die on this hill', 'breakfast is a scam invented by cereal', 'socks with sandals are peak fashion', 'cats are just tiny landlords', 'the moon is overrated'];
const PILE_ON = ['“ratio”', '“who hurt you”', '“this is the worst take of the year”', '“log off”'];

export const cancelled = (g: Game) => g.s.web.chirp.cancelledUntil > g.s.clock;

export const CHIRP: WebAction[] = [
  { id: 'scroll', label: 'Doomscroll', icon: '📜', desc: 'Mood −, Smarts −', run: (g) => { g.stat('mood', -3); g.stat('smarts', -0.5); return g.pick(['Today’s main character posted their lunch receipt. Thousands are furious.', 'A bot argued with another bot for 200 replies.', 'You read the replies. You should not have read the replies.']); } },
  {
    id: 'post', label: 'Post a hot take', icon: '🔥', desc: 'Fame + · risk of a pile-on', lock: (g) => (cancelled(g) ? 'You’re cancelled for now' : null),
    run: (g) => {
      const c = g.s.web.chirp;
      c.posts++;
      const take = g.pick(HOT_TAKES);
      const roll = Math.random();
      // Update 0.11 — diplomats can't be cancelled
      if (!untouchable(g) && roll < 0.12 + g.s.fame / 400) {
        c.cancelledUntil = g.s.clock + 2;
        g.stat('mood', -12);
        g.fame(3);
        return `“${take}” — you became the main character. Dogpiled for two days. ${g.pick(PILE_ON)}`;
      }
      if (roll < 0.35) { g.stat('mood', -4); return `“${take}” got ratioed. ${g.pick(PILE_ON)}`; }
      const gain = Math.round(5 + g.s.stats.charm / 4 + c.followers / 50);
      c.followers += gain;
      g.fame(0.5);
      return `“${take}” — ${gain} new followers (${c.followers.toLocaleString()}).`;
    },
  },
  { id: 'ratio', label: 'Ratio a stranger', icon: '⚔️', desc: 'Karma −', run: (g) => { g.karma(-1); const won = g.check('charm', 50); g.stat('mood', won ? 4 : -4); return won ? 'Your reply got 10× their likes. Petty, but sweet.' : 'They ratioed you back. Harder.'; } },
  { id: 'delete', label: 'Delete old posts', icon: '🧹', desc: 'Safer job interviews', lock: (g) => (g.s.web.chirp.posts ? null : 'Nothing to delete'), run: (g) => { g.s.web.chirp.posts = 0; return 'Scrubbed. Your past is (mostly) gone.'; } },
];

export const OTAKU: WebAction[] = [
  { id: 'lurk', label: 'Lurk the forums', icon: '👁️', desc: 'Mood +', run: (g) => { g.stat('mood', 3); return g.pick(['A 300-post war about the best season. Nobody won.', 'Someone posted a tier list. Chaos ensued.', '“You haven’t read the manga? Filtered.”']); } },
  { id: 'tier', label: 'Post your tier list', icon: '📊', desc: 'Respect or dogpile', run: (g) => { const ok = g.check('creativity', 45); g.s.web.otaku += ok ? 3 : -2; g.stat('mood', ok ? 5 : -5); return ok ? '“based list” — the forum respects you now.' : '“waifu war” incoming. You’ve been dogpiled.'; } },
  { id: 'friend', label: 'DM a forum friend', icon: '✉️', desc: 'An online friend', run: (g) => meetOnline(g, 'anime') },
];

export const GAMEHUB: WebAction[] = [
  { id: 'guide', label: 'Read game guides', icon: '📖', desc: 'Mini-game scores +', run: (g) => { if (!g.s.web.guides.includes('games')) g.s.web.guides.push('games'); return 'You learned every trick. Your high scores will thank you.'; } },
  { id: 'drama', label: 'Read patch-note drama', icon: '😤', desc: 'Mood ±', run: (g) => { g.stat('mood', g.chance(0.5) ? 2 : -2); return 'They nerfed your main. The forum is on fire.'; } },
  { id: 'lfg', label: 'Post an LFG', icon: '🎮', desc: 'Make an online friend', run: (g) => { consume(g, 'gaming', 1); return meetOnline(g, 'gaming'); } },
];

export function forecast(g: Game): string {
  const nm = (g.month + 1) % 12;
  const ny = g.month === 11 ? g.year + 1 : g.year;
  const w = weatherAt(ny, nm);
  return `${MONTHS[nm]} forecast: ${w === 'snow' ? '❄️ snow' : w === 'rain' ? '🌧️ rain' : '☀️ clear skies'}.`;
}

export const WEATHER: WebAction[] = [
  { id: 'forecast', label: 'Check the forecast', icon: '🌦️', desc: 'Next month', free: true, run: (g) => forecast(g) },
  { id: 'chase', label: 'Join a storm-chaser thread', icon: '🌪️', desc: 'Wholesome', run: (g) => { g.stat('mood', 4); g.stat('smarts', 0.5); return 'Retired meteorologists explained clouds to you. It was lovely.'; } },
];

/** LearnHub courses: 3 sessions → a certificate that helps job applications in that track. */
export const COURSES: Record<string, { name: string; track: string; cost: number; stat: 'smarts' | 'creativity' | 'charm' }> = {
  code: { name: 'Coding Bootcamp', track: 'pro', cost: 50, stat: 'smarts' },
  design: { name: 'Design Basics', track: 'creative', cost: 40, stat: 'creativity' },
  sales: { name: 'Sales & Service', track: 'service', cost: 20, stat: 'charm' },
  trade: { name: 'Electrical Safety', track: 'trade', cost: 30, stat: 'smarts' },
};

export const LEARNHUB: WebAction[] = Object.entries(COURSES).map(([id, c]): WebAction => ({
  id, label: c.name, icon: '📜', desc: `$${c.cost} · 3 sessions · ${c.track} jobs +`,
  lock: (g) => (g.flag(`cert:${c.track}`) ? 'Certified ✓' : g.canAfford(c.cost) ? null : `Need $${c.cost}`),
  run: (g) => {
    g.money(-c.cost);
    g.stat(c.stat, 1.5);
    const n = (g.s.web.courses[id] = (g.s.web.courses[id] ?? 0) + 1);
    if (n >= 3) { g.setFlag(`cert:${c.track}`); return `🎓 ${c.name} certificate earned! ${c.track} employers will like this.`; }
    return `${c.name}: module ${n}/3 done.`;
  },
}));

export const JOBHUNT_EXTRA: WebAction[] = [
  { id: 'cv', label: 'Build your CV', icon: '📄', desc: 'Hiring odds +5%', lock: (g) => (g.flag('cv') ? 'CV ready ✓' : null), run: (g) => { g.setFlag('cv'); return 'Your CV looks professional. Recruiters may notice.'; } },
];

/** SpicyHub: never shows content — a blurred placeholder with gag captions. */
export const SPICY: WebAction[] = [
  {
    id: 'browse', label: 'Browse', icon: '🌶️', desc: 'Mood + · Energy −',
    run: (g) => {
      g.stat('mood', 4);
      g.stat('energy', -6);
      consume(g, 'adult', 3);
      if (g.chance(0.08)) { g.queue('web_malware'); return 'A pop-up says you won a free phone. Uh oh.'; }
      if (g.partner && g.s.session?.device !== 'library' && g.chance(0.05)) g.queue('web_history', { pid: g.partner.id });
      return g.pick(['[blurred] “Plumber arrives to fix the sink. Fixes the sink.”', '[blurred] “Pizza delivery, extra cheese.”', '[blurred] “Yoga instructor demonstrates… yoga.”']);
    },
  },
  { id: 'clear', label: 'Clear browser history', icon: '🧽', desc: 'Just in case', free: true, run: () => 'History cleared. Incognito next time.' },
];
