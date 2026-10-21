// Update 0.7 — DiceBear Avataaars portraits: our look maps onto real style parts, deterministically.
import { check, done } from './harness';
import { AVATAAARS_PARTS, TOPS, portraitOptions, portraitUri } from '../src/fx/portrait';
import { SKIN, hex } from '../src/fx/look';
import type { AvatarSpec } from '../src/state/types';
import { FEMALE_STYLES, MALE_STYLES, fitHairStyle, randomAvatar } from '../src/state/npc/generator';
import { continueAsChild, createLife, randomLook } from '../src/state/newGame';
import { nextProfile, swipe } from '../src/state/systems/dating';

const look = (o: Partial<AvatarSpec> = {}): AvatarSpec => ({ skin: 2, hair: 1, hairStyle: 0, eyes: 0, height: 1, build: 1, freckles: false, glasses: false, body: 'male', ...o });
const has = (part: string, v: string) => !!AVATAAARS_PARTS[part]?.variants[v];

check('12 hairstyles map to 12 tops', TOPS.length === 12);
check('every mapped top exists in Avataaars', TOPS.every(([m, f]) => has('top', m) && has('top', f)), TOPS.flat().filter((v) => !has('top', v)).join(','));

// every variant the mapping can produce is a real Avataaars part
const bad = new Set<string>();
for (let i = 0; i < 400; i++) {
  const o = portraitOptions(look({ hairStyle: i % 12, body: i % 2 ? 'female' : 'male', glasses: i % 3 === 0 }), 10 + (i % 70), `seed${i}`, i % 100);
  const pairs: [string, string][] = [['top', o.topVariant], ['accessories', o.accessoriesVariant], ['facialHair', o.facialHairVariant], ['clothes', o.clothesVariant], ['eyes', o.eyesVariant], ['mouth', o.mouthVariant], ['eyebrows', o.eyebrowsVariant]];
  for (const [part, v] of pairs) if (!has(part, v)) bad.add(`${part}:${v}`);
}
check('every generated variant is a real Avataaars part', bad.size === 0, [...bad].join(', '));

const a = portraitUri(look(), 30, 'p1');
check('renders an SVG data URI', a.startsWith('data:image/svg+xml'));
check('same person, same portrait', portraitUri(look(), 30, 'p1') === a);
check('different people differ', portraitUri(look(), 30, 'p2') !== a);
check('skin tone is applied', decodeURIComponent(a).toLowerCase().includes(hex(SKIN[2]).toLowerCase()));
check('glasses change the portrait', portraitUri(look({ glasses: true }), 30, 'p1') !== a);
check('hairstyle changes the portrait', portraitUri(look({ hairStyle: 5 }), 30, 'p1') !== a);
check('mood changes the expression', portraitOptions(look(), 30, 'p1', 90).mouthVariant === 'smile' && portraitOptions(look(), 30, 'p1', 10).mouthVariant === 'sad');
check('no beards on teens or the female model', [...Array(200)].every((_, i) => portraitOptions(look(), 16, `t${i}`).facialHairProbability === 0 && portraitOptions(look({ body: 'female' }), 40, `f${i}`).facialHairProbability === 0));
check('some adult men get a beard', [...Array(200)].some((_, i) => portraitOptions(look(), 35, `m${i}`).facialHairProbability === 100));
check('hair greys with age', portraitOptions(look({ hair: 1 }), 70, 'old').hairColor !== portraitOptions(look({ hair: 1 }), 30, 'old').hairColor);
check('teens wear casual clothes', [...Array(100)].every((_, i) => !portraitOptions(look(), 15, `k${i}`).clothesVariant.startsWith('blazer')));

// ---------- men read as men, women as women (user report: "everything is a male body")
const MALE_TOPS = ['shortWaved', 'shaggy', 'shortFlat', 'theCaesar', 'shaggyMullet', 'frizzle', 'dreads01', 'dreads02', 'shortCurly', 'shortRound', 'theCaesarAndSidePart', 'sides', 'turban'];
// frizzle is the one shared very-short cut (female Buzz)
check('female portraits never get a men’s cut', TOPS.every(([, f]) => f === 'frizzle' || !MALE_TOPS.includes(f)));
check('female model never gets a beard', [...Array(100)].every((_, i) => portraitOptions(look({ body: 'female' }), 30, `w${i}`).facialHairProbability === 0));
const fem = [...Array(300)].map(() => randomAvatar('female'));
const male = [...Array(300)].map(() => randomAvatar('male'));
check('generated women only get feminine hairstyles', fem.every((l) => l.body === 'female' && FEMALE_STYLES.includes(l.hairStyle)));
check('generated men only get masculine hairstyles', male.every((l) => l.body === 'male' && MALE_STYLES.includes(l.hairStyle)));
const oldNpc = look({ body: 'female', hairStyle: 3 });
fitHairStyle(oldNpc, 'npc1');
const oldMan = look({ body: 'male', hairStyle: 11 });
fitHairStyle(oldMan, 'npc2');
check('save fix: old NPCs get a hairstyle that fits their body', FEMALE_STYLES.includes(oldNpc.hairStyle) && MALE_STYLES.includes(oldMan.hairStyle));
const keep = look({ body: 'female', hairStyle: 5 });
fitHairStyle(keep, 'npc3');
check('save fix leaves fitting hairstyles alone', keep.hairStyle === 5);

// heirs keep their own body (it used to copy the parent's)
const dad = createLife({ name: 'D', familyName: 'H', gender: 'male', background: 'middle', hometown: 'city', traits: [], look: randomLook('male'), startAge: 23 });
dad.s.bornAt -= 30 * 12;
const girl = dad.addPerson('child', { age: 16, gender: 'female' });
const heir = continueAsChild(dad.s, girl.id);
check('a daughter continues with her own female body', heir?.s.look.body === 'female' && heir.s.gender === 'female', `${heir?.s.look.body}`);

// Update 0.9 — Spark profiles show a real face, and the match keeps it
{
  const me = createLife({ name: 'S', familyName: 'P', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook('female'), startAge: 23 });
  me.s.sexuality = 'pan';
  const profs = [...Array(50)].map(() => nextProfile(me));
  check('every Spark profile has a face (look) and a portrait seed', profs.every((x) => !!x.look && !!x.id && portraitUri(x.look, x.age, x.id).startsWith('data:image/svg')));
  check('profile faces match the profile’s gender', profs.every((x) => x.gender === 'nonbinary' || x.look.body === (x.gender === 'male' ? 'male' : 'female')));
  let same = 0;
  let matched = 0;
  for (let i = 0; i < 200 && matched < 5; i++) {
    const pr = nextProfile(me);
    pr.match = 1;
    me.s.flags.swipes = 0;
    if (swipe(me, pr, true).matched) {
      matched++;
      const m = me.personById(pr.id);
      if (m && m.look === pr.look) same++;
    }
  }
  check('a match keeps the exact face from the profile', matched > 0 && same === matched, `${same}/${matched}`);
}

done();
