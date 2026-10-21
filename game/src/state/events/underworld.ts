import type { Game } from '../Game';
import type { Person } from '../types';
import { caseById, convict, acquit, convictOdds, witnessProtection, LAWYER_COST, type Lawyer } from '../crime/justice';
import { activeCases, detectiveOf, detectiveTrait, DETECTIVE_LABEL, recomputeWanted } from '../crime/investigation';
import { startPursuit, endPursuit } from '../crime/pursuit';
import { TAG_LABEL } from '../crime/evidence';
import { freeCaptive } from '../crime/captives';
import { crew, hasRole, PRODUCT_BY_ID } from '../crime/drugs';
import { addGuilt, easeGuilt } from '../crime/guilt';
import { darkCrimeOn } from '../crime/consent';
import { itemCount } from '../inventory/items';
import { punish } from '../systems/trouble';
import { sendToJail } from '../systems/crime';
import { fmt } from '../systems/finance';
import { say } from '../npc/identity';
import { checkHint, type Ctx, type EventDef } from './types';

// Update 0.5 — Underworld events. Non-graphic: one line, then consequences.

const who = (g: Game, c: Ctx) => (c.pid ? g.personById(c.pid) : null);
const det = (g: Game) => detectiveOf(g);
const caseOf = (g: Game, c: Ctx) => (c.caseId ? caseById(g, c.caseId) : activeCases(g)[0] ?? null);

function trial(g: Game, c: Ctx, lawyer: Lawyer, mult = 1): string {
  const k = caseOf(g, c);
  if (!k) return 'The case fell apart.';
  if (g.age < 18) return punish(g, { name: k.name, sev: Math.min(3, k.sev), kind: 'other', by: 'police' });
  const cost = LAWYER_COST[lawyer](k.sev);
  g.money(-Math.min(cost, g.s.money));
  const odds = convictOdds(g, k, lawyer) - (hasRole(g, 'lawyer') ? 0.1 : 0);
  if (lawyer === 'crooked' && g.chance(0.2)) {
    g.s.crime.record.push('Jury tampering');
    return `The juror talked. ${convict(g, k, mult * 1.3)}`;
  }
  return Math.random() < odds ? convict(g, k, mult * (c.surrendered ? 0.7 : 1)) : acquit(g, k);
}

