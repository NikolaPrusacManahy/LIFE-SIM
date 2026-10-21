import type { Game } from '../Game';
import { CAREER_BY_ID } from '../data/careers';
import { dropOut } from '../systems/education';
import { fire, promote, quitJob, startJob } from '../systems/career';
import { fmt } from '../systems/finance';
import { hasPhone } from '../systems/phone';
import { riskCatch, ground } from '../systems/trouble';
import { consume, HABIT_LABEL, type Habit } from '../systems/addiction';
import { relocate } from '../activities/travel';
import { checkHint, inHS, type EventDef } from './types';
import { legalAge, rulesFor } from '../rules/us';

// Update 0.3 — life events: teen (14–17), young adult (18–25), adult (26+), and system follow-ups.

const teen = (g: Game) => g.age >= 14 && g.age < 18;
const friend = (g: Game) => g.peopleBy('friend')[0] ?? null;

export const LIFE03_EVENTS: EventDef[] = [
  // ================= teen
  {
    id: 'vape_offer', title: 'Want a Hit?', icon: '💨',
    text: () => 'At a party, a friend holds out a vape. Everyone is watching.',
    random: { when: teen, cooldown: 30 },
    choices: [
      { label: 'Try it', hint: (g) => `Illegal under ${legalAge(g, 'tobacco')}`, run: (g) => { consume(g, 'nicotine', 6); g.stat('street', 1); if (riskCatch(g, 0.15, { name: 'Vaping', sev: 1, kind: 'tobacco', by: 'parents' })) return 'Your parent smelled it on your hoodie that night…'; return 'Mango ice. You coughed. Everyone laughed.'; } },
      { label: 'No thanks', run: (g) => { g.karma(1); g.stat('charm', 0.5); return 'Nobody cared as much as you thought they would.'; } },
    ],
  },
  {
    id: 'parents_divorce', title: 'Your Parents Are Divorcing', icon: '💔',
    text: () => 'They sit you down together. It’s not your fault, they say. You have to choose who to live with.',
    random: { when: (g) => teen(g) && !!g.firstBy('mother') && !!g.firstBy('father'), once: true, weight: 0.5 },
    choices: (g) => g.parents.map((p) => ({
      label: `Live with ${p.name} (${p.role === 'mother' ? 'Mom' : 'Dad'})`,
      run: (gg: Game) => {
        for (const o of gg.parents) if (o.id !== p.id) gg.rel(o, -15);
        gg.rel(p, 8);
        gg.stat('mood', -15);
        gg.milestone('Parents divorced');
        return `You moved in with ${p.name}. Weekends with the other parent. It’s a lot.`;
      },
    })),
  },
  {
    id: 'teacher_accuses', title: 'Accused of Cheating', icon: '🧑‍🏫',
    text: () => 'Your teacher holds up your test. "This is suspiciously perfect. Explain."',
    random: { when: (g) => inHS(g) && !g.isSummer, cooldown: 40 },
    choices: [
      { label: 'Admit it', when: (g) => g.s.karma < 0, run: (g) => { g.karma(4); (g.s.education.current ?? { perf: 0 }).perf -= 5; return 'Honesty cost you the grade but earned some respect.'; } },
      { label: 'Walk them through your work', hint: checkHint('smarts', 50), run: (g) => { if (g.check('smarts', 50)) { (g.s.education.current ?? { perf: 0 }).perf += 3; return 'You explained every step. The teacher apologized.'; } (g.s.education.current ?? { warnings: 0 }).warnings++; return 'You stumbled. A warning went on your file.'; } },
      { label: 'Get defensive', run: (g) => { g.stat('street', 1); (g.s.education.current ?? { perf: 0 }).perf -= 3; return 'Detention for "attitude."'; } },
    ],
  },
  {
    id: 'bff_dates_crush', title: 'Betrayal?', icon: '😶',
    text: (g) => `${friend(g)?.name} is dating your crush, ${g.firstBy('crush')?.name}.`,
    random: { when: (g) => g.age >= 14 && !!friend(g) && !!g.firstBy('crush'), cooldown: 60 },
    choices: [
      { label: 'Be happy for them', run: (g) => { g.karma(3); g.stat('mood', -5); const c = g.firstBy('crush'); if (c) c.role = 'friend'; return 'It hurt. You were gracious anyway.'; } },
      { label: 'Confront your friend', run: (g) => { g.rel(friend(g), -20); const c = g.firstBy('crush'); if (c) c.role = 'friend'; return 'Harsh words. The friendship cracked.'; } },
    ],
  },
  {
    id: 'school_show_scout', title: 'A Scout at the Show', icon: '🎭',
    text: () => 'A talent agent is in the audience at the school show tonight.',
    choices: [
      { label: 'Give the performance of your life', hint: checkHint('creativity', 55), run: (g) => { if (g.check('creativity', 55)) { g.fame(6); g.setFlag('scouted'); g.banner('🌟 Discovered', 0xf5b53a); return 'The agent left a business card. "Call me when you’re 16."'; } g.stat('mood', -4); return 'You forgot a line. The agent left at intermission.'; } },
      { label: 'Just have fun', run: (g) => { g.stat('mood', 6); return 'Standing ovation from the parents.'; } },
    ],
  },
  {
    id: 'viral_embarrass', title: 'Embarrassing Clip', icon: '📹',
    text: () => 'Someone filmed you tripping into the cafeteria trash can. It’s everywhere.',
    random: { when: (g) => teen(g) && hasPhone(g), cooldown: 48 },
    choices: [
      { label: 'Own it — post a reaction', hint: checkHint('charm', 45), run: (g) => { if (g.check('charm', 45)) { g.fame(3); g.stat('charm', 1); return 'Your reaction was funnier than the clip. People love you now.'; } g.stat('mood', -6); return 'It made it worse.'; } },
      { label: 'Delete everything', run: (g) => { g.stat('mood', -5); return 'It blew over in a week.'; } },
    ],
  },
  {
    id: 'sibling_cover', title: 'Cover for Me?', icon: '🤫',
    text: (g) => `${g.firstBy('sibling')?.name} snuck out and begs you to lie to your parents.`,
    random: { when: (g) => g.age >= 14 && g.age <= 22 && !!g.firstBy('sibling') && g.livesWithParents },
    choices: [
      { label: 'Cover for them', run: (g) => { g.rel(g.firstBy('sibling'), 8); if (g.chance(0.3)) { for (const p of g.parents) g.rel(p, -6); return 'The lie fell apart. Now you’re both in trouble.'; } return 'Your sibling owes you. Big.'; } },
      { label: 'Tell your parents', run: (g) => { g.rel(g.firstBy('sibling'), -15); for (const p of g.parents) g.rel(p, 3); return 'Your sibling isn’t speaking to you.'; } },
    ],
  },
  {
    id: 'unfair_manager', title: 'Unfair Manager', icon: '😤',
    text: () => 'Your manager keeps giving you the worst shifts and docking your breaks.',
    random: { when: (g) => !!g.s.job && CAREER_BY_ID[g.s.job.careerId].track === 'teen' },
    choices: [
      { label: 'Speak up', hint: checkHint('charm', 50), run: (g) => { if (g.check('charm', 50)) { if (g.s.job) g.s.job.perf += 8; return 'They backed off. Respect.'; } if (g.s.job) g.s.job.perf -= 8; return 'Now they really don’t like you.'; } },
      { label: 'Quit', run: (g) => { quitJob(g); g.stat('mood', 5); return 'You walked out mid-shift. Freedom.'; } },
      { label: 'Put up with it', run: (g) => { g.stat('mood', -4); return 'Just a few more months.'; } },
    ],
  },
  {
    id: 'permit_crash', title: 'Fender Bender', icon: '🚙',
    text: () => 'Practicing with your permit, you backed the family car into a mailbox.',
    random: { when: (g) => !!g.flag('permit') && !g.flag('license') && g.livesWithParents, once: true },
    choices: [
      { label: 'Own up', run: (g) => { for (const p of g.parents) g.rel(p, -4); g.money(-Math.min(g.s.money, 300)); return 'They were mad, then relieved you were okay.'; } },
      { label: 'Hide it', hint: checkHint('charm', 60), run: (g) => { g.karma(-3); if (g.check('charm', 60)) return 'Nobody noticed. Somehow.'; ground(g, 1); for (const p of g.parents) g.rel(p, -10); return 'They found the dent. Grounded.'; } },
    ],
  },
  {
    id: 'cyberbully', title: 'Online Harassment', icon: '📵',
    text: () => 'Anonymous accounts keep posting cruel things about you.',
    random: { when: (g) => teen(g) && hasPhone(g), cooldown: 48 },
    choices: [
      { label: 'Block, report, log off', run: (g) => { g.stat('mood', -2); return 'The accounts got banned. You breathed again.'; } },
      { label: 'Tell a parent', run: (g) => { for (const p of g.parents) g.rel(p, 5); g.stat('mood', 2); return 'They helped you report it to the school.'; } },
      { label: 'Fire back', run: (g) => { g.stat('street', 1); g.karma(-3); g.stat('mood', -4); return 'It escalated. Nobody won.'; } },
    ],
  },
  {
    id: 'pet_dies', title: 'Goodbye, Old Friend', icon: '🐾',
    text: () => 'Biscuit is old and tired. The vet says it’s time.',
    random: { when: (g) => g.has('dog') && g.age >= 30, once: true, weight: 0.3 },
    choices: [{ label: 'Hold them one last time', run: (g) => { g.take('dog'); g.stat('mood', -18); g.milestone('Said goodbye to Biscuit'); return 'The house is so quiet now.'; } }],
  },
  {
    id: 'grandparent_funeral', title: 'Grandma’s Funeral', icon: '🕊️',
    text: () => 'Your grandmother passed away. The whole family gathers.',
    random: { when: teen, once: true, weight: 0.4 },
    choices: [
      { label: 'Share a memory', run: (g) => { g.stat('mood', -10); g.stat('charm', 1); g.setFlag('grandmaTrust', g.s.background === 'rich' ? 40000 : g.s.background === 'middle' ? 8000 : 1500); return 'Everyone laughed and cried. She left you a little something for when you turn 18.'; } },
    ],
  },
  {
    id: 'prom_night', title: 'Prom Night', icon: '👑',
    text: () => 'Lights, music, a gym that almost looks magical.',
    choices: (g) => [
      { label: `Go with ${g.partner?.name ?? g.firstBy('crush')?.name}`, when: () => !!(g.partner || g.firstBy('crush')), run: (gg) => { const p = gg.partner ?? gg.firstBy('crush'); gg.rel(p, 14); gg.stat('mood', 14); gg.burst('hearts'); if (p?.role === 'crush') p.role = 'partner'; return crowned(gg, `You danced with ${p?.name} all night.`); } },
      { label: 'Go with your friends', run: (gg) => { for (const f of gg.peopleBy('friend')) gg.rel(f, 6); gg.stat('mood', 12); return crowned(gg, 'A group photo you’ll keep forever.'); } },
      { label: 'Hit the after-party', hint: 'Underage drinking risk', run: (gg) => { consume(gg, 'alcohol', 5); gg.stat('mood', 12); if (riskCatch(gg, 0.25, { name: 'Underage drinking', sev: 1, kind: 'alcohol', by: 'police' })) return 'Police broke up the after-party…'; return crowned(gg, 'The after-party was legendary.'); } },
    ],
  },

  // ================= young adult
  {
    id: 'roommate_rent', title: 'Roommate Problems', icon: '🧾',
    text: () => 'Your roommate is short on rent again. "Just this once?"',
    random: { when: (g) => g.s.housing === 'shared' },
    choices: [
      { label: 'Cover their half ($400)', req: (g) => (g.canAfford(400) ? null : 'Need $400'), run: (g) => { g.money(-400); g.karma(2); return 'They swore they’d pay you back.'; } },
      { label: 'Lay down the law', hint: checkHint('charm', 50), run: (g) => (g.check('charm', 50) ? 'They found the money by Friday.' : (g.money(-400), 'They didn’t pay. The landlord took it from your deposit.')) },
    ],
  },
  {
    id: 'credit_card_offer', title: 'Pre-Approved!', icon: '💳',
    text: (g) => `A bank offers you a credit card with a ${fmt(g.age < rulesFor(g).creditIncomeAge ? 1000 : 3000)} limit. ${g.age < rulesFor(g).creditIncomeAge ? `(Under ${rulesFor(g).creditIncomeAge}: needs proof of income.)` : ''}`,
    random: { when: (g) => g.age >= 18 && !g.flag('creditCard'), once: true },
    choices: [
      { label: 'Accept and treat yourself', req: (g) => (g.age < rulesFor(g).creditIncomeAge && !g.s.job ? 'Needs proof of income' : null), run: (g) => { const lim = g.age < rulesFor(g).creditIncomeAge ? 1000 : 3000; g.setFlag('creditCard'); g.money(lim); g.s.debt += lim; g.setFlag('hadDebt'); g.stat('mood', 8); return `You spent ${fmt(lim)} in a weekend. Interest starts now.`; } },
      { label: 'Accept for emergencies only', req: (g) => (g.age < rulesFor(g).creditIncomeAge && !g.s.job ? 'Needs proof of income' : null), run: (g) => { g.setFlag('creditCard'); g.stat('smarts', 1); return 'It sits in your wallet, building credit.'; } },
      { label: 'Decline', run: () => 'Cash only. Old school.' },
    ],
  },
  {
    id: 'cosign_loan', title: 'Co-Sign My Loan?', icon: '✍️',
    text: (g) => `${friend(g)?.name} needs a co-signer for a $5,000 car loan.`,
    random: { when: (g) => g.age >= 18 && !!friend(g) },
    choices: [
      { label: 'Co-sign', run: (g) => { g.rel(friend(g), 12); if (g.chance(0.3)) { g.s.debt += 5000; g.setFlag('hadDebt'); return `Months later, ${friend(g)?.name} stopped paying. The debt is yours now.`; } return 'They paid it off on time. Phew.'; } },
      { label: 'Politely decline', run: (g) => { g.rel(friend(g), -6); return 'Awkward, but your credit is safe.'; } },
    ],
  },
  {
    id: 'party_raid', title: 'Police at the Party', icon: '🚓',
    text: () => 'Blue lights outside. Someone yells "COPS!" and the music cuts.',
    random: { when: (g) => g.age >= 16 && g.age <= 25 && g.phase === 'night' },
    choices: [
      { label: 'Stay calm', run: (g) => (g.age < legalAge(g, 'alcohol') && g.chance(0.4) ? (riskCatch(g, 1, { name: 'Underage drinking', sev: 1, kind: 'alcohol', by: 'police' }), 'An officer asked how old you were…') : 'You showed ID and went home.') },
      { label: 'Run out the back', hint: checkHint('fitness', 45), run: (g) => (g.check('fitness', 45) ? 'Over the fence and gone.' : (g.stat('health', -5), riskCatch(g, 0.6, { name: 'Fleeing police', sev: 1, kind: 'other', by: 'police' }), 'You tore your jeans on the fence.')) },
    ],
  },
  {
    id: 'ex_returns', title: 'Your Ex Texts', icon: '💬',
    text: (g) => `${g.firstBy('ex')?.name}: "I miss you. Can we talk?"`,
    random: { when: (g) => !!g.firstBy('ex') && g.age >= 16 && !g.partner },
    choices: [
      { label: 'Get back together', run: (g) => { const e = g.firstBy('ex')!; e.role = 'partner'; e.rel = Math.max(e.rel, 55); g.burst('hearts'); return `You and ${e.name} are giving it another shot.`; } },
      { label: 'Stay friends', run: (g) => { const e = g.firstBy('ex')!; e.role = 'friend'; return 'Coffee, no pressure. It felt healthy.'; } },
      { label: 'Leave it in the past', run: () => 'You didn’t reply. Growth.' },
    ],
  },
  {
    id: 'partner_moves', title: 'A Job Far Away', icon: '🧳',
    text: (g) => `${g.partner?.name} got a dream job in the ${g.s.region === 'city' ? 'countryside' : 'city'}.`,
    random: { when: (g) => g.age >= 18 && !!g.partner },
    choices: [
      { label: 'Move with them', run: (g) => { g.rel(g.partner, 12); return relocate(g, g.s.region === 'city' ? 'country' : 'city'); } },
      { label: 'Try long distance', run: (g) => { g.rel(g.partner, -15); return 'Video calls every night. It’s hard.'; } },
      { label: 'Break up', run: (g) => { const p = g.partner; if (!p) return 'There was no one left to break up with.'; p.role = 'ex'; g.stat('mood', -12); return 'You both cried at the airport.'; } },
    ],
  },
  {
    id: 'drunk_driving', title: '"I’m Fine to Drive"', icon: '🔑',
    text: (g) => `${friend(g)?.name ?? 'Your friend'} has had way too much and is reaching for the car keys.`,
    random: { when: (g) => g.age >= 17 && !!friend(g) },
    choices: [
      { label: 'Take the keys', run: (g) => { g.karma(5); g.rel(friend(g), -2); g.achieve('hero'); return 'They were annoyed. Tomorrow they thanked you.'; } },
      { label: 'Call a ride ($30)', run: (g) => { g.money(-30); g.karma(3); return 'Everyone got home safe.'; } },
      { label: 'Get in the car', run: (g) => { if (g.chance(0.2)) { g.stat('health', -35); g.fx({ type: 'shake', power: 10 }); return 'You hit a pole. You woke up in the hospital.'; } g.karma(-3); return 'You made it. You shouldn’t have.'; } },
    ],
  },
  {
    id: 'job_abroad', title: 'An Offer Overseas', icon: '🌍',
    text: () => 'Your company offers a two-year posting abroad with a big raise.',
    random: { when: (g) => !!g.s.job && ['pro', 'elite'].includes(CAREER_BY_ID[g.s.job.careerId].track) && g.s.job.level >= 1, weight: 0.4 },
    choices: [
      { label: 'Take it', run: (g) => { promote(g); g.stat('mood', 10); g.stat('creativity', 2); if (g.partner) g.rel(g.partner, -15); return 'New country, new language, bigger title.'; } },
      { label: 'Stay home', run: (g) => { if (g.partner) g.rel(g.partner, 6); return 'Roots matter.'; } },
    ],
  },
  {
    id: 'dropout_business', title: 'Drop Out and Build?', icon: '🚀',
    text: () => 'Your side project is getting real users. Do you leave school to go all in?',
    random: { when: (g) => !!g.s.education.current && g.s.education.current.program.startsWith('uni_') && g.s.stats.smarts >= 60, once: true, weight: 0.6 },
    choices: [
      { label: 'Drop out and found it', run: (g) => { dropOut(g); startJob(g, 'founder'); g.achieve('founder'); return 'You told your parents. They were… quiet.'; } },
      { label: 'Finish your degree first', run: (g) => { g.stat('smarts', 1); return 'The idea will wait.'; } },
    ],
  },

  // ================= adult
  {
    id: 'promotion_vs_family', title: 'Career or Family?', icon: '⚖️',
    text: () => 'A promotion that means 70-hour weeks — just as the kids need you most.',
    random: { when: (g) => !!g.s.job && g.peopleBy('child').some((k) => g.ageOf(k) < 12) && g.s.job.level < CAREER_BY_ID[g.s.job.careerId].levels.length - 1 },
    choices: [
      { label: 'Take the promotion', run: (g) => { promote(g); for (const k of g.peopleBy('child')) g.rel(k, -10); return 'More money, fewer bedtime stories.'; } },
      { label: 'Family first', run: (g) => { for (const k of g.peopleBy('child')) g.rel(k, 10); g.stat('mood', 6); return 'You were there for the school play. Worth it.'; } },
    ],
  },
  {
    id: 'parent_illness', title: 'A Parent Is Ill', icon: '🏥',
    text: (g) => `${g.parents.find((p) => g.ageOf(p) >= 65)?.name} can’t live alone anymore.`,
    random: { when: (g) => g.age >= 25 && g.parents.some((p) => g.ageOf(p) >= 65), cooldown: 96 },
    choices: [
      { label: 'Care for them yourself', run: (g) => { const p = g.parents.find((x) => g.ageOf(x) >= 65); g.rel(p, 15); g.stat('mood', -8); g.stat('energy', -20); g.karma(5); return 'Exhausting. Meaningful.'; } },
      { label: 'Pay for a care home ($15,000)', req: (g) => (g.canAfford(15000) ? null : 'Need $15,000'), run: (g) => { g.money(-15000); const p = g.parents.find((x) => g.ageOf(x) >= 65); g.rel(p, 4); return 'They’re safe and comfortable. You visit on Sundays.'; } },
      { label: 'Let your siblings handle it', run: (g) => { for (const s of g.peopleBy('sibling')) g.rel(s, -15); g.karma(-3); return 'Holidays got tense.'; } },
    ],
  },
  {
    id: 'layoffs', title: 'Layoffs', icon: '📉',
    text: () => 'The company announces 20% layoffs. Everyone is nervous.',
    random: { when: (g) => !!g.s.job && CAREER_BY_ID[g.s.job.careerId].track !== 'special' && g.age >= 22, weight: 0.5 },
    choices: [
      { label: 'Keep your head down', hint: (g) => `Safe if performance is high (${Math.round(g.s.job?.perf ?? 0)})`, run: (g) => { if ((g.s.job?.perf ?? 0) >= 55 || g.chance(0.5)) return 'You survived the cut.'; const j = g.s.job; if (!j) return 'The layoffs came, but you were already gone.'; const sev = Math.round(CAREER_BY_ID[j.careerId].levels[j.level].pay * 2); fire(g, 'laid off'); g.money(sev); return `Laid off with ${fmt(sev)} severance.`; } },
    ],
  },
  {
    id: 'market_crash', title: 'Market Crash', icon: '📉',
    text: () => 'Stocks are in free fall. Your portfolio is bleeding red.',
    random: { when: (g) => g.flag('invest') > 2000, weight: 0.5, cooldown: 96 },
    choices: [
      { label: 'Hold and wait', run: (g) => { g.setFlag('invest', Math.round(g.flag('invest') * 0.7)); g.setFlag('rebound', g.s.clock + 18); return 'Down 30%. Historically, it comes back.'; } },
      { label: 'Sell everything', run: (g) => { const v = Math.round(g.flag('invest') * 0.75); g.setFlag('invest', 0); g.money(v); return `You locked in ${fmt(v)}. And the loss.`; } },
    ],
  },
  {
    id: 'distant_inheritance', title: 'A Lawyer Calls', icon: '📜',
    text: () => 'A great-uncle you barely knew left you something in his will.',
    random: { when: (g) => g.age >= 20, once: true, weight: 0.3 },
    choices: [{ label: 'Accept', run: (g) => { const amt = g.rand(5000, 80000); g.money(amt); g.burst('coins'); return `${fmt(amt)}. Thanks, Uncle Ferdinand.`; } }],
  },
  {
    id: 'lifestyle_health', title: 'The Doctor Is Worried', icon: '🩻',
    text: () => 'Your checkup results are not great. "Your lifestyle is catching up with you."',
    random: { when: (g) => g.age >= 35 && (g.flag('addict:alcohol') >= 40 || g.flag('addict:nicotine') >= 40 || g.s.stats.fitness < 20), cooldown: 60 },
    choices: [
      { label: 'Commit to changing', run: (g) => { for (const h of ['alcohol', 'nicotine'] as const) g.setFlag(`addict:${h}`, Math.max(0, g.flag(`addict:${h}`) - 20)); g.stat('mood', -4); g.stat('health', 4); return 'Salads, walks, and saying no. Day one.'; } },
      { label: 'Ignore it', run: (g) => { g.stat('health', -8); return 'You tossed the pamphlets.'; } },
    ],
  },

  // ================= system follow-ups
  {
    id: 'craving', title: (_g, c) => `${HABIT_LABEL[c.habit as Habit]} Craving`, icon: '🌀',
    text: (_g, c) => ({ alcohol: 'You need a drink. Badly.', nicotine: 'Your hands want a cigarette.', gambling: 'The casino lights keep flashing in your head.' } as Record<string, string>)[c.habit],
    choices: (g, c) => [
      { label: 'Give in', run: (gg) => { consume(gg, c.habit, 6); gg.stat('mood', 5); gg.money(-Math.min(gg.s.money, c.habit === 'gambling' ? 400 : 40)); return 'Relief. Then guilt.'; } },
      { label: 'Resist', run: (gg) => { gg.setFlag(`addict:${c.habit}`, Math.max(0, gg.flag(`addict:${c.habit}`) - 5)); gg.stat('mood', -6); return 'White knuckles. You made it through.'; } },
      { label: 'Call someone', when: () => g.peopleBy('friend', 'partner', 'spouse', 'mother', 'father', 'sibling').length > 0, run: (gg) => { gg.setFlag(`addict:${c.habit}`, Math.max(0, gg.flag(`addict:${c.habit}`) - 10)); gg.stat('mood', 3); return 'They talked you down. You’re not alone.'; } },
    ],
  },
  {
    id: 'novel_done', title: 'The Manuscript', icon: '📚',
    text: () => 'Your novel is finished. What now?',
    choices: [
      { label: 'Query literary agents', hint: checkHint('creativity', 60), run: (g) => { if (g.check('creativity', 60)) { const adv = g.rand(8000, 40000); g.money(adv); g.fame(8); g.milestone('Published a novel'); g.burst('confetti'); return `An agent loved it! A ${fmt(adv)} advance.`; } return 'Forty rejections. The forty-first might be different.'; } },
      { label: 'Self-publish', run: (g) => { const amt = g.rand(100, 3000); g.money(amt); g.fame(2); g.milestone('Self-published a novel'); return `It sold a few hundred copies. ${fmt(amt)}.`; } },
      { label: 'Keep it in a drawer', run: (g) => { g.stat('mood', 3); return 'Some stories are just for you.'; } },
    ],
  },
  {
    id: 'turn21', title: (g) => `You’re ${g.age}`, icon: '🥂',
    text: () => 'Bars, clubs and casinos are fully open to you now.',
    choices: [
      { label: 'Big night out', run: (g) => { g.stat('mood', 12); g.burst('confetti'); return 'Your friends made you wear a sash.'; } },
      { label: 'Quiet dinner', run: (g) => { g.stat('mood', 6); return 'A good meal with people you love.'; } },
    ],
  },
];

function crowned(g: Game, line: string) {
  if (g.chance(((g.s.stats.charm + g.s.stats.looks) / 200) * 0.4)) {
    g.fame(3);
    g.banner('👑 Prom Royalty', 0xf5b53a);
    return `${line} …And you were crowned prom royalty!`;
  }
  return line;
}
