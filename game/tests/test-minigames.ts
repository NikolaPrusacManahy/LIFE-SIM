// Update 0.12 — activity minigames (coding, cooking, writing, gym) and the new personas
// (book nerd, gamer, gyaru, gold digger), plus who you meet where.
import { check, done } from './harness';
import { applySettings } from '../src/state/settings';
import { createLife, randomLook } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import type { Person } from '../src/state/types';
import { ACT_BY_ID } from '../src/state/activities';
import { CODE_FIRST, LANGS, LANG_ORDER, PROJECTS, blanksOf, buildOutput, codeScore, projectsFor } from '../src/state/minigames/code';
import { FOODS, act, cookScore, freshPan, heat } from '../src/state/minigames/cook';
import { TEMPLATES, compose, saveNote } from '../src/state/minigames/write';
import { GYM_KEYS, GYM_MAX, GYM_SECONDS, GYM_SWAP, gymGains, keyFor, pressedKey } from '../src/state/minigames/gym';
import { PERSONA, personaOk, rollPersona, setPersona } from '../src/state/npc/persona';
import { VOICE } from '../src/state/phone/voice';
import { CONTEXT } from '../src/state/phone/convo';
import { GOLD_PRICE, goldLock } from '../src/state/npc/golddigger';
import { doInteraction, interactionsFor } from '../src/state/npc/interactions';
import { FRIEND_ACTIONS, onlineFriends } from '../src/state/web/discorb';
import { PLACE_PERSONAS } from '../src/state/encounters/pools';
import { nextProfile } from '../src/state/systems/dating';
import { itemCount } from '../src/state/inventory/items';
import { portraitOptions } from '../src/fx/portrait';

applySettings({ ageConfirmed: true, isAdult: true, mature: true });
const mk = (age = 24) => {
  const g = createLife({ name: 'M', familyName: 'G', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook(), startAge: age >= 18 ? 23 : 14 });
  g.s.bornAt -= (age - (age >= 18 ? 23 : 14)) * 12;
  g.s.sexuality = 'straight';
  g.s.money = 50000;
  g.give('laptop');
  g.s.phase = 1;
  return g;
};

// ---------- coding: always pick a language; guided blanks; build
{
  // final touch: 3 more languages (Java, C#, Rust) and 2 more projects per language
  check('six languages, each with its own IDE (C++ = Visual Studio, HTML/JS = VS Code, Java, C#, Rust)', LANG_ORDER.length === 6 && LANGS.cpp.ide === 'Visual Studio' && LANGS.web.ide === 'VS Code' && LANGS.python.name === 'Python' && ['java', 'csharp', 'rust'].every((l) => LANG_ORDER.includes(l as never)));
  check('project ids are unique', new Set(PROJECTS.map((p) => p.id)).size === PROJECTS.length);
  check('every language has 4 guided projects, every blank has an instruction', LANG_ORDER.every((l) => projectsFor(l).length === 4) && PROJECTS.every((p) => blanksOf(p).length >= 3 && blanksOf(p).every((b) => b.hint && b.answer)));
  check('a C++ game loop lesson exists', PROJECTS.some((p) => p.lang === 'cpp' && /loop/i.test(p.name)));
  const p = PROJECTS[0];
  const right = blanksOf(p).map((b) => b.answer);
  check('all blanks right: score 1, the build succeeds', codeScore(p, right) === 1 && buildOutput(p, right).ok);
  const half = right.map((a, i) => (i % 2 ? 'oops' : a));
  check('mistakes: lower score, the build fails with errors', codeScore(p, half) < 1 && !buildOutput(p, half).ok && buildOutput(p, half).lines.length > 1);
  check('code is case-sensitive (While ≠ while)', codeScore(p, right.map((a) => (a === 'while' ? 'While' : a))) < 1);
  const g = mk();
  const s0 = g.s.stats.smarts;
  g.mini = { kind: 'code', score: 1, lang: 'python' };
  g.doActivity('code');
  const s1 = g.s.stats.smarts - s0;
  const h = mk();
  h.give('laptop');
  const t0 = h.s.stats.smarts;
  h.mini = { kind: 'code', score: 0, lang: 'cpp' };
  h.doActivity('code');
  check('a clean build teaches more than a failed one', s1 > h.s.stats.smarts - t0 && g.flag('lang:python') === 1);
  // finished projects teach more: the first ship of a project beats a repeat; shipping all 4 masters the language
  const f = mk();
  const proj = projectsFor('rust');
  f.mini = { kind: 'code', score: 1, lang: 'rust', project: proj[0].id };
  f.doActivity('learn_code');
  const firstCoder = f.flag('coder');
  f.s.usedThisSlot = { turn: -1, ids: [] }; f.s.phase = 1; f.s.stats.energy = 100; f.s.events = [];
  f.mini = { kind: 'code', score: 1, lang: 'rust', project: proj[0].id };
  f.doActivity('learn_code');
  const repeat = f.flag('coder') - firstCoder;
  check('first time a project ships gives a bigger learning boost than a repeat', firstCoder - repeat === CODE_FIRST.coder && f.flag(`shipped:${proj[0].id}`) === 1, `${firstCoder} vs ${repeat}`);
  for (const x of proj.slice(1)) { f.s.usedThisSlot = { turn: -1, ids: [] }; f.s.phase = 1; f.s.stats.energy = 100; f.s.events = []; f.mini = { kind: 'code', score: 1, lang: 'rust', project: x.id }; f.doActivity('learn_code'); }
  check('shipping all 4 projects masters the language', f.flag('mastered:rust') === 1);
  const n = mk();
  n.mini = { kind: 'code', score: 0.5, lang: 'java', project: 'java_hello' };
  n.doActivity('learn_code');
  check('a failed build ships nothing', !n.flag('shipped:java_hello'));
  check('coding activities all use the minigame', ['code', 'learn_code', 'hackathon'].every((id) => ACT_BY_ID[id]?.mini === 'code'));
}

