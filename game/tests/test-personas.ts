// Update 0.12 — personas (shy, otaku, nerd, yandere), the yandere partner, the anonymous stalker, shy confessions,
// admirer encounters, Spark personas, the end-of-date asks, house parties and shorter college degrees.
import { check, done, resolveAll } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import type { Person } from '../src/state/types';
import { PERSONA, makeYandere, personaShown, rollPersona, setPersona } from '../src/state/npc/persona';
import { VOICE, voiced } from '../src/state/phone/voice';
import { chipsFor, sendChip } from '../src/state/phone/chat';
import { sendText } from '../src/state/phone/texts';
import { contextReplies, pendingMessage } from '../src/state/phone/convo';
import { YANDERE_LIMIT } from '../src/state/systems/yandere';
import { ANON_REPLIES, STALK_REVEAL, acceptStalker, anonReply, refuseStalker, startStalking, stalkerMonth } from '../src/state/systems/stalker';
import { SHY_DEPRESSED, SHY_HOSPITAL, acceptShy, inHospital, isDepressed, refuseShy, shyMonth } from '../src/state/systems/shy';
import { nextProfile, swipe } from '../src/state/systems/dating';
import { ADMIRER_LOCS, admirerEncounter } from '../src/state/encounters/pools';
import { finishDate, startDate } from '../src/state/datenight/date';
import { AFTER_AT } from '../src/state/datenight/after';
import { interactionsFor } from '../src/state/npc/interactions';
import { zoneLabel } from '../src/state/nightlife/types';
import { PROGRAM_BY_ID } from '../src/state/data/programs';
import { hydrate } from '../src/state/save';

applySettings({ ageConfirmed: true, isAdult: true, mature: true, darkCrime: true });
const mk = (age = 24, gender: 'male' | 'female' = 'male') => {
  const g = createLife({ name: 'P', familyName: 'Q', gender, background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age >= 18 ? 23 : 14 });
  g.s.bornAt -= (age - (age >= 18 ? 23 : 14)) * 12;
  g.s.sexuality = 'straight';
  g.s.money = 20000;
  g.setFlag('hadFirstTime');
  g.give('phone');
  return g;
};
const contact = (g: Game, gender: Person['gender'], age = 25, role: Person['role'] = 'friend') => {
  const p = g.addPerson(role, { age, gender });
  p.hasNumber = true;
  p.theyHaveNumber = true;
  p.rel = 60;
  return p;
};

// ---------- college: half as long (your correction); high school and trades unchanged
{
  check('a bachelor’s takes 2 years (was 4)', PROGRAM_BY_ID.uni_cs.length === 24 && PROGRAM_BY_ID.uni_med.length === 24);
  check('grad school halved too (MD 2 years, JD 18 months, MBA 1 year)', PROGRAM_BY_ID.grad_md.length === 24 && PROGRAM_BY_ID.grad_jd.length === 18 && PROGRAM_BY_ID.grad_mba.length === 12);
  check('community college halved', PROGRAM_BY_ID.cc_assoc.length === 12);
  check('high school and trade school unchanged', PROGRAM_BY_ID.hs.length === 48 && PROGRAM_BY_ID.trade_elec.length === 24);
  const g = mk();
  g.s.education.current = { program: 'uni_cs', months: 30, length: 48, perf: 60, skips: 0, attended: 0, warnings: 0, funding: 'cash' };
  const s = hydrate(JSON.parse(JSON.stringify(g.s)));
  check('a degree already under way is shortened in old saves', s?.education.current?.length === 24);
}

