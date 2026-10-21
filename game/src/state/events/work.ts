import { CAREER_BY_ID } from '../data/careers';
import { fire, promote, quitJob, startJob } from '../systems/career';
import { fmt } from '../systems/finance';
import { checkHint, type EventDef } from './types';

const careerName = (g: Parameters<EventDef['text']>[0]) => (g.s.job ? CAREER_BY_ID[g.s.job.careerId] : null);

export const WORK_EVENTS: EventDef[] = [
  {
    id: 'promotion', title: 'Promotion on the Table', icon: '📈',
    text: (g) => {
      const c = careerName(g);
      if (!c || !g.s.job) return 'The moment passed.';
      return `Your boss calls you in. "We’d like you to step up as ${c.levels[g.s.job.level + 1]?.title ?? 'leader'}."`;
    },
    choices: [
      { label: 'Accept graciously', when: (g) => !!g.s.job, run: (g) => { promote(g); if (g.s.job?.careerId === 'founder' && g.s.job.level >= 3) g.achieve('unicorn'); return 'New title, new paycheck.'; } },
      { label: 'Negotiate a bigger raise', when: (g) => !!g.s.job, hint: checkHint('charm', 55), run: (g) => {
        promote(g);
        if (g.check('charm', 55)) { const bonus = Math.round((g.s.job ? careerName(g)?.levels[g.s.job.level].pay ?? 1000 : 1000) * 2); g.money(bonus); return `They caved — plus a ${fmt(bonus)} signing bonus.`; }
        if (g.s.job) g.s.job.perf -= 10;
        return 'They gave you the title, but you burned a little goodwill.';
      } },
    ],
  },
  {
    id: 'fired', title: 'You’re Fired', icon: '📦',
    text: (g, c) => `HR is in the room. That’s never good. Reason: ${c.reason ?? 'restructuring'}.`,
    choices: [
      { label: 'Pack your desk quietly', run: (g, c) => { fire(g, c.reason ?? 'fired'); return 'You carried your plant out to the parking lot.'; } },
      { label: 'Tell your boss what you REALLY think', run: (g, c) => { fire(g, c.reason ?? 'fired'); g.stat('mood', 8); g.stat('street', 1); return 'Security escorted you out. Worth it.'; } },
    ],
  },
  {
    id: 'retirement', title: 'Time to Retire?', icon: '🏖️',
    text: () => 'You’ve put in your years. A pension and endless free time are waiting.',
    choices: [
      { label: 'Retire', run: (g) => {
        const c = careerName(g);
        const pension = c && g.s.job ? Math.round(c.levels[g.s.job.level].pay * 0.4) : 800;
        quitJob(g, true);
        g.setFlag('pension', pension);
        g.stat('mood', 15);
        g.milestone('Retired');
        return `Retired with a ${fmt(pension)}/month pension.`;
      } },
      { label: 'Keep working', run: (g) => { g.stat('mood', -2); return 'Retirement is for quitters.'; } },
    ],
  },
  {
    id: 'startup_idea', title: 'The Big Idea', icon: '🚀',
    text: () => 'At 3am it hits you: an app that could change everything. Do you go all in?',
    choices: [
      { label: 'Go all in — found a startup', hint: 'Quit your job, become a founder', run: (g) => { g.setFlag('startupIdea'); startJob(g, 'founder'); g.achieve('founder'); return 'You registered the company at dawn. Ramen budget engaged.'; } },
      { label: 'Keep it as a side project', run: (g) => { g.setFlag('startupIdea'); g.stat('creativity', 2); return 'Maybe someday.'; } },
    ],
  },
  // ---------------- random
  {
    id: 'coworker_drama', title: 'Office Drama', icon: '☕',
    text: () => 'Two coworkers are at war over a stolen yogurt. Both want you on their side.',
    random: { when: (g) => !!g.s.job && g.age >= 18 },
    choices: [
      { label: 'Pick a side', run: (g) => { g.stat('street', 1); if (g.s.job) g.s.job.perf -= 2; return 'You made an ally and an enemy.'; } },
      { label: 'Stay Switzerland', run: (g) => { g.stat('charm', 1); return 'Neutral. Boring. Safe.'; } },
      { label: 'Buy everyone yogurt ($20)', req: (g) => (g.canAfford(20) ? null : 'Need $20'), run: (g) => { g.money(-20); g.stat('charm', 2); g.karma(2); if (g.s.job) g.s.job.perf += 3; return 'Peace in our time.'; } },
    ],
  },
  {
    id: 'boss_credit', title: 'Stolen Credit', icon: '😠',
    text: () => 'Your boss presented YOUR project to leadership — as their own.',
    random: { when: (g) => !!g.s.job && g.age >= 18 },
    choices: [
      { label: 'Confront them', hint: checkHint('charm', 55), run: (g) => { if (g.check('charm', 55)) { if (g.s.job) g.s.job.perf += 10; return 'They apologized and credited you publicly.'; } if (g.s.job) g.s.job.perf -= 8; return 'They got defensive. Now things are tense.'; } },
      { label: 'Let it slide', run: (g) => { g.stat('mood', -6); return 'You swallowed it. It tasted bad.'; } },
    ],
  },
  {
    id: 'headhunter', title: 'A Headhunter Calls', icon: '📞',
    text: (g) => `A recruiter wants you at a rival ${careerName(g)?.name ?? 'company'} — one level up.`,
    random: { when: (g) => !!g.s.job && g.s.job.perf >= 60 && g.s.job.level < CAREER_BY_ID[g.s.job.careerId].levels.length - 1 && CAREER_BY_ID[g.s.job.careerId].track !== 'special', weight: 0.6 },
    choices: [
      { label: 'Jump ship', run: (g) => { promote(g); return 'New company, bigger title.'; } },
      { label: 'Stay loyal', run: (g) => { if (g.s.job) g.s.job.perf += 6; return 'Your boss heard you turned it down. Respect.'; } },
    ],
  },
  {
    id: 'talent_scout', title: 'A Scout in the Crowd', icon: '🌟',
    text: () => 'Word is someone important is watching your next performance.',
    random: { when: (g) => !!g.s.job && ['musician', 'actor', 'streamer', 'athlete', 'writer'].includes(g.s.job.careerId) && g.s.job.level <= 2, weight: 0.8 },
    choices: (g) => {
      const c = careerName(g)!;
      return [
        { label: 'Give it everything', hint: checkHint(c.stat, 60), run: (gg) => { if (gg.check(c.stat, 60)) { promote(gg); gg.fame(10); gg.banner('🌟 DISCOVERED', 0xffd166); return 'They signed you on the spot!'; } gg.stat('mood', -8); return 'Nerves got you. They left early.'; } },
        { label: 'Play it cool', run: (gg) => { gg.fame(2); return 'Solid, not spectacular.'; } },
      ];
    },
  },
];