// ---------- cooking: oil, cook in the window, flip/mix, season
{
  const f = FOODS.steak;
  let s = act(f, freshPan(), 'oil');
  s = heat(f, s, 5.5);
  s = act(f, s, 'flip');
  s = heat(f, s, 5.5);
  s = act(f, s, 'season');
  check('a well-cooked steak scores high', cookScore(f, s).score >= 0.9, JSON.stringify(cookScore(f, s)));
  const burnt = heat(f, act(f, freshPan(), 'oil'), 20);
  check('leave it on: burnt, low score', cookScore(f, burnt).score < 0.5 && cookScore(f, burnt).notes.includes('burnt'));
  const salty = [1, 2, 3, 4].reduce((p) => act(f, p, 'season'), s);
  check('too much seasoning is noticed', cookScore(f, salty).notes.includes('too salty'));
  const e = FOODS.eggs;
  let eggs = act(e, act(e, freshPan(), 'oil'), 'mix');
  eggs = act(e, heat(e, eggs, 5), 'mix');
  eggs = act(e, eggs, 'season');
  check('eggs need mixing (one side), not flipping', e.sides === 1 && cookScore(e, eggs).score >= 0.9);
  check('eggs, bacon, meat, fish, chicken legs and pancakes', ['eggs', 'bacon', 'steak', 'fish', 'chicken', 'pancakes'].every((id) => id in FOODS));
  const g = mk();
  g.mini = { kind: 'cook', score: 0.9, food: 'steak' };
  g.doActivity('learn_cook');
  check('a great dish teaches you twice as much', g.flag('cook') === 2);
}

// ---------- writing: preset with choices or free text; saved to the notebook in your bag
{
  const t = TEMPLATES.find((x) => x.kind === 'story')!;
  const text = compose(t, t.slots.map(() => 1));
  check('a story preset fills in with your choices', !text.includes('{') && text.includes(t.slots[0][1]));
  check('journal and story presets', TEMPLATES.some((x) => x.kind === 'journal') && TEMPLATES.some((x) => x.kind === 'story'));
  const g = mk();
  saveNote(g, 'journal', 'Monday', 'I wrote this myself.');
  check('saved pages go into the notebook, which goes into your bag', g.s.notebook.length === 1 && g.s.notebook[0].text === 'I wrote this myself.' && itemCount(g, 'notebook') === 1);
  check('empty pages aren’t saved', saveNote(g, 'story', '', '   ') === null && g.s.notebook.length === 1);
  check('writing activities use the book', ACT_BY_ID.write.mini === 'write' && ACT_BY_ID.write_novel.mini === 'write');
}

// ---------- the gym: 20 seconds, the key changes every 2 seconds, gains up to +12 fitness / +6 looks
{
  check('20 seconds, a new key every 2 seconds, W A S D or SPACE', GYM_SECONDS === 20 && GYM_SWAP === 2 && GYM_KEYS.join() === 'W,A,S,D,SPACE');
  const keys = Array.from({ length: 10 }, (_, i) => keyFor(i, 7));
  check('the key never repeats twice in a row', keys.every((k, i) => i === 0 || k !== keys[i - 1]));
  check('keyboard presses are read correctly (space, lowercase)', pressedKey({ key: ' ', code: 'Space' }) === 'SPACE' && pressedKey({ key: 'w' }) === 'W' && pressedKey({ key: 'q' }) === null);
  check('more presses, more gains — capped at +12 fitness and +6 looks', gymGains(70).fitness < gymGains(140).fitness && gymGains(500).fitness === GYM_MAX.fitness && gymGains(500).looks === GYM_MAX.looks && GYM_MAX.fitness === 12 && GYM_MAX.looks === 6);
  const g = mk();
  g.s.stats.fitness = 20;
  g.mini = { kind: 'gym', score: 1, presses: 200 };
  g.doActivity('workout');
  const big = g.s.stats.fitness - 20;
  const h = mk();
  h.s.stats.fitness = 20;
  h.mini = { kind: 'gym', score: 0.1, presses: 14 };
  h.doActivity('workout');
  check('a big set beats a lazy one', big > h.s.stats.fitness - 20 && big > 4);
  check('lifting, boxing and swimming all use it', ['workout', 'boxing', 'swim_pool'].every((id) => ACT_BY_ID[id].mini === 'gym'));
  const a = mk();
  a.s.stats.fitness = 20;
  a.doActivity('workout');
  check('autopilot (no minigame) still works with the usual gains', a.s.stats.fitness > 20);
}

