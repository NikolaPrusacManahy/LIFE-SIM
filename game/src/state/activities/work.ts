import { salary, workGains } from '../systems/career';
import { currentObligations } from '../systems/obligations';
import { fmt } from '../systems/finance';
import { type ActivityDef } from './types';
import { jobFlavor, jobPerf } from './helpers';

const onShift = (g: Parameters<NonNullable<ActivityDef['when']>>[0]) => currentObligations(g).some((o) => o.kind === 'work');

export const WORK_ACTS: ActivityDef[] = [
  {
    id: 'work_shift', loc: 'work', name: 'Work Your Shift', icon: '🧰', desc: 'Do the job.', cat: 'work', energy: 18, kind: 'work',
    when: (g) => !!g.s.job,
    lock: (g) => (onShift(g) ? null : 'Not your shift'),
    run: (g) => {
      jobPerf(g, 3);
      workGains(g, 1);
      return jobFlavor(g);
    },
  },
  {
    id: 'work_hard', loc: 'work', name: 'Grind Hard', icon: '🔥', desc: 'Chase that promotion.', cat: 'work', energy: 28, kind: 'work',
    when: (g) => !!g.s.job,
    lock: (g) => (onShift(g) ? null : 'Not your shift'),
    run: (g) => {
      jobPerf(g, 6);
      workGains(g, 1.4);
      g.stat('mood', -3);
      return `You outworked everyone. ${jobFlavor(g)}`;
    },
  },
  {
    id: 'work_slack', loc: 'work', name: 'Slack Off', icon: '🥱', desc: 'Look busy. Be not busy.', cat: 'rest', energy: 6, kind: 'work',
    when: (g) => !!g.s.job,
    lock: (g) => (onShift(g) ? null : 'Not your shift'),
    run: (g) => {
      g.stat('mood', 5);
      g.stat('energy', 8);
      if (g.chance(0.25)) {
        jobPerf(g, -8);
        return 'Your boss caught you watching videos. Awkward.';
      }
      jobPerf(g, -2);
      return 'You perfected the art of looking busy.';
    },
  },
  {
    id: 'work_network', loc: 'work', name: 'Network', icon: '🤝', desc: 'Coffee with the right people.', cat: 'social', energy: 14, kind: 'work',
    when: (g) => !!g.s.job,
    lock: (g) => (onShift(g) ? null : 'Not your shift'),
    run: (g) => {
      jobPerf(g, 2);
      g.stat('charm', 1.5);
      if (!g.firstBy('mentor') && g.chance(0.12)) {
        const m = g.addPerson('mentor', { age: g.age + 20, rel: 50, met: 'Work' });
        return `${m.name}, a senior colleague, offered to mentor you.`;
      }
      if (g.chance(0.18)) {
        const c = g.addPerson('coworker', { rel: 45, met: 'Work' });
        return `You hit it off with ${c.name} from down the hall.`;
      }
      return 'Small talk. Strategic small talk.';
    },
  },
  {
    id: 'overtime', loc: 'work', name: 'Overtime', icon: '⏰', desc: 'Extra hours, extra pay.', cat: 'money', energy: 25, kind: 'work',
    when: (g) => !!g.s.job,
    lock: (g) => (onShift(g) ? 'You’re already on shift' : null),
    run: (g) => {
      const pay = Math.round(salary(g) / 10);
      g.money(pay);
      jobPerf(g, 2);
      g.stat('mood', -4);
      return `Overtime paid ${fmt(pay)}.`;
    },
  },
];
