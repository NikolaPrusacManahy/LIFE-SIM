import type { Game } from '../Game';
import type { Person, Sexuality } from '../types';
import { INTERACTION_BY_ID, bump, socialOdds } from '../npc/interactions';
import { cap, isRomanceEligible, say, SEXUALITY_LABEL } from '../npc/identity';
import { addLabel, dropLabel } from '../npc/labels';
import { hasTrait } from '../npc/traits';
import { KIND_TEXT } from '../encounters/pools';
import { contrabandHeld, searchBag } from '../inventory/items';
import { canBeIntimate, beginNight } from '../systems/intimacy';
import { fmt } from '../systems/finance';
import { settings } from '../settings';
import { checkHint, inHS, type Ctx, type EventDef } from './types';

// Update 0.4 — encounters, relationship chains, teachers, searches, identity, and 18+ college events.

const who = (g: Game, c: Ctx) => g.personById(c.pid);
const run = (id: string, g: Game, p: Person, opt?: string) => cap(INTERACTION_BY_ID[id].run(g, p, opt));
const forget = (g: Game, p: Person) => {
  if (p.tags.includes('stranger')) g.s.people = g.s.people.filter((x) => x.id !== p.id);
};
const met = (p: Person) => {
  p.tags = p.tags.filter((t) => t !== 'stranger');
};
const adultsOnly = (g: Game, p: Person | null) => !!p && canBeIntimate(g, p);