// ---------- personas: who can be what
{
  const teen = mk(16);
  let teenY = 0;
  for (let i = 0; i < 3000; i++) if (rollPersona(teen, 16, 'female') === 'yandere') teenY++;
  check('nobody is a yandere with (or as) a minor', teenY === 0);
  const g = mk();
  let sameSexY = 0;
  for (let i = 0; i < 3000; i++) if (rollPersona(g, 25, 'male') === 'yandere') sameSexY++;
  check('yanderes are always the opposite sex to you', sameSexY === 0);
  const y = makeYandere(g, 'acquaintance', 'Library')!;
  check('a yandere: adult, opposite sex, stunning, into you', g.ageOf(y) >= 18 && y.gender === 'female' && y.tags.includes('stunning') && y.attraction >= 80);
  check('…and their profile only says “maybe a bit passionate”', personaShown(y) === PERSONA.yandere.shown && /passionate/i.test(personaShown(y)) && !/yandere/i.test(personaShown(y)));
}

// ---------- they sound like who they are, want what they want, and text you about it
{
  const g = mk();
  const o = contact(g, 'female');
  setPersona(o, 'otaku');
  const n = contact(g, 'male');
  setPersona(n, 'nerd');
  let heard = false;
  for (let i = 0; i < 40 && !heard; i++) heard = VOICE.otaku.greet.includes(voiced(g, o, 'greet', true, 'hey'));
  check('an otaku answers in their own voice', heard);
  check('people without a persona sound like before', voiced(g, { ...o, persona: undefined } as Person, 'greet', true, 'x') === 'x');
  const oc = chipsFor(g, o, 'talk').map((c) => c.chip.id);
  const nc = chipsFor(g, n, 'talk').map((c) => c.chip.id);
  check('otaku: anime chips; nerd: tech chips (and not each other’s)', oc.includes('p_anime') && !oc.includes('p_build') && nc.includes('p_build') && !nc.includes('p_anime'));
  const r0 = o.rel;
  sendChip(g, o.id, 'p_anime');
  check('talking anime with an otaku lands', o.rel > r0);
  for (const persona of ['shy', 'otaku', 'nerd', 'yandere'] as const) {
    const p = contact(g, 'female');
    setPersona(p, persona);
    sendText(g, p, `p_${persona}`, `${p.name}: "hi"`);
    const m = pendingMessage(g, p.id);
    check(`${persona} openers have their own replies`, !!m && contextReplies(g, p, m).length >= 3);
  }
}

// ---------- a yandere partner: text someone of their sex too much and that person is gone. Never caught.
{
  const g = mk();
  const y = contact(g, 'female', 25, 'partner');
  setPersona(y, 'yandere');
  const her = contact(g, 'female');
  const him = contact(g, 'male');
  const kid = contact(g, 'female', 16);
  const heat0 = g.s.heat;
  for (let i = 0; i < YANDERE_LIMIT; i++) { sendChip(g, her.id, 'howday'); sendChip(g, him.id, 'howday'); sendChip(g, kid.id, 'howday'); }
  check('Dark Crime on: the woman you texted too much is found dead', !her.alive && her.status === 'dead' && g.queued('yandere_news'));
  check('…the man you texted is fine (not their sex)', him.alive && him.status === 'alive');
  check('…a minor is never a target', kid.alive && kid.status === 'alive');
  check('…and the police never come for anyone', g.s.heat === heat0);
  resolveAll(g);
  applySettings({ darkCrime: false });
  const h = mk();
  const y2 = contact(h, 'female', 25, 'partner');
  setPersona(y2, 'yandere');
  const other = contact(h, 'female');
  for (let i = 0; i < YANDERE_LIMIT; i++) sendChip(h, other.id, 'howday');
  check('Dark Crime off: they’re scared out of town instead', other.alive && other.status === 'moved');
  applySettings({ darkCrime: true });
}

