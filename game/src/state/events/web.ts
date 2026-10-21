import { checkHint, type EventDef } from './types';
import { bump } from '../npc/interactions';
import { say } from '../npc/identity';
import { setMad } from '../npc/mood';
import { pcScore } from '../pc/build';

// Update 0.8 — things that happen online. The online-minor event is a safety event: it ends romance for good.

export const WEB_EVENTS: EventDef[] = [
  {
    id: 'web_malware', title: 'Your Computer Is Infected!', icon: '🦠',
    text: () => 'Pop-ups everywhere. A voice says to call “Tech Support” and pay in gift cards.',
    choices: [
      { label: 'Pay the “technician” ($200)', run: (g) => { g.money(-Math.min(200, g.s.money)); return 'It was a scam. Of course it was. The pop-ups are still there.'; } },
      { label: 'Wipe and reinstall', hint: checkHint('smarts', 40), run: (g) => { if (g.check('smarts', 40)) return 'Clean install. Lesson learned.'; g.money(-Math.min(80, g.s.money)); return 'You had to take it to a repair shop. $80.'; } },
    ],
  },
  {
    id: 'web_history', title: 'Browser History', icon: '🫣', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} borrowed your computer and found your browser history.', g.personById(c.pid), g.s.name),
    choices: [
      { label: 'Laugh it off', hint: checkHint('charm', 50), run: (g, c) => { const p = g.personById(c.pid); if (g.check('charm', 50)) return 'You both laughed until it stopped being awkward.'; if (p) { bump(p, 'trust', -6); setMad(g, p, 'found your history'); } return 'It did not stop being awkward.'; } },
      { label: 'Have an honest talk', run: (g, c) => { const p = g.personById(c.pid); if (p) bump(p, 'trust', 3); return 'Weird conversation. Good conversation.'; } },
    ],
  },
  {
    id: 'web_scam', title: 'Free Gift Card!', icon: '🎁',
    text: () => '“Click here to claim your $500 gift card!!”',
    choices: [
      { label: 'Click it', run: (g) => { const loss = Math.min(g.s.money, g.rand(50, 300)); g.money(-loss); return `It emptied $${loss} from your account.`; } },
      { label: 'Report and block', run: (g) => { g.karma(1); return 'Reported. The mods thanked you.'; } },
    ],
  },
  {
    id: 'web_dox', title: 'Doxxed', icon: '📍',
    text: () => 'Someone posted where you live. Strangers are sharing it.',
    choices: [
      { label: 'Report everything', run: (g) => { g.stat('mood', -6); return 'Took days, but the posts came down.'; } },
      { label: 'Go private for a while', run: (g) => { g.fame(-3); g.stat('mood', -3); return 'You disappeared from the internet for a month.'; } },
    ],
  },
  {
    // HARD RULE: an online contact who turns out to be under 18 can never be a romance option again.
    id: 'online_minor', title: 'They’re Not Who They Said', icon: '🛑', who: (_g, c) => c.pid,
    text: (g, c) => say('{name} said {they} {is} an adult. {They} {is} actually a minor. Any romance is over — permanently.', g.personById(c.pid), g.s.name),
    choices: [
      { label: 'Report and block', run: (g, c) => { const p = g.personById(c.pid); if (p) { p.tags.push('noRomance'); p.blocked = true; p.hasNumber = false; p.romance = 0; p.attraction = 0; } g.karma(3); return 'You reported the profile and blocked them. The right call.'; } },
      { label: 'End contact', run: (g, c) => { const p = g.personById(c.pid); if (p) { p.tags.push('noRomance'); p.hasNumber = false; p.romance = 0; p.attraction = 0; p.status = 'moved'; } return 'You stopped replying and left the server.'; } },
    ],
  },
  {
    id: 'pc_overheat', title: 'Overheating', icon: '🔥',
    text: () => 'Your PC shuts down mid-game. It smells like hot plastic. (Did you forget the thermal paste?)',
    choices: [
      { label: 'Reapply thermal paste', hint: checkHint('smarts', 35), run: (g) => { if (g.check('smarts', 35)) { g.s.pc.noPaste = false; g.s.pc.score = pcScore(g.s.pc.parts, false, g.s.pc.mess); return 'Thin pea-sized dot. Temps are perfect now.'; } return 'You made a mess. Still hot. Try again next month.'; } },
      { label: 'Ignore it', run: (g) => { g.stat('mood', -2); return 'It’ll be fine. (It will not be fine.)'; } },
    ],
  },
];
