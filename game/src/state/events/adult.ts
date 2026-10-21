import type { Game } from '../Game';
import { makeMatch } from '../npc/match';
import { legalAge, rulesFor } from '../rules/us';
import { settings } from '../settings';
import { beginNight, canBeIntimate, condoms, consentOdds, encounter, hiddenOf, onBirthControl, stiTest } from '../systems/intimacy';
import { fmt } from '../systems/finance';
import { checkHint, type Ctx, type EventDef } from './types';
import { SPOT_LINE, styleAfter, type Spot, type Style } from '../datenight/desire';

// Update 0.3 — adult relationships (18+, Mature Content). Non-explicit: choices, fade to black, consequences.
// Every choice re-checks canBeIntimate() because a queued event can go stale.

const who = (g: Game, c: Ctx) => g.personById(c.pid);
/** Update 0.9 — after a night at their place you wake up in their bed. */
const wake = (c: Ctx, text: string, g?: Game) =>
  g && c.style ? `${text}${styleAfter(g, g.personById(c.pid), c.style as Style)}` : c.place === 'restroom' || c.place === 'locker' ? `${text} You slip back out separately, flushed. Nobody noticed. Probably.`
    : c.place === 'theater' ? `${text} The credits roll. You fix your hair before the lights come up. Nobody noticed. Probably.`
      : c.theirs ? `${text} You wake up in their bed, sunlight through unfamiliar curtains.` : text;
/** Update 0.11 — where it happens. */
const PLACE_LINE: Record<string, string> = { restroom: 'The restroom door clicks shut behind you. ', locker: 'The locker room is empty. The showers are running. ', theater: 'The back row is dark and the movie is loud. ' };