export const PEOPLE_EVENTS: EventDef[] = [
  // ======================= encounter card
  {
    id: 'encounter', icon: '👋', who: (_g, c) => c.pid,
    title: (_g, c) => c.where ?? 'Someone new',
    text: (g, c) => {
      const p = who(g, c);
      if (!p) return 'They walked away.';
      if (g.s.karma < -40 && p.tags.includes('stranger') && hasTrait(p, 'kind') === false && g.chance(0.3)) return say('{name} looks at you and frowns. "I heard about you…"', p);
      const fame = g.s.fame >= 40 && g.chance(0.4) ? say(' {They} squint{s} at you. "Wait — are you from that video?"', p) : '';
      return say(KIND_TEXT[c.kind] ?? '{name} says hi.', p) + fame;
    },
    choices: (g, c) => {
      const p = who(g, c);
      if (!p) return [{ label: 'Continue', run: () => '' }];
      const s = g.s.stats;
      return [
        { label: '💬 Talk', run: (gg) => { met(p); return run('chat', gg, p); } },
        { label: '😂 Joke', hint: `Charm · ${Math.round(socialOdds(g, p, 'charm', 0.5) * 100)}%`, run: (gg) => { met(p); return run('joke', gg, p); } },
        { label: '🌟 Compliment', hint: `Charm · ${Math.round(socialOdds(g, p, 'charm', 0.55) * 100)}%`, run: (gg) => { met(p); return run('compliment', gg, p); } },
        { label: '✨ Smooth opener', when: () => s.charm >= 50, hint: `${Math.round(Math.min(0.95, socialOdds(g, p, 'charm', 0.7)) * 100)}%`, run: (gg) => { met(p); const ok = gg.chance(socialOdds(gg, p, 'charm', 0.7)); bump(p, 'rel', ok ? 10 : 0); return ok ? say('{name} laughs. You’re instantly on {their} radar.', p) : say('{name} raises an eyebrow. Not quite.', p); } },
        { label: '📖 Nerd out with them', when: () => s.smarts >= 60, run: (gg) => { met(p); const ok = hasTrait(p, 'smart') || ['nerd', 'overachiever', 'gamer'].includes(p.archetype) || gg.chance(0.4); bump(p, 'rel', ok ? 10 : 2); return ok ? say('An hour of nerding out. {name} is delighted.', p) : say('{name}’s eyes glaze over.', p); } },
        { label: '🏃 Challenge them to a race', when: () => s.fitness >= 60 && g.ageOf(p) < 40, run: (gg) => { met(p); const won = gg.check('fitness', 55); bump(p, 'rel', 6); bump(p, 'respect', won ? 8 : 3); return won ? say('You won by a mile. {name} demands a rematch.', p) : say('{name} smoked you. You both laugh about it.', p); } },
        { label: '🐕 Help them look', when: () => c.kind === 'dog', run: (gg) => { met(p); gg.karma(3); bump(p, 'rel', 12); return gg.chance(0.7) ? say('You found the dog! {name} hugs you.', p) : say('No luck, but {name} is grateful.', p); } },
        { label: '🗺️ Give directions', when: () => c.kind === 'directions', run: (gg) => { met(p); gg.karma(1); bump(p, 'rel', 6); return say('{name} thanks you. You walk partway together.', p); } },
        { label: '👛 Return the wallet', when: () => c.kind === 'drops', run: (gg) => { met(p); gg.karma(4); bump(p, 'rel', 12); bump(p, 'trust', 10); return say('{name} is stunned. "People don’t do that anymore."', p); } },
        { label: '🫣 Keep the wallet', when: () => c.kind === 'drops', run: (gg) => { gg.karma(-6); gg.money(60); forget(gg, p); return '$60 richer. Slightly worse person.'; } },
        { label: '🛡️ Stand up for them', when: () => c.kind === 'bullied', hint: checkHint('fitness', 45), run: (gg) => { met(p); gg.karma(4); bump(p, 'rel', 15); bump(p, 'trust', 10); if (!gg.check('fitness', 45)) gg.stat('health', -5); return say('The bullies backed off. {name} won’t forget this.', p); } },
        { label: '💵 Give $5', when: () => c.kind === 'money', run: (gg) => { gg.money(-5); gg.karma(2); forget(gg, p); return 'They thanked you and caught the bus.'; } },
        { label: '💧 Get them water and a ride', when: () => c.kind === 'drunk', run: (gg) => { met(p); gg.karma(4); bump(p, 'rel', 8); return say('You made sure {name} got home safe.', p); } },
        { label: '😘 Flirt', when: () => isRomanceEligible(g, p), hint: `Looks/Charm · ${Math.round(Math.min(0.95, socialOdds(g, p, 'charm', 0.35) + (s.looks - 50) / 200) * 100)}%`, run: (gg) => { met(p); return run('flirt', gg, p); } },
        { label: '📱 Ask for their number', run: (gg) => { met(p); return run('number', gg, p); } },
        { label: 'Ignore', run: (gg) => { forget(gg, p); return 'You kept walking.'; } },
      ];
    },
  },

  // ======================= follow-ups scheduled by interactions
  {
    id: 'secret_spread', title: 'Word Got Around', icon: '🗣️', who: (_g, c) => c.pid,
    text: (g, c) => say(c.gossip ? 'The thing you said about someone? They heard. {name} told people.' : 'Your secret is all over school. {name} told people.', who(g, c)),
    choices: [
      { label: 'Confront them', run: (g, c) => { const p = who(g, c); if (p) { bump(p, 'trust', -30); bump(p, 'rel', -15); bump(p, 'rivalry', 15); p.memory.unshift({ clock: g.s.clock, text: 'Spread your secret', tone: 'bad' }); } g.stat('mood', -8); return 'Trust broken.'; } },
      { label: 'Let it go', run: (g) => { g.stat('mood', -5); return 'It blew over. Eventually.'; } },
    ],
  },
  {
    id: 'loan_repaid', title: 'Paid Back', icon: '💵', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} hands you an envelope: the $200, plus a little extra.', who(g, c)),
    choices: [{ label: 'Nice', run: (g, c) => { g.money(220); const p = who(g, c); if (p) { bump(p, 'trust', 8); p.memory.unshift({ clock: g.s.clock, text: 'Paid back your loan', tone: 'good' }); } return 'Good people exist.'; } }],
  },

  // ======================= chains
  {
    id: 'admirer_notes', title: 'The Secret Admirer', icon: '💌',
    text: () => 'Anonymous notes keep appearing in your locker. Three people keep glancing your way. Who is it?',
    random: { when: (g) => g.age >= 14 && g.age <= 22 && !!g.s.education.current && !g.partner, cooldown: 96 },
    choices: (g) => {
      const age = g.age;
      const lo = age < 18 ? Math.max(14, age - 1) : 18;
      const hi = age < 18 ? Math.min(17, age + 1) : age + 3;
      const cands: Person[] = [];
      for (let i = 0; i < 3; i++) {
        const p = g.addPerson('acquaintance', { age: g.rand(lo, Math.max(lo, hi)), rel: 20, met: g.dateLabel, where: 'School', tags: ['stranger', 'admirerCand'] });
        addLabel(p, 'classmate');
        cands.push(p);
      }
      const real = g.pick(cands);
      const rival = g.s.people.find((p) => p.labels.includes('rival') && p.alive);
      return cands.map((p) => ({
        label: `${p.name} ${p.surname}`,
        hint: `${p.pronouns.label} · ${g.ageOf(p)}`,
        run: (gg: Game) => {
          for (const x of cands) x.tags = x.tags.filter((t) => t !== 'admirerCand');
          for (const x of cands) if (x.id !== p.id && x.id !== real.id) forget(gg, x);
          met(p);
          if (rival && gg.chance(0.2)) { bump(rival, 'rivalry', 10); return `It was a prank by ${rival.name}. Everyone laughed. You didn’t.`; }
          if (p.id === real.id && isRomanceEligible(gg, p)) { p.role = 'crush'; bump(p, 'attraction', 50); bump(p, 'rel', 15); gg.burst('hearts'); return say('You guessed right! {name} turns bright red. "It was me…"', p); }
          met(real);
          bump(real, 'rel', 10);
          return say(`Wrong guess. It was ${real.name} — who now thinks you like {name}.`, p);
        },
      }));
    },
  },
  {
    id: 'rival_emerges', title: 'A Rival Appears', icon: '⚔️',
    text: () => 'Someone has decided you’re their competition — in class, at work, everywhere.',
    random: { when: (g) => g.age >= 14 && (!!g.s.education.current || !!g.s.job) && !g.s.people.some((p) => p.labels.includes('rival')), cooldown: 96 },
    choices: [
      { label: 'Game on', run: (g) => { const p = g.addPerson('acquaintance', { age: Math.max(14, g.age + g.rand(-1, 1)), rel: 15, met: g.dateLabel, where: g.s.job ? 'Work' : 'School' }); p.rivalry = 55; addLabel(p, 'rival'); return say('{name} smirks at you from across the room. It’s on.', p); } },
      { label: 'Ignore them', run: () => 'You refuse to play their game. For now.' },
    ],
  },
  {
    id: 'rival_showdown', title: 'The Showdown', icon: '🔥', who: (g) => g.s.people.find((p) => p.rivalry >= 80 && p.alive)?.id ?? null,
    text: (g) => say('Everyone gathers. You and {name}, finally face to face.', g.s.people.find((p) => p.rivalry >= 80 && p.alive) ?? null),
    random: { when: (g) => g.s.people.some((p) => p.rivalry >= 80 && p.alive), cooldown: 60 },
    choices: (g) => {
      const p = g.s.people.find((x) => x.rivalry >= 80 && x.alive)!;
      return [
        { label: 'Beat them publicly', hint: checkHint('charm', 55), run: (gg) => { if (gg.check('charm', 55)) { gg.fame(3); addLabel(p, 'enemy'); return say('You won. {name} will hate you forever.', p); } gg.stat('mood', -10); return say('{name} humiliated you. Ouch.', p); } },
        { label: 'Offer a handshake', hint: checkHint('charm', 60), run: (gg) => { if (gg.check('charm', 60)) { p.rivalry = 10; p.rel = 60; dropLabel(p, 'rival'); dropLabel(p, 'enemy'); p.role = 'friend'; p.hasNumber = true; p.theyHaveNumber = true; return say('Against all odds, you and {name} became friends.', p); } return say('{name} slapped your hand away.', p); } },
      ];
    },
  },
  {
    id: 'group_project', title: 'The Group Project', icon: '📁',
    text: () => 'Your project partner hasn’t done a single thing. The deadline is Friday.',
    random: { when: (g) => !!g.s.education.current && !g.isSummer, cooldown: 48 },
    choices: [
      { label: 'Carry the whole thing', run: (g) => { g.stat('energy', -20); if (g.s.education.current) g.s.education.current.perf += 5; const p = g.addPerson('acquaintance', { age: g.age, rel: 25, met: g.dateLabel, where: 'School' }); addLabel(p, 'classmate'); p.memory.unshift({ clock: g.s.clock, text: 'You carried the group project', tone: 'good' }); return say('An A. {name} owes you. Big time.', p); } },
      { label: 'Report them to the teacher', run: (g) => { if (g.s.education.current) g.s.education.current.perf += 2; return 'You got credit. They got a talking-to.'; } },
      { label: 'Let it fail', run: (g) => { if (g.s.education.current) g.s.education.current.perf -= 6; return 'A C-minus. Lesson learned.'; } },
    ],
  },
  {
    id: 'mentor_push', title: 'Someone Believes in You', icon: '🌱', who: (g) => g.s.people.find((p) => (p.role === 'teacher' || p.role === 'professor') && p.respect >= 70 && p.status === 'alive')?.id ?? null,
    text: (g) => say('{name} keeps you after class. "You have real talent. Have you thought about where it could take you?"', g.s.people.find((p) => (p.role === 'teacher' || p.role === 'professor') && p.respect >= 70) ?? null),
    random: { when: (g) => g.s.people.some((p) => (p.role === 'teacher' || p.role === 'professor') && p.respect >= 70 && p.status === 'alive'), once: true },
    choices: [
      { label: 'Take their advice seriously', run: (g) => { g.setFlag('scholarship'); g.stat('smarts', 3); g.stat('mood', 8); return 'They nominated you for a scholarship and an academic competition.'; } },
      { label: 'Shrug it off', run: () => 'Maybe they see something you don’t.' },
    ],
  },
  {
    id: 'roommate_mess', title: 'Roommate from Hell', icon: '🧦', who: (g) => g.s.people.find((p) => p.labels.includes('roommate') && p.status === 'alive')?.id ?? null,
    text: (g) => say('{name} hasn’t done dishes in three weeks. And your snacks keep disappearing.', g.s.people.find((p) => p.labels.includes('roommate')) ?? null),
    random: { when: (g) => g.s.housing === 'shared' && g.s.people.some((p) => p.labels.includes('roommate') && p.status === 'alive'), cooldown: 36 },
    choices: (g) => {
      const p = g.s.people.find((x) => x.labels.includes('roommate'))!;
      return [
        { label: 'Have it out', hint: checkHint('charm', 50), run: (gg) => { if (gg.check('charm', 50)) { bump(p, 'rel', 8); return say('{name} apologized. A chore chart now exists.', p); } bump(p, 'rivalry', 15); return say('{name} called you uptight. War.', p); } },
        { label: 'Bond over takeout instead', run: (gg) => { bump(p, 'rel', 12); gg.stat('mood', 4); return say('Turns out {name} is hilarious. The dishes can wait.', p); } },
      ];
    },
  },
  {
    id: 'coming_out', title: 'Coming Out', icon: '🏳️‍🌈',
    text: (g) => `You’ve known for a while that you’re ${SEXUALITY_LABEL[g.s.sexuality].toLowerCase()}. Do you want to tell people?`,
    random: { when: (g) => g.age >= 14 && !['straight', 'unsure'].includes(g.s.sexuality) && !g.flag('cameOut'), cooldown: 24 },
    choices: [
      { label: 'Tell your family and friends', run: (g) => {
        g.setFlag('cameOut');
        const lines: string[] = [];
        for (const p of g.s.people.filter((x) => x.alive && (['mother', 'father', 'sibling'].includes(x.role) || x.role === 'friend')).slice(0, 5)) {
          const ok = hasTrait(p, 'kind') || (!hasTrait(p, 'religious') && g.chance(0.75)) || (hasTrait(p, 'religious') && g.chance(0.35));
          bump(p, 'rel', ok ? 6 : -10);
          bump(p, 'trust', ok ? 8 : -5);
          lines.push(`${p.name} ${ok ? 'hugged you' : 'went quiet'}`);
        }
        g.stat('mood', 10);
        g.milestone('Came out');
        return lines.length ? `${lines.join(', ')}. You feel lighter.` : 'You said it out loud. You feel lighter.';
      } },
      { label: 'Not yet', run: () => 'When you’re ready. No rush.' },
    ],
  },
  {
    id: 'settle_sexuality', title: 'Who Are You Drawn To?', icon: '💭',
    text: () => 'You’re an adult now. Do you want to settle on how you identify — or keep it open?',
    choices: () => [
      ...(['straight', 'gay', 'bi', 'pan', 'ace'] as Sexuality[]).map((s) => ({ label: SEXUALITY_LABEL[s], run: (g: Game) => { g.s.sexuality = s; g.setFlag('identitySet'); return `You identify as ${SEXUALITY_LABEL[s].toLowerCase()}.`; } })),
      { label: 'Keep it open', run: (g: Game) => { g.setFlag('identitySet'); return 'Labels can wait.'; } },
    ],
  },
  {
    id: 'self_discovery', title: 'Getting to Know Yourself', icon: '🔍', mature: true,
    text: (g) => `Some honest reflection about what — and who — you’re drawn to. Right now you identify as ${SEXUALITY_LABEL[g.s.sexuality].toLowerCase()}.`,
    choices: () => [
      { label: 'That still feels right', run: (g: Game) => { g.stat('mood', 4); g.setFlag('identitySet'); return 'You know yourself a little better.'; } },
      ...(['straight', 'gay', 'bi', 'pan', 'ace'] as Sexuality[]).map((s) => ({ label: `I think I’m ${SEXUALITY_LABEL[s].toLowerCase()}`, run: (g: Game) => { const changed = g.s.sexuality !== s; g.s.sexuality = s; g.setFlag('identitySet'); g.stat('mood', 6); return changed ? `You realise you’re ${SEXUALITY_LABEL[s].toLowerCase()}. That’s allowed to change.` : 'Confirmed.'; } })),
    ],
  },
  {
    id: 'identity_prompt', title: 'Update 0.4: Your Identity', icon: '🪪',
    text: () => 'This life was started before identity options existed. How do you identify?',
    choices: () => [
      ...(['straight', 'gay', 'bi', 'pan', 'ace', 'unsure'] as Sexuality[]).map((s) => ({ label: SEXUALITY_LABEL[s], run: (g: Game) => { g.s.sexuality = s; g.setFlag('identitySet'); return 'Got it.'; } })),
    ],
  },
  {
    id: 'fwb_feelings', title: 'Catching Feelings', icon: '💗', who: (_g, c) => c.pid,
    text: (g, c) => say(c.them ? '{name} texts: "I think I like you. Like, LIKE you. Do you want more?"' : 'You realize you can’t stop thinking about {name}. This isn’t casual anymore.', who(g, c)),
    choices: [
      { label: 'Make it real', run: (g, c) => { const p = who(g, c); if (!p) return ''; dropLabel(p, 'fwb'); p.role = 'dating'; p.romance = Math.max(p.romance, 55); g.burst('hearts'); return say('You and {name} are officially dating.', p); } },
      { label: 'End it before it gets messy', run: (g, c) => { const p = who(g, c); if (!p) return ''; dropLabel(p, 'fwb'); bump(p, 'rel', -15); g.stat('mood', -6); return 'It ended. It stung a little.'; } },
      { label: 'Keep it casual', run: (g, c) => { const p = who(g, c); if (p && c.them) bump(p, 'rel', -10); return 'Nothing changed. Except, maybe, something did.'; } },
    ],
  },

  // ======================= teachers
  {
    id: 'substitute', title: 'Substitute Chaos', icon: '🎪',
    text: () => 'There’s a substitute today. The class smells blood.',
    random: { when: inHS, cooldown: 48 },
    choices: [
      { label: 'Lead the chaos', run: (g) => { g.stat('charm', 1); g.fame(1); if (g.chance(0.3) && g.s.education.current) g.s.education.current.warnings++; return 'Legendary. The sub cried. You got a warning.'; } },
      { label: 'Actually do the worksheet', run: (g) => { if (g.s.education.current) g.s.education.current.perf += 2; return 'Quiet productivity amid the madness.'; } },
    ],
  },
  {
    id: 'teacher_notices', title: 'A Teacher Notices', icon: '👀', who: (g) => g.peopleBy('teacher').find((p) => p.status === 'alive')?.id ?? null,
    text: (g) => say('{name} asks you to stay after class. "Is everything okay at home?"', g.peopleBy('teacher')[0] ?? null),
    random: { when: (g) => inHS(g) && g.s.stats.mood < 35 && g.peopleBy('teacher').length > 0, cooldown: 48 },
    choices: [
      { label: 'Open up', run: (g) => { const t = g.peopleBy('teacher')[0]; if (t) { bump(t, 'respect', 10); bump(t, 'trust', 10); } g.stat('mood', 12); return 'They listened and connected you with the counselor.'; } },
      { label: '"I’m fine."', run: () => 'They didn’t believe you. But they let it go.' },
    ],
  },
  {
    id: 'unfair_grade', title: 'Unfair Grade', icon: '📉', who: (g) => g.peopleBy('teacher').find((p) => p.tags.includes('unfair'))?.id ?? null,
    text: (g) => say('{name} failed your essay. It was good. You know it was good.', g.peopleBy('teacher').find((p) => p.tags.includes('unfair')) ?? null),
    random: { when: (g) => inHS(g) && g.peopleBy('teacher').some((p) => p.tags.includes('unfair') && p.status === 'alive'), cooldown: 48 },
    choices: [
      { label: 'Report it', run: (g) => { const t = g.peopleBy('teacher').find((p) => p.tags.includes('unfair')); if (t) g.queue('teacher_investigation', { pid: t.id }, true); return 'You filed a complaint.'; } },
      { label: 'Swallow it', run: (g) => { if (g.s.education.current) g.s.education.current.perf -= 3; g.stat('mood', -4); return 'Some battles aren’t worth it. Maybe.'; } },
    ],
  },
  {
    id: 'teacher_investigation', title: 'Investigation', icon: '🔎', who: (_g, c) => c.pid,
    text: (g, c) => say('The school reviews your complaint about {name}.', who(g, c)),
    choices: [{ label: 'Wait for the result', run: (g, c) => { const t = who(g, c); if (t && (t.tags.includes('unfair') || g.chance(0.3))) { t.status = 'moved'; if (g.s.education.current) g.s.education.current.perf += 4; return say('{name} was reassigned. Your grade was corrected.', t); } if (t) bump(t, 'respect', -25); return 'The complaint was dismissed. Things are awkward now.'; } }],
  },
  {
    id: 'field_trip', title: 'Field Trip!', icon: '🚌',
    text: () => 'The class is going to the science museum. Bus seats are being claimed.',
    random: { when: inHS, cooldown: 60 },
    choices: [
      { label: 'Sit with friends', run: (g) => { for (const f of g.peopleBy('friend').slice(0, 3)) bump(f, 'rel', 4); g.stat('mood', 8); return 'Singing on the bus. The driver suffered.'; } },
      { label: 'Actually learn things', run: (g) => { g.stat('smarts', 2); return 'You fell in love with the planetarium.'; } },
    ],
  },
  {
    id: 'prof_scandal', title: 'Someone Saw', icon: '📸', who: (_g, c) => c.pid, mature: true,
    text: (g, c) => say('A classmate saw you and Professor {name} together. The rumor is everywhere.', who(g, c)),
    choices: [
      { label: 'End it immediately', run: (g, c) => { const p = who(g, c); if (p) { dropLabel(p, 'affair'); p.respect = 10; } g.fame(-2); g.karma(-2); return 'You ended it. The whispers will fade. Slowly.'; } },
      { label: 'Ride it out', run: (g, c) => {
        const p = who(g, c);
        if (g.chance(0.55)) {
          if (p) { p.status = 'moved'; dropLabel(p, 'affair'); }
          if (g.s.education.current) { g.s.education.current.perf = Math.max(0, g.s.education.current.perf - 15); g.s.education.current.warnings++; }
          g.fame(-4);
          g.karma(-4);
          return 'An ethics investigation. The professor was fired. Your grades in that course were voided.';
        }
        return 'Nobody could prove anything. This time.';
      } },
    ],
  },

  // ======================= searches
  {
    id: 'bag_search', title: (_g, c) => ({ parents: 'Room Search', school: 'Locker Check', police: 'Stop and Search', roommate: 'Snooping Roommate' } as Record<string, string>)[c.by], icon: '🔦',
    text: (_g, c) => ({ parents: 'Your parent is going through your room. "What’s this?"', school: 'Random locker checks today. The principal is coming down the hall.', police: 'An officer stops you. "Mind if I look in your bag?"', roommate: 'You come home to find your roommate holding your stuff.' } as Record<string, string>)[c.by],
    choices: [{ label: 'Nothing you can do', run: (g, c) => searchBag(g, c.by) }],
  },
  {
    id: 'random_search', title: 'Checkpoint', icon: '🔦',
    text: () => 'Someone is about to look through your stuff.',
    random: { when: (g) => contrabandHeld(g).length > 0, cooldown: 12, weight: 3 },
    choices: (g) => [{ label: 'Uh oh', run: (gg) => searchBag(gg, g.age < 18 && g.livesWithParents ? 'parents' : inHS(g) ? 'school' : g.s.housing === 'shared' ? 'roommate' : 'police') }],
  },

  // ======================= 18+ college & adult life (both 18+, Mature Content)
  {
    id: 'first_time', title: 'A First Time', icon: '🌙', who: (_g, c) => c.pid, mature: true,
    text: (g, c) => say('You and {name} have never gone this far. You’re nervous. Excited. Both.', who(g, c)),
    choices: [
      { label: 'Talk about it first', req: (g, c) => (adultsOnly(g, who(g, c)) ? null : 'Not available'), run: (g, c) => { const p = who(g, c)!; bump(p, 'trust', 8); g.setFlag('talkedFirst'); g.queue('protection_choice', { pid: p.id, theirs: c.theirs ?? 0 }, true); return 'You talked honestly. It made everything easier.'; } },
      { label: 'Go with the moment', req: (g, c) => (adultsOnly(g, who(g, c)) ? null : 'Not available'), run: (g, c) => { g.queue('protection_choice', { pid: c.pid, theirs: c.theirs ?? 0 }, true); return 'Your heart is pounding.'; } },
      { label: 'Wait until you’re ready', run: (g, c) => { const p = who(g, c); if (p) bump(p, 'trust', 3); return 'You decided to wait. That’s okay.'; } },
    ],
  },
  {
    id: 'party_hookup', title: 'Late at the Party', icon: '🍻', mature: true,
    text: (g, c) => {
      const p = who(g, c);
      return say(c.intox === 'very' ? '{name} is very drunk and leaning on you, slurring that {they} like{s} you.' : `{name} pulls you aside, ${c.intox === 'tipsy' ? 'a little tipsy,' : ''} and asks if you want to get out of here.`, p);
    },
    who: (_g, c) => c.pid,
    choices: (g, c) => {
      const p = who(g, c);
      if (c.intox === 'very') {
        return [
          { label: 'Get them water and a safe ride home', run: (gg) => { gg.karma(5); if (p) bump(p, 'trust', 12); return 'You made sure they got home safe. That’s what decent people do.'; } },
          { label: 'Find their friends', run: (gg) => { gg.karma(3); return 'Their friends took it from there.'; } },
        ];
      }
      return [
        { label: 'Go somewhere private', req: (gg) => (adultsOnly(gg, p) ? null : 'Not available'), run: (gg) => beginNight(gg, p!) },
        { label: 'Swap numbers instead', run: (gg) => { if (p) { p.hasNumber = true; p.theyHaveNumber = true; bump(p, 'rel', 6); } gg.stat('mood', 3); return 'Maybe another time, sober.'; } },
        { label: 'Head home', run: () => 'You called it a night.' },
      ];
    },
  },
  {
    id: 'sexile', title: 'Can I Have the Room?', icon: '🚪', mature: true, who: (g) => g.s.people.find((p) => p.labels.includes('roommate') && p.status === 'alive')?.id ?? null,
    text: (g) => say('You text {name}: "Can I have the room tonight?"', g.s.people.find((p) => p.labels.includes('roommate')) ?? null),
    choices: (g, c) => {
      const rm = g.s.people.find((p) => p.labels.includes('roommate'));
      return [
        { label: 'Offer to buy them breakfast', req: (gg) => (adultsOnly(gg, who(gg, c)) ? null : 'Not available'), run: (gg) => { if (rm) bump(rm, 'rel', 2); gg.money(-15); gg.queue('protection_choice', { pid: c.pid }, true); return `${rm?.name ?? 'Your roommate'}: "fine. you owe me a bagel."`; } },
        { label: 'Just ask', req: (gg) => (adultsOnly(gg, who(gg, c)) ? null : 'Not available'), run: (gg) => { if (rm) bump(rm, 'rel', -5); gg.queue('protection_choice', { pid: c.pid }, true); return `${rm?.name ?? 'Your roommate'} sighed and went to the library.`; } },
      ];
    },
  },
  {
    id: 'walkin', title: 'Knock Knock', icon: '😳', mature: true,
    text: () => 'Your roommate walks in at the worst possible moment. Everyone freezes.',
    choices: [{ label: 'Die of embarrassment', run: (g) => { const rm = g.s.people.find((p) => p.labels.includes('roommate')); if (rm) bump(rm, 'rel', -4); g.stat('mood', -2); g.s.schedule.push({ at: g.s.clock + 1, id: 'walkin_after', ctx: {} }); return 'Neither of you will ever speak of this.'; } }],
  },
  {
    id: 'walkin_after', title: 'A Peace Offering', icon: '🧦',
    text: () => 'There’s a sock on the doorknob and a sticky note: "We need a system. — your roommate"',
    choices: [{ label: 'Agree to the sock system', run: (g) => { const rm = g.s.people.find((p) => p.labels.includes('roommate')); if (rm) bump(rm, 'rel', 6); g.stat('mood', 4); return 'Diplomacy achieved.'; } }],
  },
  {
    id: 'walk_of_shame', title: 'The Morning After', icon: '🌅', mature: true,
    text: () => 'Last night’s outfit, 7am, a coffee in hand. Someone you know waves at you.',
    choices: [
      { label: 'Own it', run: (g) => { g.stat('mood', 3); g.fame(0.5); return 'You waved back like a legend.'; } },
      { label: 'Hide behind the coffee', run: (g) => { if (g.chance(0.4)) { g.stat('mood', -3); return 'They definitely told people.'; } return 'Stealth mode: successful.'; } },
    ],
  },
  {
    id: 'app_date', title: 'Meeting Your Match', icon: '☕', who: (_g, c) => c.pid,
    text: (g, c) => say('You walk into the café to meet {name} from Spark.', who(g, c)),
    choices: [
      {
        label: 'Say hi',
        run: (g, c) => {
          const p = who(g, c);
          if (!p) return '';
          const r = Math.random();
          if (r < 0.12) { p.status = 'moved'; g.stat('mood', -6); return 'They never showed up. You finished your coffee alone.'; }
          if (r < 0.22) { p.status = 'moved'; g.stat('mood', -4); return 'It was a catfish. The person waiting looked nothing like the photos. You left.'; }
          if (r < 0.27) { g.s.schedule.push({ at: g.s.clock + 1, id: 'stalker_ex', ctx: { pid: p.id } }); }
          p.tags = p.tags.filter((t) => t !== 'stranger');
          p.hasNumber = true;
          p.theyHaveNumber = true;
          bump(p, 'rel', 15);
          bump(p, 'attraction', 15);
          if (p.role === 'acquaintance') p.role = 'talking';
          if (canBeIntimate(g, p) && g.chance(0.35)) return `${say('Great chemistry. {name} asks if you want to come back to {their} place.', p)} ${beginNight(g, p)}`;
          return say('Great chemistry. {name} wants a second date.', p);
        },
      },
    ],
  },
  {
    id: 'stalker_ex', title: 'Complicated History', icon: '⚠️', who: (_g, c) => c.pid,
    text: (g, c) => say('{name}’s ex has been messaging you threats. "Stay away from {them}."', who(g, c)),
    choices: [
      { label: 'Block and report', run: (g) => { g.stat('mood', -3); return 'Blocked. Reported. Moving on.'; } },
      { label: 'Tell them about it', run: (g, c) => { const p = who(g, c); if (p) bump(p, 'trust', 6); return 'They handled it. You feel safer.'; } },
    ],
  },
  {
    id: 'sugar_offer', title: 'An Arrangement', icon: '💳', mature: true,
    text: () => 'Someone much older and much richer messages you: trips, gifts, an allowance — for your company.',
    random: { when: (g) => settings.mature && g.age >= 18 && g.age <= 30 && !g.s.people.some((p) => p.labels.includes('sugar')), weight: 0.4, cooldown: 120 },
    choices: [
      {
        label: 'Accept the arrangement',
        run: (g) => {
          const p = g.addPerson('acquaintance', { age: g.rand(38, 62), rel: 40, met: g.dateLabel, where: 'An app', archetype: 'mature' });
          p.hasNumber = true;
          p.theyHaveNumber = true;
          addLabel(p, 'sugar');
          g.karma(-3);
          g.milestone(`Started a sugar arrangement with ${p.name}`);
          return say(`{name} sends a welcome gift: ${fmt(1500)}.`, p) + (g.money(1500), '');
        },
      },
      { label: 'Decline', run: () => 'Not for you.' },
    ],
  },
  {
    id: 'sugar_end', title: 'The Arrangement Ends', icon: '🧊', who: (g) => g.s.people.find((p) => p.labels.includes('sugar'))?.id ?? null,
    text: (g) => say('{name} goes silent. Then: "This isn’t working anymore."', g.s.people.find((p) => p.labels.includes('sugar')) ?? null),
    random: { when: (g) => g.s.people.some((p) => p.labels.includes('sugar') && p.status === 'alive'), weight: 0.6, cooldown: 24 },
    choices: [{ label: 'It was fun while it lasted', run: (g) => { const p = g.s.people.find((x) => x.labels.includes('sugar')); if (p) { dropLabel(p, 'sugar'); p.status = 'moved'; } if (g.chance(0.3)) { g.fame(-2); return 'Screenshots leaked. People talked.'; } return 'The allowance stopped. Back to reality.'; } }],
  },
  {
    id: 'sugar_reverse', title: 'An Admirer With Expectations', icon: '💎', mature: true,
    text: () => 'A young, gorgeous admirer is very interested in you — and in your lifestyle.',
    random: { when: (g) => settings.mature && g.age >= 35 && g.s.money > 250000 && !g.s.people.some((p) => p.labels.includes('sugarbaby')), weight: 0.3, cooldown: 120 },
    choices: [
      { label: 'Spoil them', run: (g) => { const p = g.addPerson('acquaintance', { age: g.rand(21, 28), rel: 50, met: g.dateLabel, where: 'A gala' }); p.hasNumber = true; p.theyHaveNumber = true; addLabel(p, 'sugarbaby'); bump(p, 'attraction', 40); g.karma(-2); return say('{name} loves the attention — and the shopping.', p); } },
      { label: 'Not interested', run: () => 'You can smell a gold-digger.' },
    ],
  },
];

/** Monthly side effects for 0.4 labels. */
export function peopleMonth(g: Game) {
  for (const p of g.s.people) {
    if (!p.alive || p.status !== 'alive') continue;
    if (p.labels.includes('sugar')) g.money(g.rand(500, 2000));
    if (p.labels.includes('sugarbaby')) g.money(-g.rand(1000, 4000));
    if (p.labels.includes('fwb') && !g.queued('fwb_feelings') && g.chance(0.08)) g.queue('fwb_feelings', { pid: p.id, them: g.chance(0.5) });
  }
}
