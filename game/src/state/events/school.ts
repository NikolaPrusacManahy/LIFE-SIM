import { PROGRAM_BY_ID, DEGREE_LABEL } from '../data/programs';
import { dropOut, gpa, graduate, passMark } from '../systems/education';
import { checkHint, inHS, type EventDef } from './types';
import { confiscatePhone } from '../systems/phone';

/** Update 0.4 — first-day friends are classmates with a real archetype and your number. */
function classmate(g: Parameters<EventDef['text']>[0], archetype: 'nerd' | 'jock' | 'artsy') {
  const p = g.addPerson('friend', { rel: 50, age: g.age + g.rand(0, 1), met: 'Lunch table', where: g.s.region === 'city' ? 'Westside High' : 'Hollow Creek High', archetype });
  p.labels.push('classmate');
  return p;
}

export const SCHOOL_EVENTS: EventDef[] = [
  {
    id: 'hs_first_day', title: 'First Day of High School', icon: '🏫',
    text: (g) => `The cafeteria at ${g.s.region === 'city' ? 'Westside High' : 'Hollow Creek High'} is a jungle. Where do you sit?`,
    choices: [
      { label: 'With the nerds', hint: 'Smarts', run: (g) => { g.stat('smarts', 3); classmate(g, 'nerd'); return 'They were debating sci-fi. You fit right in.'; } },
      { label: 'With the jocks', hint: 'Fitness', run: (g) => { g.stat('fitness', 3); classmate(g, 'jock'); return 'They invited you to tryouts.'; } },
      { label: 'With the art kids', hint: 'Creativity', run: (g) => { g.stat('creativity', 3); classmate(g, 'artsy'); return 'Someone drew your portrait on a napkin.'; } },
      { label: 'Alone, headphones in', hint: 'Mood', run: (g) => { g.stat('mood', -2); g.stat('smarts', 1); return 'Peaceful. A little lonely.'; } },
    ],
  },
  {
    id: 'school_warning', icon: '⚠️',
    title: (_g, c) => (c.n >= 3 ? 'Expelled' : c.n === 2 ? 'Your Parents Got a Call' : 'Detention'),
    text: (g, c) => {
      const hs = inHS(g);
      if (c.n >= 3) return hs ? 'Too many skipped classes. The principal has had enough — you are expelled.' : 'Academic probation failed. The dean dismisses you from the program.';
      if (c.n === 2) return hs ? 'The school called home about your attendance. The look on your parents’ faces says everything.' : 'Final warning from the dean: one more bad month and you’re out.';
      return `You skipped ${c.skips} classes this month. ${hs ? 'Detention, Saturday morning.' : 'The registrar sent a warning.'}`;
    },
    choices: (_g, c) =>
      c.n >= 3
        ? [{
            label: 'Clean out your locker',
            run: (g) => {
              dropOut(g, 'Expelled');
              g.achieve('dropout');
              g.stat('mood', -10);
              for (const p of g.parents) g.rel(p, -15);
              g.fx({ type: 'shake', power: 8 });
              return 'You walked out the front doors for the last time. A GED is still an option.';
            },
          }]
        : [
            { label: 'Apologize and promise to do better', run: (g) => { if (g.s.education.current) g.s.education.current.perf += 2; for (const p of g.parents) g.rel(p, 1); return 'You meant it. Mostly.'; } },
            { label: 'Shrug it off', run: (g) => { g.stat('street', 1.5); g.stat('mood', g.hasTrait('rebel') ? 4 : 0); for (const p of g.parents) g.rel(p, -6); return 'Rules are suggestions, right?'; } },
          ],
  },
  {
    id: 'graduation', icon: '🎓',
    title: (g) => {
      const e = g.s.education.current;
      return e ? `${PROGRAM_BY_ID[e.program].name}: Finals` : 'Graduation';
    },
    text: (g) => {
      const e = g.s.education.current;
      if (!e) return 'The ceremony is over.';
      const p = PROGRAM_BY_ID[e.program];
      return e.perf >= passMark(p)
        ? `You made it. Final GPA: ${gpa(e.perf)}. The ${DEGREE_LABEL[p.degree]} is yours.`
        : `Final GPA: ${gpa(e.perf)}. Not enough to pass.`;
    },
    choices: (g) => {
      const e = g.s.education.current;
      if (!e) return [{ label: 'Continue', run: () => '' }];
      const p = PROGRAM_BY_ID[e.program];
      if (e.perf >= passMark(p)) {
        return [
          { label: 'Throw your cap in the air! 🎓', run: (gg) => { graduate(gg); gg.stat('mood', 15); for (const x of gg.parents) gg.rel(x, 8); return p.kind === 'hs' ? 'Diploma in hand. Apply for college or trade school at the library’s Admissions Desk.' : 'Degree earned. Time to put it to work.'; } },
        ];
      }
      if (p.kind === 'hs' && !e.heldBack) {
        return [
          { label: 'Repeat senior year', run: (gg) => { e.heldBack = true; e.length += 12; e.perf = 45; gg.stat('mood', -10); return 'Held back a year. Humbling. Try again.'; } },
          { label: 'Drop out', run: (gg) => { dropOut(gg); gg.achieve('dropout'); return 'You walked away. You can earn a GED at the library.'; } },
        ];
      }
      return [{ label: 'Accept it', run: (gg) => { dropOut(gg, 'Failed out'); gg.stat('mood', -12); return 'You failed out. It stings.'; } }];
    },
  },
  // ---------------- random
  {
    id: 'bully', title: 'The Hallway Bully', icon: '😤',
    text: () => 'A senior shoves you into a locker and demands your lunch money.',
    random: { when: (g) => inHS(g) && g.phase !== 'night', weight: 1.2 },
    choices: [
      { label: 'Stand your ground', hint: checkHint('fitness', 45), run: (g) => { if (g.check('fitness', 45)) { g.stat('street', 3); g.stat('mood', 8); return 'You shoved back. They never bothered you again.'; } g.stat('health', -6); g.stat('mood', -6); g.fx({ type: 'shake', power: 5 }); return 'You got a black eye. But you didn’t back down.'; } },
      { label: 'Crack a joke', hint: checkHint('charm', 50), run: (g) => { if (g.check('charm', 50)) { g.stat('charm', 2); return 'Everyone laughed — at them. They slunk off.'; } g.money(-Math.min(10, g.s.money)); return 'Nobody laughed. You lost your lunch money.'; } },
      { label: 'Tell a teacher', run: (g) => { g.karma(2); g.stat('street', -1); return 'The bully got detention. Some kids called you a snitch.'; } },
      { label: 'Hand over the money', run: (g) => { g.money(-Math.min(10, g.s.money)); g.stat('mood', -5); return 'You went hungry today.'; } },
    ],
  },
  {
    id: 'pop_quiz', title: 'Pop Quiz!', icon: '📝',
    text: () => 'The teacher smiles. "Clear your desks." You did not study.',
    random: { when: (g) => inHS(g) && !g.isSummer, cooldown: 24 },
    choices: [
      { label: 'Wing it', hint: checkHint('smarts', 50), run: (g) => { const e = g.s.education.current ?? { perf: 0, warnings: 0 }; if (g.check('smarts', 50)) { e.perf += 5; return 'Somehow, an A-minus.'; } e.perf -= 4; return 'A big red D.'; } },
      { label: 'Peek at your neighbor’s answers', hint: '25% chance to get caught', run: (g) => { const e = g.s.education.current ?? { perf: 0, warnings: 0 }; g.karma(-2); if (g.chance(0.25)) { e.perf -= 8; e.warnings++; return 'Caught! Zero, and a note home.'; } e.perf += 4; return 'Full marks. Your neighbor is a genius.'; } },
    ],
  },
  {
    id: 'house_party', title: 'House Party', icon: '🏠',
    text: () => 'Someone’s parents are out of town. Everyone’s going. Including your crush, allegedly.',
    random: { when: (g) => g.age >= 14 && g.age <= 19, cooldown: 36 },
    choices: [
      { label: 'Go and have a blast', run: (g) => { g.stat('mood', 10); g.stat('charm', 2); g.stat('energy', -15); if (g.chance(0.3)) g.queue('meet_someone', { where: 'a house party' }); if (g.livesWithParents && g.chance(0.3)) g.queue('curfew'); return 'Best night of the year.'; } },
      { label: 'Stay home and study', run: (g) => { g.stat('smarts', 2); if (g.s.education.current) g.s.education.current.perf += 2; g.stat('mood', -3); return 'FOMO is real. Your grades thank you.'; } },
    ],
  },
  {
    id: 'parent_advice', title: 'A Talk with Your Parent', icon: '🗣️',
    text: (g) => `${g.parents[0]?.name ?? 'Your parent'} sits you down. "Can we talk about your future?"`,
    random: { when: (g) => g.livesWithParents && g.age >= 14 && g.age <= 20 && g.parents.length > 0 },
    choices: [
      { label: 'Actually listen', run: (g) => { g.stat('smarts', 1); for (const p of g.parents) g.rel(p, 6); return 'They had some good points. Don’t tell them that.'; } },
      { label: 'Roll your eyes', run: (g) => { for (const p of g.parents) g.rel(p, -5); g.stat('mood', 1); return '"You’ll understand when you’re older."'; } },
    ],
  },
  {
    id: 'curfew', title: 'Busted After Curfew', icon: '🚪',
    text: (g) => `You tiptoe in at 2am. The lights flick on. ${g.parents[0]?.name ?? 'Your parent'} is waiting on the couch.`,
    choices: [
      { label: 'Apologize', run: (g) => { for (const p of g.parents) g.rel(p, -3); return 'Grounded for a week.'; } },
      { label: 'Make up a story', hint: checkHint('charm', 55), run: (g) => { if (g.check('charm', 55)) { g.stat('charm', 1); return 'They bought it. Somehow.'; } for (const p of g.parents) g.rel(p, -10); return 'They didn’t buy it. Grounded for a month.'; } },
      { label: '"I’m not a kid anymore!"', run: (g) => { for (const p of g.parents) g.rel(p, -12); g.stat('street', 1); return `Doors were slammed.${confiscatePhone(g, 1)}`; } },
    ],
  },
  {
    id: 'sweet16', title: 'Sweet Sixteen', icon: '🚗',
    text: () => 'You’re 16! You can take the road test at the Driving School (after your permit and 3 lessons), work most jobs, and take evening shifts.',
    choices: [{ label: 'Let’s go', run: (g) => { g.stat('mood', 8); g.burst('confetti'); if (g.s.background === 'rich') g.setFlag('carPromised'); return g.s.background === 'rich' ? 'Your parents hint there’s a car waiting once you pass the road test.' : 'Freedom is close.'; } }],
  },
];