// ---------- the anonymous stalker
{
  const minor = mk(16);
  const yy = minor.addPerson('acquaintance', { age: 20, gender: 'female' });
  setPersona(yy, 'yandere');
  check('a minor is never stalked', !startStalking(minor, yy));
  const g = mk();
  const y = makeYandere(g, 'acquaintance', 'Park')!;
  g.log('🏋️ You lifted weights at the gym.', 'info');
  check('a yandere admirer starts texting from an unknown number', startStalking(g, y) && !!g.s.stalker);
  // photos come 60% of months: watch long enough to see both (reveal waits in the queue)
  for (let i = 0; i < 12; i++) { g.s.clock++; stalkerMonth(g); }
  check('the reveal comes after a few months', STALK_REVEAL === 4 && g.queued('stalker_reveal'));
  g.s.events = [];
  const anon = g.s.stalker!.msgs.filter((m) => m.from === 'anon');
  check('they know what you did and send photos of you', anon.some((m) => /gym|bank|\$/.test(m.text)) && anon.some((m) => !!m.photo));
  check('anonymous chat has its own replies: escape or give in', ANON_REPLIES.some((r) => r.id === 'block') && ANON_REPLIES.some((r) => r.id === 'police') && ANON_REPLIES.some((r) => r.id === 'listen'));
  let escaped = false;
  for (let i = 0; i < 60 && !escaped; i++) {
    const k = mk();
    startStalking(k, makeYandere(k, 'acquaintance', 'Park')!);
    k.s.clock++;
    anonReply(k, 'block');
    escaped = !k.s.stalker;
    if (escaped) check('you can get away (they’re never caught)', k.s.people.some((p) => p.persona === 'yandere' && p.status === 'moved'));
  }
  check('blocking can work', escaped);
  g.s.clock++;
  anonReply(g, 'listen');
  check('surrendering brings the reveal', g.currentEvent?.id === 'stalker_reveal' || g.queued('stalker_reveal'));
  acceptStalker(g);
  check('accept their love: you’re together, the unknown number is gone', y.role === 'dating' && !g.s.stalker);
  let killed = 0;
  let gone = 0;
  for (let i = 0; i < 80 && (!killed || !gone); i++) {
    const k = mk();
    const s = makeYandere(k, 'acquaintance', 'Park')!;
    startStalking(k, s);
    refuseStalker(k);
    if (k.s.dead) killed++;
    else if (!s.alive) gone++;
  }
  check('refuse (Dark Crime on): 50/50 — they kill you, or they end their own life', killed > 0 && gone > 0, `${killed}/${gone}`);
  applySettings({ darkCrime: false });
  const k = mk();
  const s = makeYandere(k, 'acquaintance', 'Park')!;
  startStalking(k, s);
  refuseStalker(k);
  check('refuse (Dark Crime off): they vanish, nobody dies', !k.s.dead && s.alive && s.status === 'moved');
  applySettings({ darkCrime: true });
}

// ---------- a shy confession: they faint
{
  const g = mk();
  const p = contact(g, 'female', 24, 'crush');
  setPersona(p, 'shy');
  p.sexuality = 'straight';
  p.attraction = 80;
  for (let i = 0; i < 60 && !g.queued('shy_confess'); i++) { g.s.clock++; shyMonth(g); }
  check('a shy person who loves you eventually confesses', g.queued('shy_confess'));
  acceptShy(g, p);
  check('say yes: dating, and they spend 2 months in hospital', p.role === 'dating' && inHospital(g, p) && SHY_HOSPITAL === 2);
  check('…no outings while they’re in hospital', interactionsFor(g, p).filter((r) => ['date', 'hangout'].includes(r.def.id)).every((r) => r.reason === 'In hospital'));
  g.s.clock += SHY_HOSPITAL;
  check('…then they’re out', !inHospital(g, p));
  const q = contact(g, 'female', 24, 'crush');
  setPersona(q, 'shy');
  refuseShy(g, q);
  check('say no: they’re depressed', isDepressed(g, q) && q.mood <= 15);
  g.s.clock += SHY_DEPRESSED;
  shyMonth(g);
  check('…until they recover', !isDepressed(g, q) && q.mood >= 55);
}