export const UNDERWORLD_EVENTS: EventDef[] = [
  // ======================= justice
  {
    id: 'arrest', title: 'Knock at the Door', icon: '🚔', who: (g) => det(g)?.id ?? null,
    text: (g, c) => say(`Detective {name} is at your door with a warrant. The charge: ${caseOf(g, c)?.name.toLowerCase() ?? 'something serious'}.`, det(g)),
    choices: [
      { label: 'Go quietly', run: (g, c) => { g.queue('court', { caseId: c.caseId }, true); return 'Cuffs. The back seat. The station.'; } },
      { label: 'Run', hint: checkHint('fitness', 55), run: (g, c) => { if (g.check('fitness', 55)) { g.s.underworld.wanted = Math.max(4, g.s.underworld.wanted); startPursuit(g); return 'Out the back window. You’re a fugitive now.'; } g.queue('court', { caseId: c.caseId }, true); return 'You didn’t make it to the fence.'; } },
    ],
  },
  {
    id: 'court', title: (g) => `The People v. ${g.s.name} ${g.s.familyName}`, icon: '⚖️',
    text: (g, c) => {
      const k = caseOf(g, c);
      const found = k?.found.map((t) => TAG_LABEL[t]).join(', ') || 'circumstantial';
      return `Charge: ${k?.name ?? 'unknown'}. The prosecution’s evidence: ${found}.${c.surrendered ? ' You turned yourself in — the judge noticed.' : ''}`;
    },
    choices: (g, c) => {
      const k = caseOf(g, c);
      const sev = k?.sev ?? 2;
      const pct = (l: Lawyer) => (k ? `${Math.round(convictOdds(g, k, l) * 100)}% conviction risk` : '');
      return [
        { label: 'Public defender (free)', hint: pct('public'), run: (gg) => trial(gg, c, 'public') },
        { label: `Private lawyer (${fmt(LAWYER_COST.private(sev))})`, hint: pct('private'), req: (gg) => (gg.canAfford(LAWYER_COST.private(sev)) ? null : 'Can’t afford'), run: (gg) => trial(gg, c, 'private') },
        { label: `Crooked lawyer (${fmt(LAWYER_COST.crooked(sev))})`, hint: `${pct('crooked')} · tampering risk`, req: (gg) => (gg.canAfford(LAWYER_COST.crooked(sev)) ? null : 'Can’t afford'), run: (gg) => trial(gg, c, 'crooked') },
        { label: 'Take the plea deal', hint: 'Guaranteed — half the sentence', run: (gg) => { const kk = caseOf(gg, c); return kk ? convict(gg, kk, c.surrendered ? 0.35 : 0.5) : ''; } },
        {
          label: 'Give up your crew for a deal',
          when: (gg) => crew(gg).length > 0 || !!gg.s.underworld.business,
          hint: 'Light sentence · witness protection · they want you dead',
          run: (gg) => { const kk = caseOf(gg, c); const out = kk ? convict(gg, kk, 0.2) : ''; gg.achieve('rat'); return `${out} ${witnessProtection(gg)}`; },
        },
      ];
    },
  },
  {
    id: 'police_interview', title: 'A Few Questions', icon: '🗂️', who: (g) => det(g)?.id ?? null,
    text: (g) => say(`Detective {name} (${DETECTIVE_LABEL[detectiveTrait(det(g))]}) slides a coffee across the table. "Just a few questions."`, det(g)),
    choices: [
      { label: 'Lawyer up', run: () => 'You said one word: “Lawyer.” They let you go. For now.' },
      { label: 'Lie', hint: checkHint('charm', 55), run: (g, c) => { const k = caseOf(g, c); g.s.underworld.coverStory++; if (g.check('charm', 55)) { if (k) k.progress = Math.max(0, k.progress - 15); return 'Smooth. They looked at each other and let you walk.'; } if (k) { k.progress += 15; k.suspect = true; } recomputeWanted(g); return 'Your story had a hole. They noticed.'; } },
      { label: 'Stay silent', run: (g, c) => { const k = caseOf(g, c); if (k && detectiveTrait(det(g)) === 'corrupt' && g.chance(0.5)) { k.board = true; return 'On your way out, you glimpse the evidence board.'; } return 'Silence. They wrote something down.'; } },
      { label: 'Confess', run: (g, c) => { g.queue('court', { caseId: c.caseId, surrendered: true }, true); easeGuilt(g, 30); return 'You told them everything. Your hands finally stopped shaking.'; } },
    ],
  },
  {
    id: 'evidence_found', title: 'They Found Something', icon: '🔎',
    text: (g, c) => { const k = caseOf(g, c); return `Word reaches you: investigators found new evidence (${k?.found.slice(-1).map((t) => TAG_LABEL[t]).join('') ?? 'unknown'}).`; },
    choices: [{ label: 'Stay calm', run: (g) => { g.stat('mood', -6); return 'Your heart hasn’t slowed down since.'; } }],
  },
  {
    id: 'manhunt', title: 'Manhunt', icon: '🚨',
    text: (_g, c) => (c.escaped ? 'Sirens behind the prison wall. Every cop in the state has your photo.' : 'Your face is on every screen. They know it was you.'),
    choices: [
      { label: 'Run', run: (g) => { g.s.underworld.wanted = Math.max(4, g.s.underworld.wanted); startPursuit(g); return 'You grabbed what you could and ran.'; } },
      { label: 'Turn yourself in', run: (g, c) => { const k = caseOf(g, c); if (k) g.queue('court', { caseId: k.id, surrendered: true }, true); else sendToJail(g, 18, 'Escape'); return 'You walked into the station with your hands up.'; } },
    ],
  },
  {
    id: 'caught_on_run', title: 'End of the Road', icon: '🛑',
    text: () => 'Lights in every direction. There’s nowhere left to go.',
    choices: [
      {
        label: 'It’s over',
        run: (g) => {
          endPursuit(g);
          if (g.s.underworld.wanted >= 5 && g.chance(itemCount(g, 'vest') ? 0.05 : 0.25)) { g.die('It ended on the highway'); return 'It ended on the highway.'; }
          const k = activeCases(g).find((x) => x.suspect) ?? activeCases(g)[0];
          if (k) g.queue('court', { caseId: k.id }, true);
          return 'Face down on the asphalt. Then the courthouse.';
        },
      },
    ],
  },
  {
    id: 'raid', title: 'Raid!', icon: '🚓',
    text: (g, c) => { const p = g.s.underworld.properties.find((x) => x.id === c.propId); return `Police are hitting your ${p?.kind ?? 'property'}.${itemCount(g, 'scanner') || p?.upgrades.includes('cameras') ? ' Your scanner crackled a warning minutes ago.' : ''}`; },
    choices: (g, c) => {
      const warned = itemCount(g, 'scanner') > 0 || !!g.s.underworld.properties.find((x) => x.id === c.propId)?.upgrades.includes('cameras');
      return [
        { label: 'Clear everything out', when: () => warned, run: (gg) => { if (gg.s.underworld.business) gg.s.underworld.business.stock = 0; for (const p of gg.s.people) if (p.status === 'captive') freeCaptive(p); gg.s.underworld.dirty = Math.round(gg.s.underworld.dirty * 0.6); return 'They found an empty room and a lot of bleach.'; } },
        {
          label: 'Hope they miss it',
          run: (gg) => {
            const u = gg.s.underworld;
            const prop = u.properties.find((x) => x.id === c.propId);
            if (prop?.upgrades.includes('compartment') && gg.chance(0.6)) return 'They missed the hidden compartment.';
            u.properties = u.properties.filter((x) => x.id !== c.propId);
            const k = activeCases(gg)[0];
            if (gg.s.people.some((p) => p.status === 'captive')) {
              for (const p of gg.s.people) if (p.status === 'captive') freeCaptive(p);
              if (k) { k.found.push('witness', 'trace'); k.suspect = true; }
              recomputeWanted(gg);
              gg.queue('manhunt', {}, true);
              return 'They found someone who shouldn’t have been there.';
            }
            u.business = null;
            u.dirty = 0;
            gg.queue('busted', { name: 'Possession with intent', sev: 4, kind: 'drugs', by: 'police' }, true);
            return 'They seized everything.';
          },
        },
      ];
    },
  },

  // ======================= captives (Dark Crime)
  {
    id: 'missing_flyer', title: 'Have You Seen Them?', icon: '📄', who: (_g, c) => c.pid,
    text: (g, c) => say('Flyers everywhere: MISSING — {name}. Someone who knows {them} stops you on the street. "Have you seen {them}?"', who(g, c)),
    choices: [
      { label: 'Lie to their face', hint: checkHint('charm', 50), run: (g, c) => { g.s.underworld.coverStory++; addGuilt(g, 4); if (!g.check('charm', 50)) { const k = activeCases(g).find((x) => x.victimId === c.pid); if (k) { k.suspect = true; k.found.push('motive'); } recomputeWanted(g); return 'Your voice cracked. They noticed.'; } return '“No. I hope they find them.”'; } },
      { label: 'Say nothing and walk away', run: (g) => { addGuilt(g, 2); return 'You kept walking. The flyer stayed in your pocket.'; } },
    ],
  },
  {
    id: 'captive_escaped', title: 'Gone', icon: '🏃', who: (_g, c) => c.pid,
    text: (g, c) => say('The door is open. {name} is gone.', who(g, c)),
    choices: [{ label: 'Panic', run: (g, c) => { const p = who(g, c); if (p) freeCaptive(p); const k = activeCases(g).find((x) => x.victimId === c.pid) ?? activeCases(g)[0]; if (k) { k.found.push('witness'); k.suspect = true; k.progress = Math.min(100, k.progress + 50); } recomputeWanted(g); g.fx({ type: 'shake', power: 6 }); return 'They’ll go straight to the police. You have hours, not days.'; } }],
  },
  {
    id: 'captive_crisis', title: 'They Need Help', icon: '🩺', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} isn’t well. Not at all.', who(g, c)),
    choices: [
      { label: 'Get them to a hospital', run: (g, c) => { const p = who(g, c); if (p) freeCaptive(p); const k = activeCases(g).find((x) => x.victimId === c.pid); if (k) { k.suspect = true; k.found.push('witness'); } recomputeWanted(g); g.karma(5); return 'You left them at the ER entrance and drove away.'; } },
      { label: 'Do nothing', run: (g, c) => { const p = who(g, c); if (p) { p.alive = false; p.status = 'dead'; } addGuilt(g, 30); const k = activeCases(g).find((x) => x.victimId === c.pid); if (k) { k.sev = 5; k.name = 'Manslaughter'; k.crimeId = 'murder_staged'; k.open.push('body'); } return 'By morning, they were gone. You did this.'; } },
    ],
  },
  {
    id: 'stockholm', title: 'Something Changed', icon: '🌀', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} has started talking to you. About {their} childhood. About you. It’s unsettling.', who(g, c)),
    choices: [{ label: 'Listen', run: (g) => { addGuilt(g, 5); return 'You don’t know what this is anymore.'; } }],
  },
  {
    id: 'blackmail_breaks', title: 'They Broke', icon: '💥', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} couldn’t take it anymore.', who(g, c)),
    choices: [
      {
        label: 'Find out what happened',
        run: (g, c) => {
          const p = who(g, c);
          const r = Math.random();
          if (r < 0.4) { const k = activeCases(g)[0]; if (k) k.suspect = true; return 'They went to the police with everything.'; }
          if (r < 0.75 && p) { p.status = 'moved'; addGuilt(g, 8); return say('{name} left town without a word. {Their} family blames you.', p); }
          if (p) p.tags.push('ruined');
          addGuilt(g, 15);
          return say('{name}’s life fell apart. Everyone knows whose fault it was.', p ?? null);
        },
      },
    ],
  },

  // ======================= the business & crew
  {
    id: 'drug_event', icon: '📦',
    title: (_g, c) => ({ rival: 'Rival Crew', dealer: 'Dealer Arrested', overdose: 'Bad Night', quality: 'Quality Scandal', supplier: 'Supplier Betrayal', raid: 'DEA Raid', cop: 'An Offer from a Cop', family: 'The Cash', cartel: 'The Cartel Calls' } as Record<string, string>)[c.kind],
    text: (g, c) => ({
      rival: 'A rival crew is moving into your territory.',
      dealer: 'One of your dealers got picked up. Will they talk?',
      overdose: 'Someone who bought from your people ended up in the hospital. The news is calling it a crisis.',
      quality: `Customers say this batch of ${g.s.underworld.business ? PRODUCT_BY_ID[g.s.underworld.business.product].name : 'product'} is garbage.`,
      supplier: 'Your supplier took the money and vanished.',
      raid: 'Federal agents are hitting a stash spot.',
      cop: 'A patrol cop leans in your car window: “20% and I see nothing.”',
      family: 'Someone close to you found a bag full of cash.',
      cartel: 'A soft-spoken man offers a partnership. It doesn’t sound like a question.',
    } as Record<string, string>)[c.kind],
    choices: (g, c) => {
      const b = g.s.underworld.business;
      const u = g.s.underworld;
      switch (c.kind) {
        case 'rival':
          return [
            { label: 'Hold your ground', hint: hasRole(g, 'muscle') ? 'Your muscle helps' : 'No muscle', run: (gg) => { if (hasRole(gg, 'muscle') || gg.check('street', 60)) { gg.stat('street', 3); return 'They backed off. For now.'; } if (b) b.territories.pop(); gg.heat(8); return 'You lost a corner.'; } },
            { label: 'Give up the territory', run: () => { if (b && b.territories.length > 1) b.territories.pop(); return 'Not worth the war.'; } },
          ];
        case 'dealer':
          return [
            { label: 'Pay for their lawyer ($8,000)', req: (gg) => (gg.canAfford(8000) ? null : 'Need $8,000'), run: (gg) => { gg.money(-8000); return 'They kept their mouth shut.'; } },
            { label: 'Hope they stay quiet', run: (gg) => { if (gg.chance(0.4)) { const k = activeCases(gg)[0]; if (k) { k.suspect = true; k.found.push('witness'); } recomputeWanted(gg); return 'They talked.'; } return 'Silence. Good.'; } },
          ];
        case 'overdose':
          return [{ label: 'Lie low', run: (gg) => { gg.karma(-10); addGuilt(gg, 8); gg.heat(10); return 'You turned off the news.'; } }];
        case 'quality':
          return [{ label: 'Fix the process', run: () => { if (b) b.quality = Math.min(100, b.quality + 15); return 'Next batch will be better.'; } }];
        case 'supplier':
          return [{ label: 'Eat the loss', run: (gg) => { const loss = Math.min(u.dirty, 8000); u.dirty -= loss; gg.stat('mood', -5); return `${fmt(loss)} gone.`; } }];
        case 'raid':
          return [{ label: 'Brace', run: (gg) => { if (b) b.stock = 0; if (hasRole(gg, 'lookout') && gg.chance(0.6)) return 'Your lookout saw them coming. Nothing found.'; u.dirty = Math.round(u.dirty * 0.5); gg.heat(15); return 'They took half your cash.'; } }];
        case 'cop':
          return [
            { label: 'Pay the cut', run: (gg) => { gg.heat(-20); u.dirty = Math.round(u.dirty * 0.8); gg.s.underworld.leverage['__cop'] = ['A cop on your payroll']; return 'A badge on your payroll.'; } },
            { label: 'Refuse', run: (gg) => { gg.heat(10); return 'He tapped the roof of your car. “Your loss.”'; } },
          ];
        case 'family':
          return [
            { label: 'Lie about it', hint: checkHint('charm', 55), run: (gg) => { gg.s.underworld.coverStory++; if (gg.check('charm', 55)) return '“It’s for a friend.” They let it go.'; const p = gg.partner ?? gg.parents[0]; if (p) p.trust = Math.max(0, p.trust - 30); return 'They didn’t believe a word.'; } },
            { label: 'Tell the truth', run: (gg) => { gg.queue('stash_found', {}, true); return 'You sat them down.'; } },
          ];
        default:
          return [
            { label: 'Accept', run: (gg) => { if (b) b.quality += 10; gg.heat(15); gg.stat('street', 5); return 'Bigger shipments. Bigger danger.'; } },
            { label: 'Refuse', run: (gg) => { gg.heat(5); return 'He smiled. That was worse than a threat.'; } },
          ];
      }
    },
  },
  {
    id: 'crew_betrayal', title: 'Disloyalty', icon: '🐀', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} has been skimming — and talking to people they shouldn’t.', who(g, c)),
    choices: [
      { label: 'Pay them off', req: (g) => (g.canAfford(5000) ? null : 'Need $5,000'), run: (g, c) => { g.money(-5000); const p = who(g, c); if (p) p.loyalty = 60; return 'Loyalty, bought. For now.'; } },
      { label: 'Cut them loose', run: (g, c) => { const p = who(g, c); if (p) { p.crewRole = undefined; p.rivalry = 70; } if (g.chance(0.4)) { const k = activeCases(g)[0]; if (k) k.suspect = true; recomputeWanted(g); return 'On the way out, they made a phone call.'; } return 'They walked. You watch your back now.'; } },
    ],
  },

  // ======================= heists
  {
    id: 'heist_plan', title: 'The Score', icon: '🗺️',
    text: () => 'Pick the target. Everything else follows.',
    choices: [
      { label: '🎰 Casino vault', run: (g) => heistNext(g, 'casino') },
      { label: '🏦 Bank', run: (g) => heistNext(g, 'bank') },
      { label: '🚚 Armoured truck', run: (g) => heistNext(g, 'truck') },
      { label: '🖼️ Art gallery', run: (g) => heistNext(g, 'gallery') },
    ],
  },
  {
    id: 'heist_entry', title: 'The Way In', icon: '🚪',
    text: () => 'How do you get in?',
    choices: [
      { label: 'Quiet (Smarts)', run: (g) => heistEntry(g, 'quiet') },
      { label: 'Inside man (Charm)', run: (g) => heistEntry(g, 'inside') },
      { label: 'Loud (Street)', run: (g) => heistEntry(g, 'loud') },
    ],
  },
  {
    id: 'heist_escape', title: 'The Way Out', icon: '🏎️',
    text: (g) => `Crew: ${crew(g).slice(0, 4).map((p) => `${p.name} (${p.crewRole})`).join(', ')}. How do you get out?`,
    choices: [
      { label: 'Getaway car', run: (g) => heistGo(g, 'car') },
      { label: 'Blend into the crowd', run: (g) => heistGo(g, 'crowd') },
      { label: 'Boat', when: (g) => g.s.underworld.properties.some((p) => p.kind === 'boat'), run: (g) => heistGo(g, 'boat') },
    ],
  },

  // ======================= guilt
  {
    id: 'guilt_event', icon: '🌑',
    title: (_g, c) => ({ nightmare: 'Nightmares', paranoia: 'Paranoia', confess: 'The Urge to Confess' } as Record<string, string>)[c.kind],
    text: (_g, c) => ({ nightmare: 'You wake up at 3am, soaked, the same scene playing again.', paranoia: 'The cashier looked at you too long. Do they know?', confess: 'You keep imagining walking into the station and saying it out loud.' } as Record<string, string>)[c.kind],
    choices: (_g, c) => [
      { label: 'Push it down', run: (g) => { g.stat('mood', -6); return 'It doesn’t go anywhere. It just waits.'; } },
      { label: c.kind === 'confess' ? 'Turn yourself in' : 'Talk to someone', run: (g) => { if (c.kind === 'confess') { const k = activeCases(g)[0]; if (k) { g.queue('court', { caseId: k.id, surrendered: true }, true); easeGuilt(g, 40); return 'You walked in. You said it.'; } } easeGuilt(g, 10); g.stat('mood', 4); return 'Saying some of it out loud helped.'; } },
    ],
  },

  // ======================= long tail
  {
    id: 'victim_family', title: 'The Vigil', icon: '🕯️', who: (_g, c) => c.pid,
    text: (g, c) => say('Candles outside {name}’s home. {Their} family is asking everyone what they know.', who(g, c)),
    choices: [
      { label: 'Attend and say the right things', hint: checkHint('charm', 55), run: (g, c) => { g.s.underworld.coverStory++; addGuilt(g, 6); if (!g.check('charm', 55)) { const k = activeCases(g).find((x) => x.victimId === c.pid); if (k) k.found.push('motive'); recomputeWanted(g); return 'A sibling stared at you a long time.'; } return 'You held a candle. Nobody suspects a thing.'; } },
      { label: 'Stay away', run: (g, c) => { if (g.chance(0.3)) { const k = activeCases(g).find((x) => x.victimId === c.pid); if (k && !k.found.includes('motive')) k.found.push('motive'); return 'People noticed you didn’t come.'; } return 'You couldn’t face it.'; } },
    ],
  },
  {
    id: 'cold_case', title: 'Cold Case Reopened', icon: '🧬',
    text: (g) => (g.s.underworld.inheritedCases ? 'A case from your parent’s past was reopened. Reporters are at your door.' : '“New technology” has reopened an old case. Your old case.'),
    choices: [{ label: 'Breathe', run: (g) => { g.stat('mood', -10); g.heat(15); recomputeWanted(g); return 'It’s not over. It was never over.'; } }],
  },
  {
    id: 'podcast_episode', title: (_g, c) => `True-Crime Podcast · Episode ${c.ep}`, icon: '🎙️',
    text: (_g, c) => (c.ep >= 4 ? 'The host’s theory is getting uncomfortably close to you.' : 'A podcaster is digging into an unsolved case. Your unsolved case.'),
    choices: [
      { label: 'Befriend the host', hint: checkHint('charm', 55), run: (g, c) => { const k = caseOf(g, c); if (g.check('charm', 55)) { if (k) k.podcast = Math.max(0, k.podcast - 2); return 'They trust you. They tell you what they know.'; } return 'They got curious about you.'; } },
      { label: 'Feed them a false lead', hint: checkHint('smarts', 60), run: (g, c) => { const k = caseOf(g, c); if (!g.check('smarts', 60) && k) { k.status = 'open'; k.suspect = true; return 'They saw through it. Episode 6 is about you.'; } return 'The next episode chased a ghost.'; } },
      { label: 'Ignore it', run: () => 'You stopped listening. Others didn’t.' },
    ],
  },
  {
    id: 'butterfly_witness', title: '“Wait — I’ve Seen You Before”', icon: '🦋',
    text: (g) => { const p = g.s.people.find((x) => x.alive && x.role === 'acquaintance'); return say('{name}, someone you met once, squints at you. "Weren’t you near… that night?"', p ?? null); },
    who: (g) => g.s.people.find((x) => x.alive && x.role === 'acquaintance')?.id ?? null,
    random: { when: (g) => activeCases(g).some((c) => c.sev >= 3) && g.s.people.some((x) => x.alive && x.role === 'acquaintance'), cooldown: 48 },
    choices: [
      { label: 'Laugh it off', hint: checkHint('charm', 50), run: (g) => { if (g.check('charm', 50)) return '“Must’ve been my twin.” They laughed.'; const k = activeCases(g)[0]; if (k) k.found.push('witness'); recomputeWanted(g); return 'They didn’t laugh.'; } },
    ],
  },
  {
    id: 'stash_found', title: 'They Know', icon: '💼', who: (g) => (g.partner ?? g.parents[0])?.id ?? null,
    text: (g) => say('{name} found the cash — and figured out where it came from.', g.partner ?? g.parents[0] ?? null),
    random: { when: (g) => g.age >= 18 && g.s.underworld.dirty > 5000 && !!(g.partner ?? g.parents[0]), cooldown: 60 },
    choices: (g) => {
      const p: Person | null = g.partner ?? g.parents[0] ?? null;
      return [
        {
          label: 'Ask them to stand by you',
          run: () => {
            if (!p) return '';
            const r = Math.random() + (p.trust - 50) / 100;
            if (r > 0.9) { p.trust = 100; return say('{name} took your hand. "Then we’re in this together."', p); }
            if (r > 0.45) { p.role = p.role === 'spouse' || p.role === 'partner' ? 'ex' : p.role; p.rel = 10; return say('{name} packed a bag and left.', p); }
            if (r > 0.2) { g.s.underworld.leverage[`__on_me:${p.id}`] = ['They know everything']; return say('{name} smiled thinly. "This stays between us — for a price."', p); }
            const k = activeCases(g)[0]; if (k) { k.suspect = true; k.found.push('witness'); } recomputeWanted(g);
            return say('{name} called the police.', p);
          },
        },
      ];
    },
  },
  {
    id: 'kid_learns', title: 'Your Kid Knows', icon: '🧒', who: (g) => g.peopleBy('child').find((k) => g.ageOf(k) >= 13)?.id ?? null,
    text: (g) => say('{name} overheard a phone call. {They} know{s} what you do.', g.peopleBy('child').find((k) => g.ageOf(k) >= 13) ?? null),
    random: { when: (g) => g.flag('crimes05') >= 3 && g.peopleBy('child').some((k) => g.ageOf(k) >= 13), cooldown: 96 },
    choices: [
      { label: 'Tell them the truth', run: (g) => { const k = g.peopleBy('child').find((x) => g.ageOf(x) >= 13); if (k) { k.rel -= 20; k.tags.push(g.chance(0.5) ? 'wantsin' : 'wantscop'); } return 'They’ll make their own choices now.'; } },
      { label: 'Deny everything', run: (g) => { const k = g.peopleBy('child').find((x) => g.ageOf(x) >= 13); if (k) { k.trust -= 25; } g.s.underworld.coverStory++; return 'They don’t believe you. They stop asking.'; } },
    ],
  },
  {
    id: 'moral_dilemma', title: 'A Choice', icon: '⚖️',
    text: (g) => { const r = g.s.people.find((p) => p.labels.includes('rival') && p.alive); return say('{name}, your rival, is in serious trouble. You could help — or let it happen.', r ?? null); },
    who: (g) => g.s.people.find((p) => p.labels.includes('rival') && p.alive)?.id ?? null,
    random: { when: (g) => darkCrimeOn() && g.age >= 18 && g.s.people.some((p) => p.labels.includes('rival') && p.alive), cooldown: 96, weight: 0.4 },
    choices: [
      { label: 'Help them', run: (g) => { const r = g.s.people.find((p) => p.labels.includes('rival')); if (r) { r.rivalry = 10; r.rel = 50; } g.karma(10); easeGuilt(g, 10); return 'They’ll never understand why. Neither will you.'; } },
      { label: 'Walk away', run: (g) => { g.karma(-6); addGuilt(g, 5); return 'You told yourself it wasn’t your problem.'; } },
    ],
  },
];