export const ADULT_EVENTS: EventDef[] = [
  {
    id: 'protection_choice', title: 'Spending the Night', icon: '🌙', mature: true, who: (_g, c) => c.pid,
    text: (g, c) => `${c.spot ? SPOT_LINE[c.spot as Spot] : c.place ? (PLACE_LINE[String(c.place)] ?? '') : c.theirs ? `Back at ${who(g, c)?.name ?? 'their'}’s place. ` : ''}Before anything happens, you and ${who(g, c)?.name ?? 'they'} talk about protection.`,
    choices: (g, c) => {
      const p = who(g, c);
      const pill = onBirthControl(g) || (p ? hiddenOf(g, p).onPill : false);
      return [
        // Update 0.9 — at their place they have some in the nightstand
        { label: '🛡️ Use a condom', hint: (c.theirs || c.place || c.spot) && !condoms(g) ? 'They have one' : `You have ${condoms(g)}`, req: (gg) => (condoms(gg) > 0 || c.theirs || c.place || c.spot ? null : 'Buy condoms at the clinic'), run: (gg) => (canBeIntimate(gg, p) ? wake(c, encounter(gg, p!, 'condom'), gg) : 'The moment passed.') },
        { label: '📅 Rely on birth control', when: () => pill, hint: 'Low pregnancy risk · no STI protection', run: (gg) => (canBeIntimate(gg, p) ? wake(c, encounter(gg, p!, 'pill'), gg) : 'The moment passed.') },
        { label: 'No protection', hint: 'High pregnancy & STI risk', run: (gg) => (canBeIntimate(gg, p) ? wake(c, encounter(gg, p!, 'none'), gg) : 'The moment passed.') },
        { label: 'Actually, let’s wait', run: (gg) => { if (p) gg.rel(p, 1); return 'You decided to slow down. That’s okay.'; } },
      ];
    },
  },
  {
    id: 'consent_no', who: (_g, c) => c.pid, title: (g, c) => `${who(g, c)?.name ?? 'They'} Isn’t Ready`, icon: '🤍',
    text: (g, c) => `${who(g, c)?.name ?? 'They'} says, kindly but clearly: "Not tonight."`,
    choices: [
      { label: 'That’s okay — I respect that', run: (g, c) => { const p = who(g, c); if (p) g.rel(p, -1); return 'You meant it. They noticed.'; } },
      { label: 'Suggest a walk instead', run: (g, c) => { const p = who(g, c); if (p) g.rel(p, 2); g.stat('mood', 3); return 'A late walk and a long talk. Nice in its own way.'; } },
    ],
  },
  {
    id: 'meet_fling', title: 'A Spark Across the Room', icon: '🍸', mature: true,
    text: () => 'Someone has been catching your eye all night. They finally walk over and say hi.',
    choices: [
      {
        label: 'Hit it off — go home together',
        hint: checkHint('charm', 45),
        req: (g) => (g.age >= 18 && settings.mature ? null : 'Not available'),
        run: (g) => {
          const p = makeAdult(g, 'fling', 'A night out');
          if (!canBeIntimate(g, p)) return '';
          if (g.check('charm', 45) && g.chance(consentOdds(g, p, 'night') + 0.25)) return `You and ${p.name} left together. ${beginNight(g, p)}`;
          return `${p.name} laughed at your jokes, then said goodnight. Fair enough.`;
        },
      },
      { label: 'Exchange numbers', run: (g) => { const p = makeAdult(g, 'crush', 'A night out'); g.burst('hearts'); return `${p.name} texted you before you got home.`; } },
      { label: 'Call it a night', run: () => 'You went home alone, smiling.' },
    ],
  },
  {
    id: 'pregnancy_news', title: 'Two Lines', icon: '🍼', who: (_g, c) => c.pid,
    text: (g, c) => `A test confirms it: a pregnancy, with ${who(g, c)?.name ?? 'your partner'}. This is a big decision.`,
    choices: (g, c) => {
      const access = rulesFor(g).abortionAccess[g.s.region];
      return [
        {
          label: 'Keep the baby',
          run: (gg) => {
            gg.setFlag('pregnantUntil', gg.s.clock + 8);
            gg.setFlag('babyPending');
            gg.stat('mood', 4);
            const p = who(gg, c);
            if (p && p.role === 'fling') gg.rel(p, hiddenOf(gg, p).wantsKids > 0.5 ? 10 : -10);
            gg.milestone('Expecting a baby');
            return 'You’re going to be a parent. Life is about to change.';
          },
        },
        { label: 'Place the baby for adoption', run: (gg) => { gg.stat('mood', -6); gg.milestone('Chose adoption for a pregnancy'); clearCoparent(gg); return 'You found a loving family through an agency. It was the right choice for you.'; } },
        { label: 'End the pregnancy', when: () => access, req: (gg) => (gg.canAfford(600) ? null : 'Need $600'), run: (gg) => { gg.money(-600); gg.stat('mood', -4); clearCoparent(gg); return 'You went to the clinic. It was a private decision, and it was yours.'; } },
        { label: 'Travel out of state to end it ($1,800)', when: () => !access, req: (gg) => (gg.canAfford(1800) ? null : 'Need $1,800'), run: (gg) => { gg.money(-1800); gg.stat('mood', -6); gg.stat('energy', -20); clearCoparent(gg); return 'It’s not available where you live. You made the trip. It was your decision.'; } },
      ];
    },
  },
  {
    id: 'sti_symptoms', title: 'Something Feels Off', icon: '🩺',
    text: () => 'You’ve noticed symptoms that won’t go away. Probably time for a clinic visit.',
    choices: [
      { label: 'Book a clinic visit ($60)', run: (g) => { g.money(-60); return stiTest(g); } },
      { label: 'Tell your partner too', when: (g) => !!g.partner, run: (g) => { const p = g.partner!; g.rel(p, -6); g.karma(3); return `${p.name} was upset — but grateful you were honest. ${stiTest(g)}`; } },
      { label: 'Ignore it', run: (g) => { g.stat('health', -5); return 'Ignoring it won’t make it go away.'; } },
    ],
  },
  {
    id: 'cheating_discovered', title: 'They Found Out', icon: '📱', who: (_g, c) => c.pid,
    text: (g, c) => `${who(g, c)?.name ?? 'Your partner'} found the messages. They’re holding your phone, shaking.`,
    choices: [
      { label: 'Confess and apologize', hint: checkHint('charm', 55), run: (g, c) => resolveCheat(g, c, g.check('charm', 55) ? 'stay' : 'leave', 'confess') },
      { label: 'Deny everything', hint: checkHint('charm', 70), run: (g, c) => { g.karma(-5); return resolveCheat(g, c, g.check('charm', 70) ? 'doubt' : 'leave', 'deny'); } },
      { label: 'End it', run: (g, c) => resolveCheat(g, c, 'leave', 'end') },
    ],
  },
  {
    id: 'town_gossip', title: 'Town Gossip', icon: '🗣️',
    text: () => 'People are talking about your love life. Loudly. At brunch.',
    random: { when: (g) => g.flag('flings') >= 5 && g.age >= 18, cooldown: 36 },
    choices: [
      { label: 'Own it', run: (g) => { g.fame(2); g.stat('charm', 1); return 'You winked at the gossips. They were scandalized and delighted.'; } },
      { label: 'Lay low for a while', run: (g) => { g.stat('mood', -3); return 'You skipped brunch for a month.'; } },
    ],
  },
  {
    id: 'affair_temptation', title: 'Temptation', icon: '🔥', mature: true,
    text: () => 'A colleague lingers after a late meeting. The tension is obvious. You’re married.',
    random: { when: (g) => settings.mature && g.age >= 26 && !!g.firstBy('spouse') && !!g.s.job, weight: 0.5, cooldown: 60 },
    choices: [
      { label: 'Go home to your spouse', run: (g) => { g.rel(g.firstBy('spouse'), 4); g.karma(3); return 'You said goodnight and meant it.'; } },
      {
        label: 'Stay a little longer',
        run: (g) => {
          const p = makeAdult(g, 'crush', 'Work', g.age + g.rand(-5, 5));
          p.rel = 62;
          if (canBeIntimate(g, p) && g.chance(consentOdds(g, p, 'night'))) return `One drink became two. You and ${p.name} left together. ${beginNight(g, p)}`;
          return `${p.name} caught themselves. "We shouldn’t." They left.`;
        },
      },
    ],
  },
  {
    id: 'pregnancy_scare', title: 'Late', icon: '⏳',
    text: () => 'Something’s late. Your heart is pounding.',
    random: { when: (g) => settings.mature && g.age >= 18 && g.flag('encounters') > 0 && !g.flag('babyPending') && !g.flag('pregNewsAt'), weight: 0.4, cooldown: 36 },
    choices: [{ label: 'Take a test', run: (g) => { g.stat('mood', 6); return 'Negative. You exhaled for the first time in a week.'; } }],
  },
];

