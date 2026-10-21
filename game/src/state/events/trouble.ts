import { punish, type Offense } from '../systems/trouble';
import { release, sendToJail } from '../systems/crime';
import { checkHint, type EventDef } from './types';

// Update 0.3 — getting caught: juvenile system under 18, adult system at 18+.

const WHO: Record<NonNullable<Offense['by']>, string> = {
  parents: 'Your parent is standing in the doorway, arms crossed.',
  police: 'A police officer steps out of the cruiser.',
  school: 'The vice principal clears their throat behind you.',
  security: 'Store security walks you to a back room.',
};

export const TROUBLE_EVENTS: EventDef[] = [
  {
    id: 'busted', title: (_g, c) => `Caught: ${c.name}`, icon: '🚨',
    text: (g, c) => `${WHO[(c.by as Offense['by']) ?? 'police']} ${g.age < 18 ? 'You’re a minor — this goes through your parents and the juvenile system.' : 'You’re an adult. This will be handled by the book.'}`,
    choices: (g, c) => [
      { label: g.age < 18 ? 'Accept the consequences' : 'Cooperate', run: (gg) => punish(gg, c as Offense) },
      {
        label: g.age < 18 ? 'Apologize sincerely' : 'Talk your way out',
        hint: checkHint('charm', g.age < 18 ? 50 : 60),
        run: (gg) => {
          if (gg.check('charm', gg.age < 18 ? 50 : 60)) {
            gg.stat('charm', 1);
            return gg.age < 18 ? 'They let you off with a stern warning. This time.' : 'The officer sighed and let you go with a warning.';
          }
          return `It didn’t work. ${punish(gg, c as Offense)}`;
        },
      },
    ],
  },
  {
    id: 'probation_violation', title: 'Probation Violation', icon: '⚖️',
    text: (g) => `You skipped your court-ordered community service. The judge is not amused.${g.age < 18 ? '' : ' This is now a criminal matter.'}`,
    choices: [
      {
        label: 'Face the judge',
        run: (g) => {
          g.setFlag('serviceLeft', 0);
          sendToJail(g, g.age < 18 ? 4 : 3, 'Probation violation');
          return g.age < 18 ? 'Two months in juvenile hall.' : 'Three months in county jail.';
        },
      },
    ],
  },
  {
    id: 'jail_release', title: (g) => (g.s.crime.jail?.juvie ? 'Released from Juvenile Hall' : 'Released'), icon: '🚪',
    text: (g) => (g.s.crime.jail?.juvie ? 'The gate buzzes. Your parent is waiting in the parking lot.' : 'You collect a bag with the clothes you came in with. The sky looks huge.'),
    choices: [{ label: 'Walk out', run: (g) => { release(g, 'time served'); return 'Free. A second chance.'; } }],
  },
  {
    id: 'parole_hearing', title: 'Early Release Hearing', icon: '🧑‍⚖️',
    text: (g) => `Behavior score: ${Math.round(g.s.crime.jail?.behavior ?? 50)}/100. The board will decide if you go home early.`,
    choices: [
      {
        label: 'Show genuine remorse',
        hint: (g) => `${Math.round(Math.min(90, (g.s.crime.jail?.behavior ?? 50) * 0.9))}% chance`,
        run: (g) => {
          const b = g.s.crime.jail?.behavior ?? 50;
          if (g.chance(Math.min(0.9, b / 110))) {
            release(g, 'early release');
            return 'Granted. You’re going home.';
          }
          return 'Denied. Not yet.';
        },
      },
      { label: 'Say nothing', run: () => 'The board moved on to the next case.' },
    ],
  },
  {
    id: 'jail_fight', title: 'Trouble Inside', icon: '😠',
    text: () => 'Someone in the yard wants to prove a point. With you.',
    random: { jail: true, when: () => true, cooldown: 12 },
    choices: [
      { label: 'Stand your ground', hint: checkHint('fitness', 50), run: (g) => { if (g.check('fitness', 50)) { g.stat('street', 3); return 'Nobody tests you now.'; } g.stat('health', -12); return 'You spent a week in the infirmary.'; } },
      { label: 'Tell a guard', run: (g) => { if (g.s.crime.jail) g.s.crime.jail.behavior += 6; g.stat('street', -2); return 'Safer. Less respected.'; } },
    ],
  },
];
