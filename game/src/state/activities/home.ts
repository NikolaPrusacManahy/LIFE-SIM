import { fmt } from '../systems/finance';
import { EVE, NIGHT, NOT_NIGHT, type ActivityDef } from './types';
import { maybeMeet, studyPerf } from './helpers';
import { ground, grounded, riskCatch } from '../systems/trouble';
import { consume } from '../systems/addiction';
import { settings } from '../settings';
import { askForPhone } from '../systems/phone';

export const HOME_ACTS: ActivityDef[] = [
  {
    id: 'sleep', loc: 'home', name: 'Sleep', icon: '😴', desc: 'Recharge for tomorrow.', cat: 'rest', energy: 0, phases: NIGHT,
    run: (g) => {
      const homeless = g.s.housing === 'homeless';
      const lux = ['loft', 'mansion', 'ranch'].includes(g.s.housing);
      g.stat('energy', homeless ? 45 : lux ? 85 : 70);
      g.stat('health', homeless ? -1 : 1);
      if (homeless) g.stat('mood', -3);
      if (lux) g.stat('mood', 2);
      g.burst('zzz');
      return homeless
        ? g.pick(['You slept on cardboard under a bridge.', 'A shelter cot. Someone snored all night.'])
        : g.pick(['Out like a light.', 'You dreamed you could fly.', 'Eight solid hours.', 'You slept like a baby.']);
    },
  },
  {
    id: 'nap', loc: 'home', name: 'Nap', icon: '🛌', desc: 'Quick recharge.', cat: 'rest', energy: 0, phases: NOT_NIGHT,
    run: (g) => {
      g.stat('energy', 28);
      g.burst('zzz');
      return g.pick(['A glorious power nap.', 'You napped way longer than planned.']);
    },
  },
  {
    id: 'relax', loc: 'home', name: 'Chill & Scroll', icon: '📺', desc: 'TV, memes, decompress.', cat: 'rest', energy: 0,
    run: (g) => {
      g.stat('energy', 6);
      g.stat('mood', 5);
      return g.pick(['Three episodes in a row.', 'A video rabbit hole about deep-sea fish.', 'Memes. So many memes.']);
    },
  },
  {
    id: 'homework', loc: 'home', name: 'Study at Home', icon: '📖', desc: 'Grades up, mood down.', cat: 'study', energy: 15,
    when: (g) => !!g.s.education.current,
    run: (g) => {
      studyPerf(g, 4);
      g.stat('smarts', 2);
      g.stat('mood', -2);
      return g.pick(['Every assignment done.', 'Flashcards until your eyes crossed.', 'It finally clicked.']);
    },
  },
  {
    id: 'gaming', loc: 'home', name: 'Video Games', icon: '🎮', desc: 'One more match...', cat: 'fun', energy: 8,
    run: (g) => {
      g.stat('mood', 8);
      g.stat('creativity', 0.6);
      g.stat('smarts', 0.4);
      return g.pick(['A 12-win streak.', 'Rage-quit. Came back. Won.', 'You built a castle in a block game.']);
    },
  },
  {
    id: 'family_dinner', loc: 'home', name: 'Family Dinner', icon: '🍲', desc: 'Bond with family.', cat: 'social', energy: 5, phases: EVE,
    when: (g) => g.livesWithParents && g.parents.length > 0,
    run: (g) => {
      for (const p of g.peopleBy('mother', 'father', 'sibling')) g.rel(p, 4);
      g.stat('mood', 4);
      return g.pick(['Mom made her famous lasagna.', 'Dad told the same joke again. You laughed anyway.', 'Loud, warm, chaotic.']);
    },
  },
  {
    id: 'chores', loc: 'home', name: 'Do Chores', icon: '🧽', desc: 'Pocket money & goodwill.', cat: 'money', energy: 12, maxAge: 21,
    when: (g) => g.livesWithParents && g.parents.length > 0,
    run: (g) => {
      const amt = g.s.background === 'rich' ? 80 : g.s.background === 'middle' ? 40 : 15;
      g.money(amt);
      for (const p of g.parents) g.rel(p, 3);
      return `You scrubbed, swept, and earned ${fmt(amt)}.`;
    },
  },
  {
    id: 'ask_phone', loc: 'home', name: 'Ask for a Phone', icon: '📱', desc: 'Either parent can say yes.', cat: 'social', energy: 4, cooldown: 12, maxAge: 17,
    when: (g) => g.livesWithParents && g.parents.length > 0 && !g.has('phone') && !g.flag('phoneAllowed'),
    run: (g) => askForPhone(g),
  },
  {
    id: 'home_workout', loc: 'home', name: 'Home Workout', icon: '🤸', desc: 'Push-ups in the living room.', cat: 'fitness', energy: 15,
    run: (g) => {
      g.stat('fitness', 2);
      g.stat('health', 0.5);
      return 'Push-ups until your arms gave out.';
    },
  },
  {
    id: 'code', loc: 'home', name: 'Code a Side Project', icon: '👨‍💻', desc: 'Become a self-taught dev.', cat: 'study', energy: 15,
    lock: (g) => (g.has('laptop') ? null : 'Needs a laptop'),
    run: (g) => {
      g.stat('smarts', 2);
      g.stat('creativity', 1.5);
      const c = g.inc('coder', 3);
      if (c >= 30 && !g.flag('coderUnlocked')) {
        g.setFlag('coderUnlocked');
        g.milestone('Became a self-taught programmer');
        return 'Your app works! You could land a dev job with these skills.';
      }
      if (c > 40 && g.chance(0.12)) {
        const amt = g.rand(300, 2500);
        g.money(amt);
        g.burst('coins');
        return `A freelance client paid you ${fmt(amt)} for a website.`;
      }
      return g.pick(['You fixed one bug and made three.', 'Built a little game.', 'Stack Overflow saved you again.']);
    },
  },
  {
    id: 'guitar', loc: 'home', name: 'Practice Guitar', icon: '🎸', desc: 'Creativity up.', cat: 'fun', energy: 10,
    lock: (g) => (g.has('guitar') ? null : 'Needs a guitar'),
    run: (g) => {
      g.stat('creativity', 2.5);
      g.stat('mood', 3);
      if (g.s.job?.careerId === 'musician') g.s.job.perf = Math.min(100, g.s.job.perf + 3);
      return g.pick(['You learned a new riff.', 'Wrote half a song.', 'Your neighbors banged on the wall.']);
    },
  },
  {
    id: 'write', loc: 'home', name: 'Write', icon: '✍️', desc: 'Stories, journals, poems.', cat: 'fun', energy: 10,
    run: (g) => {
      g.stat('creativity', 2);
      g.stat('smarts', 0.5);
      g.stat('mood', 2);
      return g.pick(['You filled ten pages.', 'A short story came together.', 'You journaled about your life.']);
    },
  },
  {
    id: 'garden', loc: 'home', name: 'Gardening', icon: '🌻', desc: 'Peaceful and grounding.', cat: 'fun', energy: 10, phases: NOT_NIGHT,
    when: (g) => ['house', 'farmhouse', 'ranch', 'mansion'].includes(g.s.housing) || (g.livesWithParents && g.s.region === 'country'),
    run: (g) => {
      g.stat('mood', 5);
      g.stat('health', 1);
      return g.isWinter ? 'You planned next spring’s beds.' : 'Tomatoes are coming in nicely.';
    },
  },
  {
    id: 'host_party', loc: 'home', name: 'Host a Party', icon: '🎉', desc: 'Your place, your crowd.', cat: 'social', energy: 20, cost: 150, phases: ['evening', 'night'],
    minAge: 18,
    when: (g) => !g.livesWithParents && g.s.housing !== 'homeless',
    run: (g) => {
      g.stat('mood', 10);
      g.stat('charm', 2);
      for (const p of g.peopleBy('friend')) g.rel(p, 5);
      if (g.chance(0.4)) g.addPerson('friend', { rel: 45, met: 'Your party' });
      g.burst('confetti');
      return 'Your place was packed. People will talk about this one.';
    },
  },
  // ---- Update 0.3
  {
    id: 'sneak_out', loc: 'home', name: 'Sneak Out', icon: '🪟', desc: 'Out the window, into the night.', cat: 'fun', energy: 12, phases: NIGHT, maxAge: 17,
    when: (g) => g.livesWithParents && g.parents.length > 0,
    preview: (g) => [`Caught ${grounded(g) ? 45 : 25}%`],
    run: (g) => {
      g.stat('mood', 9);
      g.stat('street', 1);
      maybeMeet(g, 0.06, 'a midnight adventure');
      if (g.chance(grounded(g) ? 0.45 : 0.25)) {
        ground(g, 1);
        for (const p of g.parents) g.rel(p, -6);
        return 'Your parent was waiting at the bottom of the window. Grounded for another month.';
      }
      return g.pick(['You rode bikes to the all-night diner.', 'Rooftop, stars, and terrible ideas. Perfect.', 'You made it back before sunrise. Barely.']);
    },
  },
  {
    id: 'argue_parents', loc: 'home', name: 'Argue with Parents', icon: '😤', desc: 'Say what you really think.', cat: 'social', energy: 8, maxAge: 30,
    when: (g) => g.livesWithParents && g.parents.length > 0,
    run: (g) => {
      g.stat('mood', -3);
      g.inc('independence');
      for (const p of g.parents) g.rel(p, -6);
      return g.pick(['"You never listen!" — the classic.', 'You won the argument. It didn’t feel like winning.', 'Doors were slammed. Feelings were had.']);
    },
  },
  {
    id: 'liquor_cabinet', loc: 'home', name: 'Raid the Liquor Cabinet', icon: '🥃', desc: 'They won’t notice. Probably.', cat: 'fun', energy: 6, gate: 'alcohol', legality: 'illegalUnder21', cooldown: 4,
    when: (g) => g.livesWithParents && g.parents.length > 0,
    preview: (g) => (g.age < 21 ? ['Caught 30%'] : []),
    run: (g) => {
      consume(g, 'alcohol', 4);
      g.stat('mood', 6);
      g.stat('health', -1);
      if (g.age < 18 && riskCatch(g, 0.3, { name: 'Drinking at home', sev: 1, kind: 'alcohol', by: 'parents' })) return 'You heard footsteps on the stairs…';
      if (g.age < 21 && g.chance(0.3)) {
        for (const p of g.parents) g.rel(p, -5);
        return 'Your parent noticed the bottle was lighter. Awkward breakfast.';
      }
      return 'A few sips of the good stuff. Warm and fuzzy.';
    },
  },
  {
    id: 'all_nighter', loc: 'home', name: 'Game All Night', icon: '🕹️', desc: 'Mood up, energy way down.', cat: 'fun', energy: 30, phases: NIGHT,
    run: (g) => {
      g.stat('mood', 12);
      g.stat('creativity', 0.5);
      return 'You saw the sunrise through the blinds. Worth it?';
    },
  },
  {
    id: 'learn_cook', loc: 'home', name: 'Learn to Cook', icon: '🍳', desc: 'Cheaper food once you live alone.', cat: 'study', energy: 10,
    run: (g) => {
      const n = g.inc('cook');
      g.stat('creativity', 1);
      if (n === 10) {
        g.milestone('Became a confident home cook');
        return 'You can actually cook now. Your grocery bill will thank you.';
      }
      return n < 10 ? `${g.pick(['Scrambled eggs, mostly unburnt.', 'Your first real pasta sauce.', 'Stir-fry! The smoke alarm only went off once.'])} (${n}/10)` : 'You cooked a feast.';
    },
  },
  { id: 'move_out', loc: 'home', name: 'Move Out', icon: '📦', desc: 'Find a place of your own.', cat: 'panel', energy: 0, panel: 'housing', gate: 'lease', when: (g) => g.livesWithParents, run: () => '' },
  // ---- Update 0.4
  {
    id: 'reflect', loc: 'home', name: 'Think About Who You Are', icon: '💭', desc: 'Identity, at your own pace.', cat: 'rest', energy: 4, cooldown: 24,
    when: (g) => g.s.sexuality === 'unsure',
    run: (g) => {
      g.queue('settle_sexuality', {}, true);
      return 'You lay on your bed and let yourself think honestly.';
    },
  },
  {
    id: 'me_time', loc: 'home', name: 'Me Time', icon: '🛁', desc: 'Private time. (18+)', cat: 'rest', energy: 0, gate: 'intimacy', phases: ['evening', 'night'], cooldown: 4,
    when: (g) => settings.mature && g.s.housing !== 'homeless' && !g.livesWithParents,
    run: (g) => {
      g.stat('mood', 8);
      g.stat('energy', 6);
      if (g.s.housing === 'shared' && g.s.people.some((p) => p.labels.includes('roommate')) && g.chance(0.15)) g.queue('walkin');
      return 'Some private time to yourself. Fade to black.';
    },
  },
  {
    id: 'explore_self', loc: 'home', name: 'Explore What You Like', icon: '🔍', desc: 'Self-discovery. (18+)', cat: 'rest', energy: 4, gate: 'intimacy', cooldown: 24,
    when: () => settings.mature,
    run: (g) => {
      g.queue('self_discovery', {}, true);
      return 'You spent some honest time figuring yourself out.';
    },
  },
];