function makeAdult(g: Game, role: 'fling' | 'crush', met: string, age?: number) {
  const min = met === 'A night out' ? Math.max(18, legalAge(g, 'alcohol')) : 18;
  const a = Math.max(min, age ?? g.age + g.rand(-4, 5));
  const p = makeMatch(g, role, [a, a], { rel: role === 'fling' ? 55 : 48, met, where: met });
  p.hasNumber = true;
  p.theyHaveNumber = true;
  return p;
}

function clearCoparent(g: Game) {
  for (const p of g.s.people) p.tags = p.tags.filter((t) => t !== 'coparent');
}

function resolveCheat(g: Game, c: Ctx, outcome: 'stay' | 'doubt' | 'leave', how: string) {
  const p = who(g, c);
  if (!p) return '';
  g.setFlag(`cheatOn:${p.id}`, 0);
  g.stat('mood', -10);
  if (outcome === 'stay') {
    g.rel(p, -25);
    return `${p.name} cried, then said: "I need time. But I’m not leaving." Trust will take years.`;
  }
  if (outcome === 'doubt') {
    g.rel(p, -10);
    return `${p.name} doesn’t quite believe you. But they let it go. For now.`;
  }
  const wasSpouse = p.role === 'spouse';
  p.role = 'ex';
  p.rel = 5;
  for (const f of g.peopleBy('friend')) if (g.chance(0.3)) g.rel(f, -8);
  if (wasSpouse) {
    const split = Math.round(Math.max(0, g.s.money) * 0.5);
    g.money(-split);
    g.milestone(`Divorced ${p.name}`);
    return `${how === 'end' ? 'You ended it.' : `${p.name} left.`} The divorce split everything — ${fmt(split)} gone. Some friends picked sides.`;
  }
  return `${how === 'end' ? 'You ended it.' : `${p.name} walked out.`} Some friends picked sides.`;
}
