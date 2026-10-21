import { treat, habit, HABITS } from '../systems/addiction';
import { stiTest } from '../systems/intimacy';
import { settings } from '../settings';
import { careerStatus, startJob } from '../systems/career';
import { CAREER_BY_ID } from '../data/careers';
import { ageGate } from '../rules/us';
import { DAY, NOT_NIGHT, type ActivityDef } from './types';
import { pct, studyPerf } from './helpers';
import { relocate } from './travel';
import { addItem, itemCount } from '../inventory/items';

// Update 0.3 — community college, driving school, clinic, airport, recruiting office, rehab, community service.

const inCC = (g: Parameters<NonNullable<ActivityDef['when']>>[0]) => !!g.s.education.current?.program.startsWith('cc_');

export const SERVICE_ACTS: ActivityDef[] = [
  // ---- community college
  { id: 'cc_desk', loc: 'college', name: 'Enrollment Office', icon: '📝', desc: 'Apply for classes.', cat: 'panel', energy: 0, panel: 'school', run: () => '' },
  {
    id: 'cc_attend', loc: 'college', name: 'Attend Class', icon: '✏️', desc: 'Credits, one class at a time.', cat: 'study', energy: 12, when: inCC,
    run: (g) => { studyPerf(g, 3); g.stat('smarts', 1.4); return g.pick(['A solid class.', 'Your night-class classmates are fascinating people.', 'You aced the quiz.']); },
  },
  {
    id: 'cc_focus', loc: 'college', name: 'Stay After Class', icon: '🙋', desc: 'Extra help from the instructor.', cat: 'study', energy: 18, when: inCC,
    run: (g) => { studyPerf(g, 5); g.stat('smarts', 2.2); return 'Your instructor wrote you a transfer recommendation.'; },
  },

  // ---- driving school
  {
    id: 'drive_lesson', loc: 'driving', name: 'Driving Lesson', icon: '🛞', desc: 'Practice with an instructor.', cat: 'study', energy: 12, cost: 60, phases: NOT_NIGHT,
    lock: (g) => (g.flag('permit') ? null : 'Get your permit first'),
    when: (g) => !g.flag('license'),
    run: (g) => { const n = g.inc('driveLessons'); return n >= 3 ? 'Your instructor says you’re ready for the road test.' : `Lesson ${n}/3: ${g.pick(['parallel parking (almost).', 'highway merge — survived.', 'three-point turn, five points.'])}`; },
  },
  {
    id: 'permit_test', loc: 'driving', name: 'Learner’s Permit Test', icon: '📋', desc: 'Written test.', cat: 'study', energy: 8, cost: 30, gate: 'permit', cooldown: 4,
    when: (g) => !g.flag('permit'),
    risk: (g) => pct(g.statOdds('smarts', 25)),
    run: (g) => {
      if (g.check('smarts', 25)) { g.setFlag('permit'); g.burst('sparkle'); return 'Passed! You have a learner’s permit.'; }
      return 'Failed by two questions. Study the handbook and retry.';
    },
  },
  {
    id: 'road_test', loc: 'driving', name: 'Road Test', icon: '🚦', desc: 'Get your license.', cat: 'study', energy: 15, cost: 40, gate: 'license', cooldown: 4,
    when: (g) => !!g.flag('permit') && !g.flag('license'),
    lock: (g) => (g.flag('driveLessons') >= 3 ? null : 'Take 3 lessons first'),
    risk: (g) => pct(g.odds((g.s.stats.smarts + g.s.stats.fitness) / 2, 30)),
    run: (g) => {
      if (Math.random() < g.odds((g.s.stats.smarts + g.s.stats.fitness) / 2, 30)) {
        g.setFlag('license');
        g.burst('confetti');
        g.banner('🚗 Licensed!', 0x34c3c9);
        g.milestone('Got a driver’s license');
        if (g.flag('carPromised') && !g.has('car')) { g.give('car'); return 'You passed! And your parents handed you the keys to your own car!'; }
        return 'You passed! You can buy and drive a car now.';
      }
      return 'You rolled through a stop sign. Retest next month.';
    },
  },

  // ---- clinic & pharmacy
  {
    id: 'medicine', loc: 'clinic', name: 'Pharmacy Medicine', icon: '💊', desc: 'Feel a bit better.', cat: 'health', energy: 3, cost: 25, cooldown: 4,
    run: (g) => { g.stat('health', 5); return 'Cold medicine and a lollipop.'; },
  },
  {
    id: 'buy_condoms', loc: 'clinic', name: 'Buy Condoms', icon: '🛡️', desc: 'Pack of 5. Protection.', cat: 'health', energy: 1, cost: 12, gate: 'intimacy',
    when: () => settings.mature,
    run: (g) => { addItem(g, 'condoms', 5); return `Bought a pack. You have ${itemCount(g, 'condoms')}.`; },
  },
  {
    id: 'birth_control', loc: 'clinic', name: 'Birth Control Prescription', icon: '📅', desc: '6 months. $30/mo.', cat: 'health', energy: 4, cost: 40, gate: 'intimacy',
    when: (g) => settings.mature && g.flag('pillUntil') <= g.s.clock,
    run: (g) => { g.setFlag('pillUntil', g.s.clock + 6); return 'Prescription filled for six months.'; },
  },
  {
    id: 'sti_test', loc: 'clinic', name: 'STI Test', icon: '🧪', desc: 'Confidential. Treatment if needed.', cat: 'health', energy: 4, cost: 60, minAge: 16, cooldown: 4,
    run: (g) => stiTest(g),
  },
  {
    id: 'clinic_checkup', loc: 'clinic', name: 'Walk-in Checkup', icon: '🩺', desc: 'Quick and cheap.', cat: 'health', energy: 4, cost: (g) => (g.age < 18 ? 0 : 60), cooldown: 8,
    run: (g) => { g.stat('health', g.s.stats.health < 60 ? 8 : 3); return 'The nurse practitioner says you’re doing okay.'; },
  },

  // ---- airport
  {
    id: 'vacation', loc: 'airport', name: 'Vacation', icon: '🏝️', desc: 'A week somewhere warm.', cat: 'travel', energy: 10, cost: (g) => (g.s.money > 30000 ? 4000 : 1500), gate: 'travel', cooldown: 16,
    run: (g) => {
      g.stat('mood', 25);
      g.stat('energy', 20);
      g.stat('health', 3);
      const p = g.partner;
      if (p) g.rel(p, 12);
      g.burst('sparkle');
      return `${g.pick(['Turquoise water and zero emails.', 'A city of ancient streets and amazing food.', 'Mountains, hot springs, total reset.'])}${p ? ` ${p.name} loved it.` : ''}`;
    },
  },
  {
    id: 'fly_away', loc: 'airport', name: 'Move to the Countryside', icon: '🌾', desc: 'Start over somewhere quiet.', cat: 'travel', energy: 15, cost: 900, gate: 'lease', region: 'city',
    run: (g) => relocate(g, 'country'),
  },

  // ---- recruiting office
  {
    id: 'enlist', loc: 'base', name: 'Enlist', icon: '🎖️', desc: 'Sign up. 17 needs a parent’s consent.', cat: 'work', energy: 10, gate: 'military',
    when: (g) => g.s.job?.careerId !== 'army',
    lock: (g) => {
      const st = careerStatus(g, CAREER_BY_ID.army);
      if (g.age === 17) return g.s.crime.record.length ? 'Criminal record' : g.s.stats.fitness < 30 ? 'Needs Fitness 30+' : null;
      return st.ok ? null : st.reason ?? 'Not eligible';
    },
    run: (g) => {
      const consent = ageGate('military', g).consent;
      startJob(g, 'army');
      return consent ? 'Your parent signed the consent form. You ship out for basic training.' : 'You raised your right hand and took the oath. Basic training starts now.';
    },
  },

  // ---- rehab
  {
    id: 'rehab_program', loc: 'rehab', name: 'Residential Program', icon: '🏥', desc: '30 days. Big reset.', cat: 'health', energy: 20, cost: 3500, gate: 'rehab', cooldown: 12,
    when: (g) => HABITS.some((h) => habit(g, h) > 0),
    run: (g) => { treat(g, 55); g.stat('mood', 8); g.stat('health', 8); g.milestone('Completed a rehab program'); return 'Thirty days of honesty. You walked out lighter.'; },
  },
  {
    id: 'outpatient', loc: 'rehab', name: 'Support Group', icon: '🤝', desc: 'Weekly meetings. Free.', cat: 'health', energy: 8, gate: 'rehab', phases: ['evening'],
    when: (g) => HABITS.some((h) => habit(g, h) > 0),
    run: (g) => { treat(g, 12); g.stat('mood', 4); return 'You shared your story. People nodded. You weren’t alone.'; },
  },

  // ---- community service (court ordered)
  {
    id: 'community_service', loc: 'church', name: 'Community Service', icon: '🧹', desc: 'Court-ordered hours.', cat: 'faith', energy: 18, phases: ['evening'],
    when: (g) => g.flag('serviceLeft') > 0,
    run: (g) => {
      const left = g.inc('serviceLeft', -1);
      g.karma(2);
      if (left <= 0) { g.setFlag('serviceSkips', 0); return 'Final session done. The court considers it complete.'; }
      return `${g.pick(['Picked up litter along the river.', 'Sorted donations at the food bank.', 'Painted over graffiti.'])} ${left} session${left > 1 ? 's' : ''} left.`;
    },
  },
  {
    id: 'hosp_volunteer', loc: 'hospital', name: 'Volunteer', icon: '🫶', desc: 'Karma + med school applications.', cat: 'faith', energy: 15, phases: DAY, minAge: 14,
    run: (g) => { g.karma(3); g.stat('charm', 0.8); const n = g.inc('medVolunteer'); return n === 5 ? 'Five shifts in. The volunteer coordinator offered you a reference letter.' : 'You helped patients find their way and kept them company.'; },
  },
];