// ---------------- heist helpers
function heistNext(g: Game, target: 'casino' | 'bank' | 'truck' | 'gallery') {
  g.s.underworld.heist = { target, entry: '', escape: '', crew: crew(g).slice(0, 4).map((p) => p.id) };
  g.queue('heist_entry', {}, true);
  return `Target: ${target}.`;
}
function heistEntry(g: Game, entry: string) {
  if (g.s.underworld.heist) g.s.underworld.heist.entry = entry;
  g.queue('heist_escape', {}, true);
  return `Entry: ${entry}.`;
}
function heistGo(g: Game, escape: string) {
  const h = g.s.underworld.heist;
  g.s.underworld.heist = null;
  if (!h) return '';
  const stat = h.entry === 'quiet' ? 'smarts' : h.entry === 'inside' ? 'charm' : 'street';
  const crewBonus = h.crew.length * 4 + (hasRole(g, 'driver') && escape === 'car' ? 8 : 0);
  const complication = g.pick(['an alarm nobody mentioned', 'a guard on overtime', 'a jammed lock', 'a crew member’s nerves']);
  const ok = g.check(stat, 70 - crewBonus);
  if (ok) {
    const take = { casino: [300000, 900000], bank: [200000, 700000], truck: [80000, 250000], gallery: [400000, 1200000] }[h.target];
    const amt = g.rand(take[0], take[1]);
    g.s.underworld.dirty += amt;
    g.heat(40);
    g.achieve('heist');
    g.banner('💰 SCORE', 0xf5b53a);
    g.s.underworld.news = { text: `Daring ${h.target} heist baffles police`, until: g.s.clock + 2 };
    g.s.underworld.cases.push({ id: `heist-${g.s.turn}`, crimeId: 'smuggle', name: `${h.target} heist`, sev: 4, clock: g.s.clock, open: ['camera', 'vehicle', 'money'], found: [], progress: 0, wanted: 0, status: 'open', board: false, podcast: 0, suspect: false });
    return `Despite ${complication}, you got out with ${fmt(amt)}.`;
  }
  g.queue('busted', { name: 'Armed robbery', sev: 4, kind: 'theft', by: 'police' }, true);
  return `${complication[0].toUpperCase() + complication.slice(1)} ruined everything.`;
}
