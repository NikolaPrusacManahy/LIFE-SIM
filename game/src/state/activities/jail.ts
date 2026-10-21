import { NIGHT, NOT_NIGHT, type ActivityDef } from './types';
import { studyPerf } from './helpers';

// Update 0.3 — time-served activities (juvenile hall / county jail / prison).

export const JAIL_ACTS: ActivityDef[] = [
  {
    id: 'jail_sleep', loc: 'jail', name: 'Sleep', icon: '🛏️', desc: 'A thin mattress.', cat: 'rest', energy: 0, phases: NIGHT,
    run: (g) => { g.stat('energy', 55); return g.pick(['Lights out at 10.', 'Someone cried two cells down.', 'You dreamed of home.']); },
  },
  {
    id: 'jail_headdown', loc: 'jail', name: 'Keep Your Head Down', icon: '🫥', desc: 'Good behavior, slow days.', cat: 'rest', energy: 0, phases: NOT_NIGHT,
    run: (g) => { g.stat('energy', 12); g.stat('mood', -1); if (g.s.crime.jail) g.s.crime.jail.behavior = Math.min(100, g.s.crime.jail.behavior + 4); return 'Another day off the calendar.'; },
  },
  {
    id: 'jail_study', loc: 'jail', name: 'Classes', icon: '📚', desc: 'Schoolwork or GED prep.', cat: 'study', energy: 14, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('smarts', 2);
      if (g.s.crime.jail) g.s.crime.jail.behavior = Math.min(100, g.s.crime.jail.behavior + 3);
      if (g.s.education.current) {
        studyPerf(g, 2);
        return 'You kept up with your coursework from inside.';
      }
      if (!g.hasDegree('hs') && !g.hasDegree('ged') && g.age >= 16) {
        const n = ++g.s.education.gedStudy;
        if (n >= 8) {
          g.s.education.degrees.push('ged');
          g.milestone('Earned a GED while locked up');
          return 'You passed the GED exam inside!';
        }
        return `GED prep: ${n}/8.`;
      }
      return 'You read everything in the library cart.';
    },
  },
  {
    id: 'jail_workout', loc: 'jail', name: 'Yard Workout', icon: '💪', desc: 'Push-ups and pull-ups.', cat: 'fitness', energy: 18, phases: NOT_NIGHT,
    run: (g) => { g.stat('fitness', 3.5); g.stat('street', 0.8); return 'Two hundred push-ups. Respect in the yard.'; },
  },
  {
    id: 'jail_allies', loc: 'jail', name: 'Make Allies', icon: '🤝', desc: 'Friends inside matter.', cat: 'social', energy: 10, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('street', 2);
      g.stat('charm', 0.8);
      if (g.chance(0.25)) {
        const f = g.addPerson('friend', { age: g.age + g.rand(0, 8), rel: 45, met: g.s.crime.jail?.juvie ? 'Juvenile hall' : 'Inside' });
        return `${f.name} has your back now.`;
      }
      return 'You traded stories over terrible food.';
    },
  },
  {
    id: 'jail_job', loc: 'jail', name: 'Kitchen Duty', icon: '🍲', desc: 'Pennies an hour.', cat: 'money', energy: 15, phases: NOT_NIGHT,
    run: (g) => { g.money(15); if (g.s.crime.jail) g.s.crime.jail.behavior = Math.min(100, g.s.crime.jail.behavior + 5); return 'Peeled potatoes for 6 hours. $15.'; },
  },
];