// ---------- admirers find you; Spark shows personas
{
  check('admirers at the library, clubs, bars, the park, work and college', ['library', 'club', 'bar', 'park', 'work', 'campus'].every((l) => ADMIRER_LOCS.includes(l)));
  const g = mk();
  admirerEncounter(g, 'library');
  const ev = g.currentEvent;
  const p = ev ? g.personById(ev.ctx.pid) : null;
  check('an admirer walks up (into you)', ev?.id === 'encounter' && ['admirer', 'yandere'].includes(ev.ctx.kind) && !!p && p.attraction >= 55);
  let teenY = 0;
  for (let i = 0; i < 200; i++) { const t = mk(16); admirerEncounter(t, 'park'); const q = t.currentEvent && t.personById(t.currentEvent.ctx.pid); if (q?.persona === 'yandere') teenY++; }
  check('teens never meet a yandere', teenY === 0);
  let yp = null;
  for (let i = 0; i < 6000 && !yp; i++) { const pr = nextProfile(g); if (pr.persona === 'yandere') yp = pr; }
  check('Spark shows personas — a yandere as “maybe a bit passionate”', !!yp && personaShown(yp).includes('passionate'));
  g.s.flags.swipes = 0;
  const r = yp ? swipe(g, yp, true) : null;
  const m = yp ? g.personById(yp.id) : null;
  check('match a yandere: they’re stunning, and very into you', !!r && (!r.matched || (!!m && m.persona === 'yandere' && m.tags.includes('stunning') && m.attraction >= 80)));
}

// ---------- the end of a date: how it went decides what you can ask
{
  const g = mk();
  const p = contact(g, 'female', 25, 'talking');
  p.sexuality = 'straight';
  p.romance = 40;
  startDate(g, p, 'restaurant');
  g.s.date!.spark = 75;
  finishDate(g);
  const ch = g.currentEvent?.id === 'date_after' ? g.choicesFor(g.currentEvent).map((c) => c.choice.label) : [];
  check('a great date (75): second date, friends with benefits or a one-night stand', ch.some((l) => /second date/.test(l)) && ch.some((l) => /benefits/.test(l)) && ch.some((l) => /One-night/.test(l)));
  resolveAll(g);
  startDate(g, p, 'restaurant');
  g.s.date!.spark = 50;
  finishDate(g);
  const mid = g.currentEvent?.id === 'date_after' ? g.choicesFor(g.currentEvent).map((c) => c.choice.label) : [];
  check('a nice date (50): only a second date', mid.some((l) => /second date/.test(l)) && !mid.some((l) => /benefits|One-night/.test(l)) && AFTER_AT.fwb === 60 && AFTER_AT.ons === 70);
  resolveAll(g);
  startDate(g, p, 'restaurant');
  g.s.date!.spark = 20;
  finishDate(g);
  check('an awkward date: nothing to ask', g.currentEvent?.id !== 'date_after');
}

// ---------- house parties: the night-out scene in a house
{
  const g = mk(19);
  g.s.education.current = { program: 'uni_cs', months: 1, length: 24, perf: 60, skips: 0, attended: 0, warnings: 0, funding: 'cash' };
  g.s.phase = 3;
  g.doActivity('campus_party');
  const n = g.s.night;
  check('a house party opens the night-out scene', n?.venue === 'house' && n.type === 'houseparty');
  // (an ex or a rival who shows up can be any adult age; the month ticks over at night, so a 25-year-old can turn 26)
  check('…college crowd (18–25)', !!n && n.crowd.filter((c) => !c.known).every((c) => g.ageOf(c.p) >= 18 && g.ageOf(c.p) <= 26) && n.crowd.every((c) => g.ageOf(c.p) >= 18));
  check('…in a house: kitchen, living room, backyard, upstairs', zoneLabel('house', 'bar').includes('Kitchen') && zoneLabel('house', 'vip').includes('Upstairs'));
  check('…19 under US law: wristband, no drinks', !!n && n.wristband);
}

done();
