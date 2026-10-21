import { DAY, EVE, LATE, NOT_NIGHT, type ActivityDef } from './types';
import { riskCatch } from '../systems/trouble';
import { settings } from '../settings';
import { makeMatch } from '../npc/match';
import { consume } from '../systems/addiction';
import { maybeMeet, pct, studyPerf } from './helpers';

/** High school (obligation slots + after-school), university lectures, and police academy. */
export const SCHOOL_ACTS: ActivityDef[] = [
  // ---- high school, during class
  {
    id: 'class_attend', loc: 'school', name: 'Attend Class', icon: '✏️', desc: 'Show up. Pay attention-ish.', cat: 'study', energy: 12,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      studyPerf(g, 3);
      g.stat('smarts', 1.2);
      if (g.chance(0.08) && g.peopleBy('friend').length < 6) {
        const f = g.addPerson('friend', { rel: 40, met: 'Class' });
        return `You partnered with ${f.name} on a project. New friend!`;
      }
      return g.pick(['A normal school day.', 'History was surprisingly interesting.', 'Lab day — nothing exploded.', 'Pop quiz. You survived.']);
    },
  },
  {
    id: 'class_focus', loc: 'school', name: 'Teacher’s Pet', icon: '🤓', desc: 'Front row, every question.', cat: 'study', energy: 20,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      studyPerf(g, 5.5);
      g.stat('smarts', 2.4);
      g.stat('mood', -2);
      g.stat('street', -0.5);
      return g.pick(['Your teacher beamed at you.', 'You asked so many questions the bell rang early.', 'Perfect score on the quiz.']);
    },
  },
  {
    id: 'class_sleep', loc: 'school', name: 'Sleep in Class', icon: '💤', desc: 'Recover energy. Grades slip.', cat: 'rest', energy: 0,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      g.stat('energy', 15);
      studyPerf(g, -1);
      if (g.chance(0.25)) {
        studyPerf(g, -2);
        return 'The teacher slammed a book on your desk. Everyone laughed.';
      }
      return 'You drooled on your textbook. Worth it.';
    },
  },
  {
    id: 'class_clown', loc: 'school', name: 'Class Clown', icon: '🤡', desc: 'Popular, not with teachers.', cat: 'social', energy: 10,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      g.stat('charm', 2);
      g.stat('mood', 4);
      studyPerf(g, -2);
      if (g.chance(0.25)) {
        const e = g.s.education.current!;
        e.skips++;
        return 'Sent to the principal’s office. Worth it? Debatable.';
      }
      return g.pick(['The whole class cracked up.', 'Your impression of the vice principal went legendary.']);
    },
  },
  // ---- high school, after hours
  {
    id: 'sports', loc: 'school', name: 'Sports Practice', icon: '🏈', desc: 'Varsity dreams.', cat: 'fitness', energy: 22, phases: EVE,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      g.stat('fitness', 3);
      g.stat('charm', 0.6);
      if (!g.flag('varsity') && g.s.stats.fitness >= 55 && g.chance(0.2)) {
        g.setFlag('varsity');
        g.banner('🏆 Varsity!', 0xffd166);
        g.milestone('Made the varsity team');
        return 'The coach pulled you aside: you made varsity!';
      }
      return g.pick(['Sprints until you saw stars.', 'You nailed the drill.', 'Team won the scrimmage.']);
    },
  },
  {
    id: 'club', loc: 'school', name: 'After-School Club', icon: '♟️', desc: 'Chess, drama, robotics, band.', cat: 'social', energy: 12, phases: EVE,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      const c = g.pick(['chess', 'drama', 'robotics', 'band']);
      if (c === 'chess' || c === 'robotics') g.stat('smarts', 2);
      else g.stat('creativity', 2);
      g.stat('charm', 0.8);
      maybeMeet(g, 0.06, 'club');
      return { chess: 'You beat the chess club captain.', drama: 'You landed a part in the play.', robotics: 'Your robot drove in a straight line!', band: 'The band sounded almost good.' }[c]!;
    },
  },
  {
    id: 'study_group', loc: 'school', name: 'Study Group', icon: '👥', desc: 'Learn with friends.', cat: 'study', energy: 14, phases: EVE,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      studyPerf(g, 3);
      g.stat('smarts', 1.5);
      for (const f of g.peopleBy('friend').slice(0, 2)) g.rel(f, 3);
      return 'Snacks, notes, and actual studying.';
    },
  },
  {
    id: 'science_fair', loc: 'school', name: 'Enter Science Fair', icon: '🧪', desc: 'Win a scholarship?', cat: 'study', energy: 25, phases: EVE, cooldown: 48,
    when: (g) => g.s.education.current?.program === 'hs',
    risk: (g) => pct(g.statOdds('smarts', 60)),
    run: (g) => {
      if (g.check('smarts', 60)) {
        g.setFlag('scholarship');
        g.stat('mood', 10);
        g.burst('confetti');
        g.milestone('Won the regional science fair');
        return 'First place! Colleges are calling about scholarships.';
      }
      g.stat('smarts', 1);
      return 'Honorable mention. Your volcano was a bit… flat.';
    },
  },

  // ---- university / trade school
  {
    id: 'lecture_attend', loc: 'campus', name: 'Attend Lecture', icon: '🎓', desc: 'Notes and coffee.', cat: 'study', energy: 12,
    when: (g) => !!g.s.education.current && !['hs', 'academy'].includes(g.s.education.current.program),
    run: (g) => {
      studyPerf(g, 3);
      g.stat('smarts', 1.5);
      return g.pick(['A great lecture.', 'The professor went off on a tangent. A good one.', 'You took solid notes.']);
    },
  },
  {
    id: 'lecture_focus', loc: 'campus', name: 'Office Hours', icon: '🧑‍🏫', desc: 'Go above and beyond.', cat: 'study', energy: 20,
    when: (g) => !!g.s.education.current && !['hs', 'academy'].includes(g.s.education.current.program),
    run: (g) => {
      studyPerf(g, 5.5);
      g.stat('smarts', 2.5);
      g.stat('mood', -1);
      if (g.chance(0.06) && !g.firstBy('mentor')) {
        const m = g.addPerson('mentor', { age: g.age + 30, rel: 55, met: 'Office hours' });
        return `Professor ${m.name} took you under their wing.`;
      }
      return 'The professor remembered your name.';
    },
  },
  {
    id: 'lecture_doze', loc: 'campus', name: 'Doze in the Back', icon: '😪', desc: 'Present, technically.', cat: 'rest', energy: 0,
    when: (g) => !!g.s.education.current && !['hs', 'academy'].includes(g.s.education.current.program),
    run: (g) => {
      g.stat('energy', 14);
      studyPerf(g, 0.5);
      return 'You woke up to an empty lecture hall.';
    },
  },
  {
    id: 'campus_library', loc: 'campus', name: 'Campus Library', icon: '📚', desc: 'Grind for exams.', cat: 'study', energy: 16, phases: NOT_NIGHT,
    when: (g) => !!g.s.education.current && g.s.education.current.program !== 'hs',
    run: (g) => {
      studyPerf(g, 4);
      g.stat('smarts', 2);
      return 'Four hours in a silent study carrel.';
    },
  },
  {
    id: 'campus_party', loc: 'campus', name: 'Campus Party', icon: '🥳', desc: 'College experience™.', cat: 'social', energy: 20, phases: LATE,
    when: (g) => !!g.s.education.current && g.s.education.current.program !== 'hs',
    run: (g) => {
      g.stat('mood', 10);
      g.stat('charm', 1.5);
      g.stat('health', -1);
      maybeMeet(g, 0.15, 'a campus party');
      // Update 0.4 — party hookup chance (adults only, Mature Content on)
      if (settings.mature && g.age >= 18 && !g.queued('party_hookup') && g.chance(0.18)) {
        const p = makeMatch(g, 'acquaintance', [18, 24], { rel: 30, met: g.dateLabel, where: 'Campus party' });
        p.attraction = 55;
        const intox = g.pick(['sober', 'tipsy', 'tipsy', 'very']);
        g.queue('party_hookup', { pid: p.id, intox });
      }
      if (g.chance(0.25)) g.addPerson('friend', { rel: 42, met: 'Campus party' });
      return g.pick(['Legendary night.', 'You played the game everyone plays and won.', 'Someone brought a fog machine.']);
    },
  },
  {
    id: 'hackathon', loc: 'campus', name: 'Hackathon', icon: '🏁', desc: '24 hours. One idea.', cat: 'study', energy: 30, cooldown: 24,
    when: (g) => !!g.s.education.current && ['uni_cs', 'uni_eng', 'grad_ms'].includes(g.s.education.current.program),
    risk: (g) => pct(g.statOdds('smarts', 65)),
    run: (g) => {
      g.stat('smarts', 2);
      g.stat('creativity', 2);
      if (g.check('smarts', 65)) {
        g.money(1500);
        g.burst('coins');
        if (!g.flag('startupIdea')) g.queue('startup_idea');
        return 'Your team won! $1,500 and a wild startup idea.';
      }
      return 'Your demo crashed live on stage. Classic.';
    },
  },

  // ---- police academy
  {
    id: 'academy_train', loc: 'campus', name: 'Academy Training', icon: '🚓', desc: 'Drills and law classes.', cat: 'study', energy: 20,
    when: (g) => g.s.education.current?.program === 'academy',
    run: (g) => {
      studyPerf(g, 4);
      g.stat('fitness', 2);
      g.stat('smarts', 0.8);
      return g.pick(['Obstacle course: done.', 'Constitutional law exam.', 'Range day.']);
    },
  },
  {
    id: 'academy_drill', loc: 'campus', name: 'Extra Drills', icon: '🏃', desc: 'Impress the instructors.', cat: 'fitness', energy: 30,
    when: (g) => g.s.education.current?.program === 'academy',
    run: (g) => {
      studyPerf(g, 6);
      g.stat('fitness', 3.5);
      g.stat('mood', -2);
      return 'The drill sergeant almost smiled.';
    },
  },
  // ---- Update 0.3
  {
    id: 'cheat_test', loc: 'school', name: 'Cheat on a Test', icon: '📱', desc: 'GPA up. Risky.', cat: 'study', energy: 8,
    when: (g) => g.s.education.current?.program === 'hs' && !g.isSummer,
    preview: () => ['Caught 25%'],
    run: (g) => {
      const e = g.s.education.current!;
      g.karma(-3);
      if (g.chance(0.25)) {
        e.perf = Math.max(0, e.perf - 10);
        e.warnings++;
        g.fx({ type: 'shake', power: 4 });
        return 'Caught! A zero on the test and a warning on your file.';
      }
      studyPerf(g, 6);
      return 'Perfect score. You feel slightly gross about it.';
    },
  },
  {
    id: 'council', loc: 'school', name: 'Run for Student Council', icon: '🗳️', desc: 'Speeches and posters.', cat: 'social', energy: 15, phases: EVE, cooldown: 48,
    when: (g) => g.s.education.current?.program === 'hs' && !g.flag('council'),
    risk: (g) => pct(g.statOdds('charm', 55)),
    run: (g) => {
      if (g.check('charm', 55)) {
        g.setFlag('council');
        g.fame(3);
        g.stat('charm', 2);
        g.banner('🗳️ Elected!', 0xff5c8a);
        g.milestone('Elected to student council');
        return 'You won the election! Pizza Fridays are your first act.';
      }
      g.stat('mood', -6);
      return 'You lost to the kid who promised a pool.';
    },
  },
  {
    id: 'cut_class', loc: 'school', name: 'Cut Class with Friends', icon: '🏃', desc: 'Fun now, a skip on your record.', cat: 'fun', energy: 10, phases: DAY,
    when: (g) => g.s.education.current?.program === 'hs' && !g.isSummer && g.peopleBy('friend').length > 0,
    preview: () => ['Counts as a skip'],
    run: (g) => {
      for (const f of g.peopleBy('friend').slice(0, 3)) g.rel(f, 5);
      g.stat('mood', 8);
      g.stat('street', 1);
      return g.pick(['You hit the arcade with your friends.', 'A secret spot by the river. Best day of the year.', 'Fast food and laughing until it hurt.']);
    },
  },
  {
    id: 'prom', loc: 'school', name: 'Prom Night', icon: '👑', desc: 'Senior spring. One night only.', cat: 'social', energy: 20, cost: 150, phases: ['evening'], minAge: 17, cooldown: 48,
    when: (g) => g.s.education.current?.program === 'hs' && (g.month === 3 || g.month === 4),
    run: (g) => {
      g.queue('prom_night', {}, true);
      return 'Suit or dress, a corsage, photos on the lawn…';
    },
  },
  {
    id: 'sat', loc: 'school', name: 'Take the SAT', icon: '📝', desc: 'Your score shapes college odds.', cat: 'study', energy: 20, cost: 60, minAge: 16, cooldown: 12,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      const score = Math.max(400, Math.min(1600, Math.round((420 + g.s.stats.smarts * 11 + g.rand(-90, 90)) / 10) * 10));
      const best = Math.max(score, g.flag('sat'));
      g.setFlag('sat', best);
      if (score >= 1450) g.burst('confetti');
      return `You scored ${score}.${best > score ? ` (Best: ${best})` : ''} ${score >= 1400 ? 'Elite schools are within reach.' : score >= 1100 ? 'Solid.' : 'You can retake it.'}`;
    },
  },
  {
    id: 'vape_gym', loc: 'school', name: 'Vape Behind the Gym', icon: '💨', desc: 'Everyone’s doing it. Allegedly.', cat: 'fun', energy: 4, gate: 'tobacco', legality: 'underage',
    when: (g) => g.s.education.current?.program === 'hs',
    preview: () => ['Caught 20%'],
    run: (g) => {
      consume(g, 'nicotine', 7);
      g.stat('mood', 4);
      g.stat('health', -1);
      g.stat('street', 1);
      if (riskCatch(g, 0.2, { name: 'Vaping at school', sev: 1, kind: 'tobacco', by: 'school' })) return 'A teacher rounded the corner…';
      return 'A cloud of mango-flavored rebellion.';
    },
  },
  {
    id: 'debate', loc: 'school', name: 'Debate Team', icon: '🎙️', desc: 'Win arguments competitively.', cat: 'study', energy: 14, phases: EVE,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      g.stat('charm', 2);
      g.stat('smarts', 1);
      return g.pick(['You demolished the opposing team.', 'A judge called your rebuttal "surgical".']);
    },
  },
  {
    id: 'drama', loc: 'school', name: 'Drama Club', icon: '🎭', desc: 'The stage is calling.', cat: 'fun', energy: 14, phases: EVE,
    when: (g) => g.s.education.current?.program === 'hs',
    run: (g) => {
      g.stat('creativity', 2);
      g.stat('charm', 1);
      if (g.chance(0.05) && !g.queued('school_show_scout')) g.queue('school_show_scout');
      return 'Rehearsal ran late. You know every line.';
    },
  },
  // ---- Update 0.4 (18+, both adults, Mature Content)
  {
    id: 'consent_workshop', loc: 'campus', name: 'Consent Workshop', icon: '🤝', desc: 'Campus seminar. Fewer regrets.', cat: 'study', energy: 8, cooldown: 48, gate: 'intimacy',
    when: (g) => !!g.s.education.current && g.s.education.current.program !== 'hs',
    run: (g) => {
      g.karma(2);
      g.stat('charm', 1);
      g.setFlag('workshop');
      return 'Honest, awkward, useful. You left with free snacks and better communication skills.';
    },
  },
];
