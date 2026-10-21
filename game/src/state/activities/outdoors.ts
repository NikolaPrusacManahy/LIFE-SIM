import { fmt } from '../systems/finance';
import { DAY, LATE, NIGHT, NOT_NIGHT, type ActivityDef } from './types';
import { riskCatch } from '../systems/trouble';
import { consume } from '../systems/addiction';
import { settings } from '../settings';
import { canBeIntimate } from '../systems/intimacy';
import { curfew, maybeMeet, pct, studyPerf } from './helpers';
import { legalAge } from '../rules/us';

/** Park, gym, library, hospital, church, and the countryside outdoors. */
export const OUTDOOR_ACTS: ActivityDef[] = [
  // ---- park (city)
  {
    id: 'jog', loc: 'park', name: 'Go for a Run', icon: '🏃', desc: 'Fitness & fresh air.', cat: 'fitness', energy: 18, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('fitness', 3);
      g.stat('health', 1);
      g.stat('mood', 2);
      return g.isWinter ? 'A frosty 5K. Lungs burning, brain clear.' : 'You ran along the river at golden hour.';
    },
  },
  {
    id: 'hoops', loc: 'park', name: 'Pickup Basketball', icon: '🏀', desc: 'Make friends, get buckets.', cat: 'fitness', energy: 20, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('fitness', 2.5);
      g.stat('charm', 1);
      if (g.chance(0.15)) {
        const f = g.addPerson('friend', { rel: 40, met: 'Basketball court' });
        return `You and ${f.name} dominated the court. New friend.`;
      }
      return g.pick(['You hit a buzzer-beater.', 'You got crossed up. Badly.']);
    },
  },
  {
    id: 'picnic', loc: 'park', name: 'Lie in the Grass', icon: '🧺', desc: 'Do nothing, beautifully.', cat: 'rest', energy: 0, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('energy', 10);
      g.stat('mood', 6);
      maybeMeet(g, 0.05, 'the park');
      return g.isWinter ? 'Snow angels. You’re never too old.' : 'Clouds shaped like dragons drifted by.';
    },
  },
  {
    id: 'sketch', loc: 'park', name: 'Sketch Outdoors', icon: '🎨', desc: 'Creativity up.', cat: 'fun', energy: 10, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('creativity', 2.5);
      g.stat('mood', 3);
      return 'You sketched the fountain. Not bad at all.';
    },
  },
  {
    id: 'stargaze', loc: 'park', name: 'Stargaze', icon: '🔭', desc: 'Feel small, in a nice way.', cat: 'fun', energy: 6, phases: NIGHT,
    run: (g) => {
      g.stat('mood', 6);
      g.stat('smarts', 0.6);
      curfew(g);
      return 'You found Orion and felt very philosophical.';
    },
  },

  // ---- gym (both)
  {
    id: 'workout', loc: 'gym', name: 'Lift Weights', icon: '🏋️', desc: 'Get strong.', cat: 'fitness', energy: 22, cost: 12,
    run: (g) => {
      g.stat('fitness', 4);
      g.stat('looks', 0.8);
      g.stat('health', 0.5);
      return g.pick(['New personal record!', 'Leg day. You can’t feel your legs.', 'Someone asked for your routine.']);
    },
  },
  {
    id: 'boxing', loc: 'gym', name: 'Boxing Class', icon: '🥊', desc: 'Fitness + confidence.', cat: 'fitness', energy: 26, cost: 20, minAge: 14,
    run: (g) => {
      g.stat('fitness', 3.5);
      g.stat('street', 1);
      g.stat('mood', 3);
      return 'Jab, jab, cross. You’re getting fast.';
    },
  },
  {
    id: 'yoga', loc: 'gym', name: 'Yoga', icon: '🧘', desc: 'Body & mind.', cat: 'health', energy: 10, cost: 15,
    run: (g) => {
      g.stat('health', 2);
      g.stat('mood', 4);
      g.stat('fitness', 1);
      return 'Namaste. You feel ten years younger.';
    },
  },
  {
    id: 'swim_pool', loc: 'gym', name: 'Swim Laps', icon: '🏊', desc: 'Low impact, high reward.', cat: 'fitness', energy: 18, cost: 8,
    run: (g) => {
      g.stat('fitness', 3);
      g.stat('health', 1.5);
      return '40 laps. You’re basically a dolphin.';
    },
  },

  // ---- library (both)
  {
    id: 'admissions', loc: 'library', name: 'Admissions Desk', icon: '🎓', desc: 'Apply to programs.', cat: 'panel', energy: 0, panel: 'school', run: () => '',
  },
  {
    id: 'study_lib', loc: 'library', name: 'Study', icon: '📘', desc: 'Smarts up.', cat: 'study', energy: 15, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('smarts', 3);
      studyPerf(g, 2.5);
      return g.pick(['You read a whole textbook chapter.', 'Silence. Focus. Progress.', 'You learned something wild about octopuses.']);
    },
  },
  {
    id: 'read_novel', loc: 'library', name: 'Read a Novel', icon: '📕', desc: 'Escape for a while.', cat: 'fun', energy: 6, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('creativity', 2);
      g.stat('mood', 4);
      g.stat('smarts', 0.8);
      return g.pick(['A mystery with a twist you never saw coming.', 'An epic fantasy. You cried at the end.', 'Poetry. Surprisingly good.']);
    },
  },
  {
    id: 'ged', loc: 'library', name: 'GED Class', icon: '📝', desc: 'Get your diploma equivalent.', cat: 'study', energy: 15, phases: NOT_NIGHT,
    minAge: 16,
    when: (g) => !g.hasDegree('hs') && !g.hasDegree('ged') && g.s.education.current?.program !== 'hs',
    run: (g) => {
      g.stat('smarts', 2);
      const n = ++g.s.education.gedStudy;
      if (n >= 8) {
        if (g.check('smarts', 35)) {
          g.s.education.degrees.push('ged');
          g.burst('confetti');
          g.milestone('Earned a GED');
          return 'You passed the GED exam! Doors are opening.';
        }
        g.s.education.gedStudy = 5;
        return 'You failed the GED exam. A few more classes, then retake it.';
      }
      return `GED prep: ${n}/8 sessions.`;
    },
  },
  {
    id: 'learn_code', loc: 'library', name: 'Free Coding Course', icon: '⌨️', desc: 'Self-taught path.', cat: 'study', energy: 15, phases: NOT_NIGHT, minAge: 12,
    run: (g) => {
      g.stat('smarts', 2);
      g.inc('coder', 2);
      return 'You wrote your first loops. Then your first bug.';
    },
  },

  // ---- hospital (both)
  {
    id: 'checkup', loc: 'hospital', name: 'Checkup', icon: '🩺', desc: 'Health up.', cat: 'health', energy: 5, phases: DAY,
    cost: (g) => (g.age < 18 ? 0 : 150),
    cooldown: 8,
    run: (g) => {
      g.stat('health', g.s.stats.health < 70 ? 12 : 5);
      return g.s.stats.health > 80 ? 'Clean bill of health.' : 'The doctor said to take better care of yourself.';
    },
  },
  {
    id: 'treatment', loc: 'hospital', name: 'Full Treatment', icon: '💊', desc: 'Serious care for serious problems.', cat: 'health', energy: 10, cost: 2500, phases: DAY,
    when: (g) => g.s.stats.health < 60,
    run: (g) => {
      g.stat('health', 30);
      g.stat('mood', 4);
      return 'A week of treatment. You feel like a new person.';
    },
  },
  {
    id: 'therapy', loc: 'hospital', name: 'Therapy', icon: '🛋️', desc: 'Mood up.', cat: 'health', energy: 6, cost: 120, phases: NOT_NIGHT, minAge: 12,
    run: (g) => {
      g.stat('mood', 14);
      return g.pick(['You talked through a lot. Lighter now.', 'Your therapist asked the question you’d been avoiding.']);
    },
  },
  {
    id: 'donate_blood', loc: 'hospital', name: 'Donate Blood', icon: '🩸', desc: 'Help strangers.', cat: 'faith', energy: 12, phases: DAY, minAge: 17, cooldown: 12,
    run: (g) => {
      g.money(50);
      g.karma(3);
      g.stat('health', -2);
      return 'You got a cookie and a sticker. And saved a life.';
    },
  },
  {
    id: 'surgery', loc: 'hospital', name: 'Cosmetic Surgery', icon: '💉', desc: 'Looks up. Risky.', cat: 'health', energy: 25, cost: 9000, minAge: 18, cooldown: 24,
    run: (g) => {
      if (g.chance(0.85)) {
        g.stat('looks', 14);
        g.burst('sparkle');
        return 'The swelling went down. You look incredible.';
      }
      g.stat('looks', -6);
      g.stat('health', -10);
      g.stat('mood', -10);
      return 'Complications. It’ll take a while to heal.';
    },
  },

  // ---- church (both)
  {
    id: 'service', loc: 'church', name: 'Attend Service', icon: '🙏', desc: 'Peace & community.', cat: 'faith', energy: 6, phases: ['morning'],
    run: (g) => {
      g.karma(2);
      g.stat('mood', 4);
      if (g.chance(0.08)) g.addPerson('friend', { age: g.age + g.rand(-5, 20), rel: 45, met: 'Church' });
      return 'The choir gave you goosebumps.';
    },
  },
  {
    id: 'confess', loc: 'church', name: 'Confession', icon: '🕯️', desc: 'Unburden yourself.', cat: 'faith', energy: 4, cooldown: 8,
    run: (g) => {
      g.karma(g.s.karma < 0 ? 6 : 2);
      g.stat('mood', 5);
      return 'Ten Hail Marys and a lighter heart.';
    },
  },
  {
    id: 'choir', loc: 'church', name: 'Sing in the Choir', icon: '🎶', desc: 'Find your voice.', cat: 'fun', energy: 10, phases: ['evening'],
    run: (g) => {
      g.stat('creativity', 2);
      g.stat('charm', 1);
      g.stat('mood', 4);
      return 'Your solo got a standing ovation from the grandmas.';
    },
  },

  // ---- farm (country)
  {
    id: 'farm_chores', loc: 'farm', name: 'Farm Work', icon: '🐓', desc: 'Hard work, honest pay.', cat: 'money', energy: 22, phases: NOT_NIGHT,
    run: (g) => {
      const amt = g.rand(25, 60);
      g.money(amt);
      g.stat('fitness', 2.5);
      return `${g.pick(['Mucked stalls', 'Bucked hay', 'Fixed fences', 'Fed the pigs'])} and earned ${fmt(amt)}.`;
    },
  },
  {
    id: 'ride_horse', loc: 'farm', name: 'Ride Horses', icon: '🐎', desc: 'Wind in your hair.', cat: 'fun', energy: 14, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('mood', 7);
      g.stat('fitness', 1.5);
      return 'You galloped across the fields at sunset.';
    },
  },
  {
    id: 'harvest', loc: 'farm', name: 'Help with Harvest', icon: '🌽', desc: 'Seasonal big pay.', cat: 'money', energy: 30, phases: DAY,
    when: (g) => g.month >= 7 && g.month <= 9,
    run: (g) => {
      const amt = g.rand(120, 220);
      g.money(amt);
      g.stat('fitness', 3);
      g.burst('coins');
      return `Harvest season! You earned ${fmt(amt)}.`;
    },
  },

  // ---- woods (country)
  {
    id: 'hike', loc: 'woods', name: 'Hike', icon: '🥾', desc: 'Trails & quiet.', cat: 'fitness', energy: 18, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('fitness', 2.5);
      g.stat('mood', 6);
      g.stat('health', 1);
      return g.pick(['A deer crossed the trail ahead of you.', 'You found a hidden waterfall.', 'Pine air and total silence.']);
    },
  },
  {
    id: 'hunt', loc: 'woods', name: 'Go Hunting', icon: '🦌', desc: 'Season permitting.', cat: 'money', energy: 22, minAge: 14,
    when: (g) => g.month >= 9 || g.month <= 0,
    run: (g) => {
      if (g.check('fitness', 40)) {
        const amt = g.rand(80, 200);
        g.money(amt);
        return `A successful hunt. The meat sold for ${fmt(amt)}.`;
      }
      return 'Cold, quiet, and empty-handed.';
    },
  },
  {
    id: 'camp', loc: 'woods', name: 'Camp Out', icon: '🏕️', desc: 'Sleep under the stars.', cat: 'rest', energy: 0, phases: NIGHT,
    run: (g) => {
      g.stat('energy', 50);
      g.stat('mood', 8);
      curfew(g);
      return 'Campfire, s’mores, owl calls.';
    },
  },

  // ---- lake (country)
  {
    id: 'fish', loc: 'lake', name: 'Go Fishing', icon: '🎣', desc: 'Patience pays.', cat: 'fun', energy: 10, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('mood', 5);
      if (g.chance(0.5)) {
        const amt = g.rand(10, 60);
        g.money(amt);
        return `A nice catch — sold for ${fmt(amt)}.`;
      }
      return 'Nothing bit. Still a perfect morning.';
    },
  },
  {
    id: 'swim_lake', loc: 'lake', name: 'Swim / Skate', icon: '🏊', desc: 'Summer swim or winter ice.', cat: 'fitness', energy: 16, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('fitness', 2.5);
      g.stat('mood', 5);
      return g.isWinter ? 'You skated across the frozen lake.' : 'Cannonball off the dock!';
    },
  },
  {
    id: 'bonfire', loc: 'lake', name: 'Lake Bonfire', icon: '🔥', desc: 'Friends, music, night sky.', cat: 'social', energy: 15, phases: NIGHT, minAge: 14,
    run: (g) => {
      g.stat('mood', 9);
      g.stat('charm', 1.5);
      for (const f of g.peopleBy('friend').slice(0, 3)) g.rel(f, 4);
      maybeMeet(g, 0.12, 'a lake bonfire');
      curfew(g);
      return 'Guitars, ghost stories, and the best night of the summer.';
    },
  },
  // ---- Update 0.3: park
  {
    id: 'walk_dog', loc: 'park', name: 'Walk the Dog', icon: '🐕', desc: 'Biscuit is thrilled.', cat: 'fitness', energy: 10, phases: NOT_NIGHT,
    when: (g) => g.has('dog'),
    run: (g) => {
      g.stat('fitness', 1.5);
      g.stat('mood', 6);
      maybeMeet(g, 0.08, 'the dog park');
      return 'Biscuit made three new friends. You made one.';
    },
  },
  {
    id: 'skate', loc: 'park', name: 'Skate / BMX Tricks', icon: '🛹', desc: 'Style points. Injury risk.', cat: 'fitness', energy: 18, phases: NOT_NIGHT,
    risk: (g) => pct(g.statOdds('fitness', 45)),
    run: (g) => {
      g.stat('creativity', 1);
      if (g.check('fitness', 45)) {
        g.stat('fitness', 2.5);
        g.stat('charm', 1);
        g.fame(0.4);
        return 'You landed a kickflip. People filmed it.';
      }
      g.stat('health', -8);
      g.fx({ type: 'shake', power: 4 });
      return 'You ate pavement. Scraped elbows, bruised pride.';
    },
  },
  {
    id: 'drink_park', loc: 'park', name: 'Drink in the Park', icon: '🍾', desc: 'Paper bag, park bench.', cat: 'social', energy: 8, gate: 'alcohol', legality: 'underage', phases: LATE,
    preview: (g) => [g.age < legalAge(g, 'alcohol') ? 'Police 25%' : 'Police 10%'],
    run: (g) => {
      consume(g, 'alcohol', 5);
      g.stat('mood', 7);
      g.stat('health', -1.5);
      if (riskCatch(g, g.age < legalAge(g, 'alcohol') ? 0.25 : 0.1, { name: g.age < legalAge(g, 'alcohol') ? 'Underage drinking' : 'Open container', sev: 1, kind: 'alcohol', by: 'police' })) return 'A flashlight swept across the bench…';
      return 'Cheap drinks under the stars with good company.';
    },
  },
  {
    id: 'meditate', loc: 'park', name: 'Feed Ducks & Meditate', icon: '🦆', desc: 'Calm mind, kind heart.', cat: 'health', energy: 4, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('mood', 7);
      g.karma(1);
      g.stat('health', 0.5);
      return 'The ducks accepted your offering. Inner peace: 12% unlocked.';
    },
  },
  // ---- Update 0.3: gym
  {
    id: 'trainer', loc: 'gym', name: 'Personal Trainer', icon: '🧑‍🏫', desc: 'Expensive, effective.', cat: 'fitness', energy: 28, cost: 60,
    run: (g) => {
      g.stat('fitness', 6);
      g.stat('looks', 1);
      return 'Your trainer pushed you past what you thought you could do.';
    },
  },
  {
    id: 'steroids', loc: 'gym', name: 'Steroids', icon: '💉', desc: 'Huge gains. Huge costs.', cat: 'fitness', energy: 10, cost: 200, gate: 'steroids', legality: 'illegal', cooldown: 4,
    preview: (g) => (g.s.job?.careerId === 'athlete' ? ['Ban risk 30%'] : ['Health −−']),
    run: (g) => {
      g.stat('fitness', 7);
      g.stat('health', -7);
      g.stat('mood', -2);
      g.inc('steroids');
      if (g.s.job?.careerId === 'athlete' && g.chance(0.3)) {
        g.queue('fired', { reason: 'failed a doping test' }, true);
        return 'A random drug test was waiting at practice…';
      }
      return 'Your muscles grew. Your heart did a weird flutter.';
    },
  },
  {
    id: 'compete', loc: 'gym', name: 'Compete', icon: '🥇', desc: 'Powerlifting or amateur boxing.', cat: 'fitness', energy: 30, cost: 40, gate: 'compete', cooldown: 8,
    risk: (g) => pct(g.statOdds('fitness', 60)),
    run: (g) => {
      if (g.check('fitness', 60)) {
        const prize = g.rand(200, 800);
        g.money(prize);
        g.fame(2);
        g.burst('confetti');
        return `You won your division! ${fmt(prize)} prize.`;
      }
      g.stat('health', -4);
      return 'Second place. You’ll be back.';
    },
  },
  // ---- Update 0.3: library
  {
    id: 'lib_jobs', loc: 'library', name: 'Job Hunt (Free PCs)', icon: '🖥️', desc: 'Search openings.', cat: 'panel', energy: 0, panel: 'jobs', run: () => '',
  },
  {
    id: 'tutor_others', loc: 'library', name: 'Tutor Others', icon: '🧑‍🎓', desc: 'Earn by explaining.', cat: 'money', energy: 15, phases: NOT_NIGHT,
    lock: (g) => (g.s.stats.smarts >= 55 ? null : 'Needs Smarts 55'),
    run: (g) => {
      const amt = g.rand(25, 60);
      g.money(amt);
      g.stat('charm', 1);
      g.stat('smarts', 0.5);
      return `Your student finally got it. ${fmt(amt)}.`;
    },
  },
  {
    id: 'write_novel', loc: 'library', name: 'Write a Novel', icon: '📖', desc: 'A long project — 12 sessions.', cat: 'fun', energy: 18, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('creativity', 2.5);
      const n = g.inc('novel');
      if (n >= 12) {
        g.setFlag('novel', 0);
        g.queue('novel_done', {}, true);
        return 'You typed THE END.';
      }
      return `Chapter ${n} of 12 written.`;
    },
  },
  {
    id: 'book_club', loc: 'library', name: 'Book Club', icon: '📚', desc: 'Books and new friends.', cat: 'social', energy: 8, phases: ['evening'],
    run: (g) => {
      g.stat('smarts', 1);
      g.stat('charm', 1);
      if (g.chance(0.2)) {
        const f = g.addPerson('friend', { age: g.age + g.rand(-3, 15), rel: 45, met: 'Book club' });
        return `You and ${f.name} argued about the ending for an hour. New friend!`;
      }
      return 'Everyone hated the protagonist. Great discussion.';
    },
  },
  // ---- Update 0.3: church
  {
    id: 'youth_group', loc: 'church', name: 'Youth Group', icon: '🙌', desc: 'Games, snacks, belonging.', cat: 'social', energy: 10, phases: ['evening'], maxAge: 18,
    run: (g) => {
      g.karma(2);
      g.stat('mood', 5);
      if (g.chance(0.15)) g.addPerson('friend', { rel: 45, met: 'Youth group' });
      return 'Pizza, a talk about kindness, and dodgeball.';
    },
  },
  // ---- Update 0.4 (18+, Mature Content)
  {
    id: 'risky_rendezvous', loc: 'library', name: 'Sneak into the Stacks', icon: '📚', desc: 'Thrilling. Risky. (18+)', cat: 'fun', energy: 10, gate: 'intimacy', cooldown: 12,
    when: (g) => settings.mature && g.s.people.some((p) => canBeIntimate(g, p) && (['dating', 'partner', 'engaged', 'spouse'].includes(p.role) || p.labels.includes('fwb'))),
    preview: () => ['Caught 25%'],
    run: (g) => {
      const p = g.s.people.find((x) => canBeIntimate(g, x) && (['dating', 'partner', 'engaged', 'spouse'].includes(x.role) || x.labels.includes('fwb')));
      if (!p) return '';
      g.stat('mood', 12);
      p.romance = Math.min(100, p.romance + 6);
      if (g.chance(0.25)) {
        g.fame(-2);
        if (g.s.education.current && g.s.education.current.program !== 'hs') g.s.education.current.warnings++;
        riskCatch(g, 1, { name: 'Indecent exposure', sev: 1, kind: 'other', by: 'security' });
        return `You and ${p.name} got caught by campus security. Mortifying.`;
      }
      return `You and ${p.name} slipped between the shelves. Heart racing. Fade to black.`;
    },
  },
];