// ---------- new personas
{
  const g = mk();
  check('book nerd, gamer, gyaru and gold digger exist, with voices and openers', (['booknerd', 'gamer', 'gyaru', 'golddigger'] as const).every((p) => PERSONA[p] && VOICE[p].open.length >= 3 && CONTEXT[`p_${p}`]?.replies.length >= 3));
  check('gyaru: college-age women only', personaOk(g, 'gyaru', 21, 'female') && !personaOk(g, 'gyaru', 21, 'male') && !personaOk(g, 'gyaru', 30, 'female') && !personaOk(g, 'gyaru', 16, 'female'));
  let bad = 0;
  for (let i = 0; i < 3000; i++) {
    const r = rollPersona(g, 16, 'female', true, ['gyaru', 'golddigger']);
    if (r === 'gyaru' || r === 'golddigger' || r === 'yandere') bad++;
  }
  check('minors are never gyaru, gold diggers or yanderes', bad === 0);
  const gy = g.addPerson('acquaintance', { age: 20, gender: 'female' });
  setPersona(gy, 'gyaru');
  const o = portraitOptions(gy.look, 20, gy.id);
  check('gyaru are always blonde with accessories', gy.look.hair === 5 && o.accessoriesProbability === 100 && o.accessoriesVariant === 'kurt');
  let gyaruOnSpark = null;
  for (let i = 0; i < 3000 && !gyaruOnSpark; i++) { const pr = nextProfile(g); if (pr.persona === 'gyaru') gyaruOnSpark = pr; }
  check('personas show on Spark (a gyaru is blonde there too)', !!gyaruOnSpark && gyaruOnSpark.look.hair === 5 && gyaruOnSpark.gender === 'female' && gyaruOnSpark.age <= 24);
}

// ---------- gold diggers: money first, every step
{
  const g = mk();
  const p: Person = g.addPerson('talking', { age: 25, gender: 'female' });
  p.sexuality = 'straight';
  p.rel = 60;
  setPersona(p, 'golddigger');
  g.s.money = 50;
  check('no money, no asking them out', goldLock(g, p, 'askout') !== null && interactionsFor(g, p).find((r) => r.def.id === 'askout')?.reason?.includes('expect') === true);
  g.s.money = 10000;
  const m0 = g.s.money;
  doInteraction(g, p.id, 'askout');
  check('pay up and they listen', g.s.money <= m0 - GOLD_PRICE.askout);
  check('girlfriend / marriage cost more', GOLD_PRICE.official > GOLD_PRICE.askout && GOLD_PRICE.propose > GOLD_PRICE.official);
  const q = g.addPerson('talking', { age: 25, gender: 'female' });
  check('nobody else charges', goldLock(g, q, 'askout') === null);
}

// ---------- gamers would rather call on Discorb; a webcam call is a date, the first a face reveal
{
  const g = mk();
  const p = g.addPerson('crush', { age: 24, gender: 'female' });
  p.sexuality = 'straight';
  p.hasNumber = true;
  p.attraction = 50;
  setPersona(p, 'gamer');
  check('gamers show up in your Discorb friends', onlineFriends(g).includes(p));
  const call = FRIEND_ACTIONS.find((a) => a.id === 'call')!;
  const voiceOnly = call.run(g, p.id);
  check('no webcam: a voice call (friendship only)', /voice call/i.test(voiceOnly) && !p.tags.includes('faceReveal'));
  g.s.inventory.pc_cam1 = 1;
  const r0 = p.romance;
  const first = call.run(g, p.id);
  check('webcam on: the first call is a face reveal (and a date)', /face reveal/i.test(first) && p.tags.includes('faceReveal') && p.romance > r0);
  check('…later calls are Discorb dates', /date/i.test(call.run(g, p.id)));
}

// ---------- who you meet where
{
  check('mall: gyaru & gold diggers · arcade: gamers & otaku · coffee & library: book nerds & otaku', PLACE_PERSONAS.mall.includes('gyaru') && PLACE_PERSONAS.mall.includes('golddigger') && PLACE_PERSONAS.arcade.includes('gamer') && PLACE_PERSONAS.arcade.includes('otaku') && PLACE_PERSONAS.coffee.includes('booknerd') && PLACE_PERSONAS.library.includes('otaku'));
  const g: Game = mk();
  let gamers = 0;
  for (let i = 0; i < 400; i++) if (rollPersona(g, 22, 'male', true, PLACE_PERSONAS.arcade) === 'gamer') gamers++;
  check('at the arcade you mostly meet gamers and otaku', gamers > 100, `${gamers}/400`);
}

done();
