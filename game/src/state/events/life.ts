import { startJob, careerStatus } from '../systems/career';
import { CAREER_BY_ID } from '../data/careers';
import { ensureRoommate, fmt, moveInto, netWorth } from '../systems/finance';
import { relocate } from '../activities/travel';
import { checkHint, type EventDef } from './types';

export const LIFE_EVENTS: EventDef[] = [
  {
    id: 'adulthood', title: 'You’re 18', icon: '🗝️',
    text: () => 'Legally an adult. Unlocked: leases, credit cards, voting, tattoos, the lottery, enlisting, dating apps — and your juvenile record is sealed. Your parents raise an eyebrow at breakfast: "So… what’s the plan?"',
    choices: [
      { label: 'Stay at home for now', when: (g) => g.livesWithParents && g.parents.length > 0, run: (g) => { for (const p of g.parents) g.rel(p, 2); return 'Free rent and home cooking. Smart.'; } },
      { label: 'Move into a shared flat', hint: (g) => `Rent ${fmt(g.s.region === 'city' ? 750 : 400)}/mo`, when: (g) => g.livesWithParents, run: (g) => {
        const r = moveInto(g, 'shared');
        if (g.s.housing !== 'shared') { g.s.housing = 'shared'; g.setFlag('movedOut'); ensureRoommate(g); return 'You couldn’t afford the deposit, so a friend let you crash in their spare room.'; }
        return r;
      } },
      { label: 'Enlist in the Army', when: (g) => careerStatus(g, CAREER_BY_ID.army).ok, run: (g) => { startJob(g, 'army'); return 'You shipped out to basic training.'; } },
      { label: 'Take a gap year', run: (g) => { g.stat('mood', 10); g.stat('creativity', 2); return 'No plan is also a plan.'; } },
    ],
  },
  {
    id: 'midlife', title: 'Midlife Crisis', icon: '🏎️',
    text: (g) => `You’re ${g.age}. You look in the mirror and wonder: is this it?`,
    choices: [
      { label: 'Buy a sports car', req: (g) => (g.canAfford(185000) ? null : 'Need $185,000'), run: (g) => { g.money(-185000); g.give('sportscar'); g.stat('mood', 20); return 'Vroom. Crisis averted.'; } },
      { label: 'Train for a marathon', run: (g) => { g.stat('fitness', 8); g.stat('health', 5); g.stat('mood', 10); return 'Mile 26. Tears. Medal.'; } },
      { label: 'Book a solo trip ($3,000)', req: (g) => (g.canAfford(3000) ? null : 'Need $3,000'), run: (g) => { g.money(-3000); g.stat('mood', 18); g.stat('creativity', 3); return 'You found yourself somewhere in the mountains.'; } },
      { label: 'Accept it with grace', run: (g) => { g.stat('mood', 5); g.stat('smarts', 1); return 'Life is good, actually.'; } },
    ],
  },
  {
    id: 'reflection', title: (_g, c) => `Turning ${c.age}`, icon: '🪞',
    text: (g) => {
      const job = g.s.job ? CAREER_BY_ID[g.s.job.careerId].levels[g.s.job.level].title : 'no job';
      const kids = g.peopleBy('child').length;
      return `Another decade. You’re ${g.age}, working as ${job}, worth ${fmt(netWorth(g))}${kids ? `, with ${kids} kid${kids > 1 ? 's' : ''}` : ''}. How do you feel?`;
    },
    choices: [
      { label: 'Proud', run: (g) => { g.stat('mood', 8); return 'You’ve come a long way.'; } },
      { label: 'Restless — time for change', run: (g) => { g.stat('mood', 2); g.stat('creativity', 2); return 'Something new is coming. You can feel it.'; } },
    ],
  },
  {
    id: 'depression', title: 'Dark Days', icon: '🌧️',
    text: () => 'Getting out of bed feels impossible lately. Everything is grey.',
    choices: [
      { label: 'See a therapist ($120)', req: (g) => (g.canAfford(120) ? null : 'Need $120'), run: (g) => { g.money(-120); g.stat('mood', 22); return 'It’s a start. A real one.'; } },
      { label: 'Call a friend', req: (g) => (g.peopleBy('friend', 'partner', 'spouse', 'mother', 'father', 'sibling').length ? null : 'No one to call'), run: (g) => { g.stat('mood', 14); return 'They came over with soup and stayed all night.'; } },
      { label: 'Push through alone', run: (g) => { g.stat('mood', 4); g.stat('health', -3); return 'One day at a time.'; } },
    ],
  },
  {
    id: 'health_crisis', title: 'Health Scare', icon: '🚑',
    text: () => 'You collapse. You wake up in a hospital bed, hooked to machines.',
    choices: [
      { label: 'Get full treatment', hint: 'Bills may go to debt', run: (g) => { const bill = g.age < 18 ? 0 : 6000; g.money(-bill); g.stat('health', 35); return bill ? `The bill: ${fmt(bill)}. But you’re alive.` : 'Your parents’ insurance covered it.'; } },
      { label: 'Check yourself out', run: (g) => { g.stat('health', 5); if (g.chance(0.15)) { g.die('Ignored a serious illness'); return 'You shouldn’t have left.'; } return 'You walked out against medical advice.'; } },
    ],
  },
  {
    id: 'evicted', title: 'Evicted', icon: '🚪',
    text: () => 'Three months behind. A notice is taped to your door. You have 24 hours.',
    choices: [
      { label: 'Move back with family', when: (g) => g.parents.some((p) => p.rel >= 35), run: (g) => { g.s.housing = 'parents'; g.stat('mood', -10); return 'Your old bedroom. Same posters.'; } },
      { label: 'Hit the streets', run: (g) => { g.s.housing = 'homeless'; g.stat('mood', -20); g.fx({ type: 'shake', power: 6 }); return 'Everything you own fits in one bag.'; } },
    ],
  },
  {
    id: 'debt_collectors', title: 'Debt Collectors', icon: '📞',
    text: (g) => `They keep calling. You owe ${fmt(g.s.debt)}.`,
    choices: [
      { label: 'Pay $1,000 now', req: (g) => (g.canAfford(1000) ? null : 'Need $1,000'), run: (g) => { g.money(-1000); g.s.debt = Math.max(0, g.s.debt - 1000); return 'They backed off. For now.'; } },
      { label: 'Negotiate', hint: checkHint('charm', 55), run: (g) => { if (g.check('charm', 55)) { g.s.debt = Math.round(g.s.debt * 0.8); return 'They knocked 20% off.'; } g.stat('mood', -5); return 'They hung up on you.'; } },
      { label: 'Ignore them', run: (g) => { g.stat('mood', -6); g.s.debt = Math.round(g.s.debt * 1.05); return 'Late fees piled up.'; } },
    ],
  },
  {
    id: 'bankruptcy', title: 'Rock Bottom', icon: '📉',
    text: (g) => `Your debt hit ${fmt(g.s.debt)}. A lawyer says bankruptcy is an option.`,
    choices: [
      { label: 'Declare bankruptcy', run: (g) => { g.s.debt = 0; g.money(-g.s.money); g.setFlag('bankrupt'); g.stat('mood', -10); g.milestone('Declared bankruptcy'); return 'A clean slate. A wrecked credit score.'; } },
      { label: 'Keep fighting', run: (g) => { g.stat('mood', -4); return 'You’ll claw your way out.'; } },
    ],
  },
  // ---------------- random
  {
    id: 'phone_gift', title: 'A Surprise Box', icon: '📱',
    text: (g) => `${g.parents.find((p) => p.rel >= 70)?.name ?? 'Your parent'} slides a small box across the table. "We think you’re ready."`,
    random: { when: (g) => g.age < 18 && g.livesWithParents && !g.has('phone') && g.parents.some((p) => p.rel >= 70), once: true, weight: 0.8 },
    choices: [
      { label: 'Open it!', run: (g) => { g.give('phone'); g.setFlag('phoneAllowed'); g.stat('mood', 12); g.burst('sparkle'); g.milestone('Got your first phone'); for (const p of g.parents) g.rel(p, 4); return 'A phone! Your own phone!'; } },
    ],
  },
  {
    id: 'found_wallet', title: 'Found Wallet', icon: '👛',
    text: () => 'A fat wallet on the sidewalk. $200 cash and an ID inside.',
    random: { when: (g) => g.age >= 10 },
    choices: [
      { label: 'Return it', run: (g) => { g.karma(6); if (g.chance(0.4)) { g.money(100); return 'The owner gave you $100 as thanks!'; } return 'The owner thanked you warmly.'; } },
      { label: 'Keep the cash', run: (g) => { g.money(200); g.karma(-6); return 'Finders keepers.'; } },
    ],
  },
  {
    id: 'stray_dog', title: 'A Stray Dog', icon: '🐕',
    text: () => 'A scruffy dog follows you home, tail wagging like crazy.',
    random: { when: (g) => !g.has('dog') && g.s.housing !== 'homeless', once: true },
    choices: [
      { label: 'Adopt them', run: (g) => { g.give('dog'); g.stat('mood', 12); g.burst('hearts'); return 'You named them Biscuit. Best friend acquired.'; } },
      { label: 'Take them to a shelter', run: (g) => { g.karma(2); return 'They’ll find a good home.'; } },
    ],
  },
  {
    id: 'viral_moment', title: 'You Went Viral', icon: '📈',
    text: () => 'A video of you doing something ridiculous has a million views overnight.',
    random: { when: (g) => g.age >= 13 && g.s.fame < 60, weight: 0.5 },
    choices: [
      { label: 'Lean into it', run: (g) => { g.fame(8); g.stat('charm', 2); return 'Interviews, memes, a brand deal email.'; } },
      { label: 'Log off and hide', run: (g) => { g.fame(2); g.stat('mood', -2); return 'Fifteen minutes passed.'; } },
    ],
  },
  {
    id: 'flu', title: 'Flu Season', icon: '🤒',
    text: () => 'Fever, chills, a nose like a faucet.',
    random: { when: (g) => g.isWinter, cooldown: 36 },
    choices: [
      { label: 'Rest it off', run: (g) => { g.stat('health', -3); g.stat('energy', -10); return 'Three days of soup and cartoons.'; } },
      { label: 'Power through', run: (g) => { g.stat('health', -8); if (g.s.job) g.s.job.perf += 2; return 'You infected half the building. Heroic?'; } },
    ],
  },
  {
    id: 'scam_call', title: 'Suspicious Call', icon: '☎️',
    text: () => '"This is your bank. We need your account number to stop fraud."',
    random: { when: (g) => g.age >= 18 && g.s.money > 500 },
    choices: [
      { label: 'Hang up', run: (g) => { g.stat('smarts', 0.5); return 'Nice try.'; } },
      { label: 'Give them the info', run: (g) => { const loss = Math.min(g.s.money, 2000); g.money(-loss); g.stat('mood', -10); return `It was a scam. ${fmt(loss)} gone.`; } },
    ],
  },
  {
    id: 'hot_tip', title: 'A Hot Stock Tip', icon: '💹',
    text: () => 'A guy at the gym swears a tiny company is about to explode. "Put in $2k. Trust me."',
    random: { when: (g) => g.age >= 18 && g.s.money >= 2000, weight: 0.7 },
    choices: [
      { label: 'Invest $2,000', run: (g) => { g.money(-2000); if (g.chance(0.35)) { g.money(6500); g.burst('coins'); return 'It tripled! You cashed out $6,500.'; } return 'The company went bankrupt. Lesson learned.'; } },
      { label: 'Pass', run: () => 'You kept your money. Probably wise.' },
    ],
  },
  {
    id: 'county_fair', title: 'County Fair', icon: '🎡',
    text: () => 'Funnel cakes, a Ferris wheel, and the annual pie contest.',
    random: { when: (g) => g.s.region === 'country' && g.isSummer, cooldown: 40 },
    choices: [
      { label: 'Enter the pie contest', hint: checkHint('creativity', 50), run: (g) => { if (g.check('creativity', 50)) { g.money(250); g.burst('confetti'); return 'Blue ribbon! $250 prize.'; } return 'The judges were polite.'; } },
      { label: 'Ride the Ferris wheel', run: (g) => { g.stat('mood', 8); if (g.partner) g.rel(g.partner, 8); return 'The whole county glowed below you.'; } },
    ],
  },
  {
    id: 'city_dreams', title: 'City Lights', icon: '🌃',
    text: () => 'You watch a movie set in the big city. You can’t stop thinking about it.',
    random: { when: (g) => g.s.region === 'country' && g.age >= 15 && g.age <= 30, once: true },
    choices: [
      { label: 'Pack your bags ($1,200)', when: (g) => g.age >= 18, req: (g) => (g.canAfford(1200) ? null : 'Need $1,200'), run: (g) => { g.money(-1200); return relocate(g, 'city'); } },
      { label: 'Someday…', run: (g) => { g.stat('creativity', 1); return 'You put a skyline poster on your wall.'; } },
    ],
  },
  {
    id: 'blackout', title: 'Citywide Blackout', icon: '🕯️',
    text: () => 'The whole city goes dark. Neighbors gather on the stoops with candles.',
    random: { when: (g) => g.s.region === 'city' && g.phase !== 'morning' },
    choices: [
      { label: 'Join the neighbors', run: (g) => { g.stat('mood', 6); if (g.chance(0.5)) g.addPerson('friend', { rel: 45, met: 'Blackout' }); return 'Stories by candlelight. Strangers became neighbors.'; } },
      { label: 'Read by flashlight', run: (g) => { g.stat('smarts', 1.5); return 'Quiet. Cozy.'; } },
    ],
  },
  {
    id: 'car_trouble', title: 'Car Trouble', icon: '🛠️',
    text: () => 'Smoke pours from under the hood on the highway.',
    random: { when: (g) => g.has('car') || g.has('truck') },
    choices: [
      { label: 'Mechanic ($800)', req: (g) => (g.canAfford(800) ? null : 'Need $800'), run: (g) => { g.money(-800); return 'Good as new.'; } },
      { label: 'Fix it yourself', hint: checkHint('smarts', 50), run: (g) => { if (g.check('smarts', 50)) { g.stat('smarts', 1); return 'A YouTube video and a wrench. Fixed!'; } g.money(-Math.min(g.s.money, 1400)); return 'You made it worse. Much worse.'; } },
    ],
  },
  {
    id: 'hero_moment', title: 'Someone’s in Danger', icon: '🦸',
    text: () => 'A kid slips off the dock into deep water. Nobody else is moving.',
    random: { when: (g) => g.age >= 14, once: true, weight: 0.4 },
    choices: [
      { label: 'Dive in', hint: checkHint('fitness', 40), run: (g) => { if (g.check('fitness', 40)) { g.karma(15); g.fame(5); g.achieve('hero'); g.burst('sparkle'); return 'You pulled them out. The local news called you a hero.'; } g.stat('health', -10); g.karma(8); return 'You both made it out, barely. You swallowed half the lake.'; } },
      { label: 'Shout for help', run: (g) => { g.karma(2); return 'A lifeguard got there in time.'; } },
    ],
  },
];
