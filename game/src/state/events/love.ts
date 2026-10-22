import { firstName } from '../data/names';
import { marriedOff } from '../systems/stalker';
import { fmt } from '../systems/finance';
import { makeBaby } from '../systems/relationships';
import { checkHint, type EventDef } from './types';

export const LOVE_EVENTS: EventDef[] = [
  {
    id: 'meet_someone', title: 'Someone Catches Your Eye', icon: '💘',
    text: (g, c) => `At ${c.where ?? 'town'}, someone keeps glancing your way and smiling.`,
    choices: [
      { label: 'Go say hi', hint: checkHint('charm', 40), run: (g) => {
        const age = Math.max(14, g.age + g.rand(-2, 3));
        const taken = !!g.partner;
        if (g.check('charm', 40) || g.s.stats.looks > 70) {
          const p = g.addPerson(taken ? 'friend' : 'crush', { age, rel: 55, met: 'By chance' });
          g.burst('hearts');
          return taken ? `You and ${p.name} hit it off — as friends.` : `${p.name} gave you their number! 💘`;
        }
        g.stat('mood', -3);
        return 'You tripped over your words. They laughed — kindly.';
      } },
      { label: 'Just smile back', run: (g) => { g.stat('mood', 3); return 'A nice moment. That’s all.'; } },
    ],
  },
  {
    id: 'crush_note', title: 'A Folded Note', icon: '💌',
    text: () => 'A note falls out of your locker: "I like you. Do you like me? ☐ Yes ☐ No"',
    random: { when: (g) => g.s.education.current?.program === 'hs' && !g.partner, once: true },
    choices: [
      { label: 'Check yes', run: (g) => { const p = g.addPerson('partner', { rel: 60, met: 'A note' }); g.burst('hearts'); g.milestone(`First relationship with ${p.name}`); g.setFlag('firstLove'); return `It was ${p.name}. You’re officially together!`; } },
      { label: 'Check no', run: (g) => { g.stat('charm', 0.5); return 'You let them down gently.'; } },
    ],
  },
  {
    id: 'wedding', title: 'Wedding Planning', icon: '💒',
    text: (g, c) => `You and ${g.personById(c.pid)?.name ?? 'your partner'} are getting married! What kind of wedding?`,
    choices: [
      { label: 'Courthouse ($200)', req: (g) => (g.canAfford(200) ? null : 'Need $200'), run: (g, c) => wed(g, c.pid, 200, 5) },
      { label: 'Backyard wedding ($8,000)', req: (g) => (g.canAfford(8000) ? null : 'Need $8,000'), run: (g, c) => wed(g, c.pid, 8000, 12) },
      { label: 'Lavish gala ($45,000)', req: (g) => (g.canAfford(45000) ? null : 'Need $45,000'), run: (g, c) => { g.fame(3); return wed(g, c.pid, 45000, 20); } },
      { label: 'Elope tonight (free)', run: (g, c) => wed(g, c.pid, 0, 8) },
    ],
  },
  {
    id: 'baby_born', title: 'It’s a Baby!', icon: '👶',
    text: (g) => {
      const other = g.s.people.find((p) => p.alive && p.tags.includes('coparent')) ?? g.partner;
      return `After a long night at the hospital, you’re holding your newborn${other ? ` with ${other.name}` : ''}. What’s their name?`;
    },
    choices: (g) => {
      const gender = g.chance(0.5) ? 'male' : 'female';
      const names = [firstName(gender), firstName(gender), firstName(gender)];
      return names.map((n) => ({
        label: n,
        run: (gg) => {
          makeBaby(gg, n).gender = gender;
          gg.stat('mood', 20);
          gg.burst('hearts');
          const other = gg.s.people.find((p) => p.alive && p.tags.includes('coparent')) ?? gg.partner;
          if (other) gg.rel(other, 15);
          for (const p of gg.s.people) p.tags = p.tags.filter((t) => t !== 'coparent');
          return `Welcome to the world, ${n}.`;
        },
      }));
    },
  },
  {
    id: 'breakup', title: 'Trouble in Paradise', icon: '💔',
    text: (g, c) => `${g.personById(c.pid)?.name ?? 'Your partner'} says you’ve drifted apart. They want to end it.`,
    choices: [
      { label: 'Fight for us', hint: checkHint('charm', 60), run: (g, c) => {
        const p = g.personById(c.pid);
        if (!p) return '';
        if (g.check('charm', 60)) { g.rel(p, 30); return 'A long night of honesty. You’re giving it another shot.'; }
        p.role = 'ex';
        g.stat('mood', -15);
        return `${p.name} left anyway.`;
      } },
      { label: 'Let them go', run: (g, c) => { const p = g.personById(c.pid); if (p) p.role = 'ex'; g.stat('mood', -10); return 'It’s over. You’ll be okay. Eventually.'; } },
    ],
  },
  {
    id: 'death_in_family', title: 'A Loss', icon: '🕊️',
    text: (g, c) => {
      const p = g.personById(c.pid);
      return p ? `${p.name}, your ${p.role}, has passed away at ${g.ageOf(p)}.` : 'Someone you loved has passed away.';
    },
    choices: [
      { label: 'Give a eulogy', run: (g, c) => grieve(g, c.pid, true) },
      { label: 'Grieve privately', run: (g, c) => grieve(g, c.pid, false) },
    ],
  },
  // ---------------- random
  {
    id: 'anniversary', title: 'Anniversary', icon: '🌹',
    text: (g) => `It’s your anniversary with ${g.partner?.name}. Did you remember?`,
    random: { when: (g) => g.firstBy('spouse') !== null, cooldown: 48 },
    choices: [
      { label: 'Fancy dinner ($300)', req: (g) => (g.canAfford(300) ? null : 'Need $300'), run: (g) => { g.money(-300); g.rel(g.partner, 12); g.burst('hearts'); return 'Candlelight and old stories.'; } },
      { label: 'Handwritten letter', run: (g) => { g.rel(g.partner, g.s.stats.creativity > 50 ? 12 : 6); return 'They kept it in their nightstand.'; } },
      { label: 'Uh… forgot', run: (g) => { g.rel(g.partner, -15); return 'The couch is your bed tonight.'; } },
    ],
  },
  {
    id: 'kid_trouble', title: 'Teenager Trouble', icon: '🧑',
    text: (g) => `${g.peopleBy('child').find((k) => g.ageOf(k) >= 13 && g.ageOf(k) <= 17)?.name ?? 'Your kid'} got caught skipping school.`,
    random: { when: (g) => g.peopleBy('child').some((k) => g.ageOf(k) >= 13 && g.ageOf(k) <= 17) },
    choices: [
      { label: 'Talk it through', run: (g) => { const k = g.peopleBy('child').find((x) => g.ageOf(x) >= 13); g.rel(k, 6); return 'You listened more than you lectured.'; } },
      { label: 'Ground them', run: (g) => { const k = g.peopleBy('child').find((x) => g.ageOf(x) >= 13); g.rel(k, -8); return 'Phone confiscated. Door slammed.'; } },
    ],
  },
  {
    id: 'friend_needs_help', title: 'A Friend in Need', icon: '🆘',
    text: (g) => `${g.peopleBy('friend')[0]?.name ?? 'A friend'} is behind on rent and asks to borrow $300.`,
    random: { when: (g) => g.peopleBy('friend').length > 0 && g.age >= 16 },
    choices: [
      { label: 'Lend $300', req: (g) => (g.canAfford(300) ? null : 'Need $300'), run: (g) => { g.money(-300); g.rel(g.peopleBy('friend')[0], 15); g.karma(3); if (g.chance(0.6)) { g.queue('repaid'); } return 'They hugged you tight.'; } },
      { label: 'Offer advice instead', run: (g) => { g.rel(g.peopleBy('friend')[0], 2); return 'They nodded politely.'; } },
      { label: 'Say no', run: (g) => { g.rel(g.peopleBy('friend')[0], -10); return 'Things got awkward.'; } },
    ],
  },
  {
    id: 'repaid', title: 'Paid Back', icon: '💵',
    text: () => 'Your friend shows up with an envelope: the $300, plus a little extra.',
    choices: [{ label: 'Nice!', run: (g) => { g.money(350); g.burst('coins'); return 'Good friends exist.'; } }],
  },
  {
    id: 'old_friend', title: 'Blast from the Past', icon: '📱',
    text: () => 'An old friend you haven’t seen in years messages you out of the blue.',
    random: { when: (g) => g.age >= 25 },
    choices: [
      { label: 'Meet up', run: (g) => { const f = g.addPerson('friend', { age: g.age, rel: 60, met: 'Old times' }); g.stat('mood', 8); return `You and ${f.name} talked until the café closed.`; } },
      { label: 'Leave them on read', run: () => 'Some doors stay closed.' },
    ],
  },
  {
    id: 'sibling_favor', title: 'Sibling Asks a Favor', icon: '🧒',
    text: (g) => `${g.firstBy('sibling')?.name} needs ${fmt(500)} for car repairs.`,
    random: { when: (g) => !!g.firstBy('sibling') && g.age >= 18 },
    choices: [
      { label: 'Help out', req: (g) => (g.canAfford(500) ? null : 'Need $500'), run: (g) => { g.money(-500); g.rel(g.firstBy('sibling'), 12); return '"I owe you one." (They will not pay you back.)'; } },
      { label: 'Say no', run: (g) => { g.rel(g.firstBy('sibling'), -8); return 'Thanksgiving will be chilly.'; } },
    ],
  },
];

function wed(g: Parameters<EventDef['text']>[0], pid: string, cost: number, mood: number) {
  const p = g.personById(pid);
  if (!p) return '';
  g.money(-cost);
  p.role = 'spouse';
  g.rel(p, 15);
  g.stat('mood', mood);
  g.burst('hearts');
  g.banner('💍 Just Married', 0xff8fab);
  g.achieve('married');
  g.milestone(`Married ${p.name}`);
  // Update 0.12 — married: every yandere leaves your life
  marriedOff(g);
  return `You said "I do." ${p.name} is your spouse.`;
}

function grieve(g: Parameters<EventDef['text']>[0], pid: string, eulogy: boolean) {
  const p = g.personById(pid);
  g.stat('mood', -18);
  if (eulogy) g.stat('charm', 1.5);
  let extra = '';
  if (p && (p.role === 'mother' || p.role === 'father') && g.s.background !== 'poor') {
    const inh = g.s.background === 'rich' ? g.rand(150000, 600000) : g.rand(8000, 40000);
    g.money(inh);
    extra = ` They left you ${fmt(inh)}.`;
  }
  if (p) g.milestone(`Lost ${p.name}`);
  return (eulogy ? 'Your words brought the room to tears.' : 'You sat with your memories.') + extra;
}
