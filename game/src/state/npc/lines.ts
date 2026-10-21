import type { Game } from '../Game';
import type { Archetype, Person } from '../types';
import { say } from './identity';

// Update 0.4 — line pools keyed `interaction.group.outcome`. Tokens resolve per NPC pronouns.
// Pools tagged mature may only ever resolve between two adults with Mature Content on.

export type LineGroup = 'jock' | 'nerd' | 'social' | 'artsy' | 'edgy' | 'sweet' | 'adult' | 'any';

const GROUP_OF: Record<Archetype, LineGroup> = {
  jock: 'jock', athlete: 'jock', nerd: 'nerd', overachiever: 'nerd', gamer: 'nerd', loner: 'edgy', rebel: 'edgy', goth: 'edgy', bully: 'edgy',
  popular: 'social', influencer: 'social', party: 'social', gossip: 'social', clown: 'social', player: 'social', hustler: 'social', richkid: 'social',
  artsy: 'artsy', freespirit: 'artsy', activist: 'artsy', sweetheart: 'sweet', religious: 'sweet', homebody: 'sweet', mature: 'adult', career: 'adult',
};

type Pool = Record<string, string[]>;

const P: Pool = {
  // ---- chat
  'chat.jock.ok': ['{They} talk{s} your ear off about last night’s game.', '"You lift? You should come to the gym with me."', '{They} laugh{s} and punch your shoulder. Friendly.'],
  'chat.nerd.ok': ['{They} explain{s} {their} favorite theory with real passion.', '"Wait, you’ve read that too?" {Their} eyes light up.', 'You end up debating sci-fi for an hour.'],
  'chat.social.ok': ['{They} know{s} everyone and tell you about all of them.', '"Okay, you’re fun. Why haven’t we talked before?"', '{They} pull{s} you into a selfie mid-sentence.'],
  'chat.artsy.ok': ['{They} show{s} you a sketch on {their} phone. It’s good.', '"Do you ever feel like the sky is a painting?" Somehow, it works.', 'You trade playlists.'],
  'chat.edgy.ok': ['{They} {do}n’t say much, but {they} stay{s}. That means something.', 'A dry joke. A rare smile.', '"You’re less annoying than most people."'],
  'chat.sweet.ok': ['{They} ask{s} how you’re really doing. And listen.', '{Their} laugh is contagious.', '"I’m so glad we talked!"'],
  'chat.adult.ok': ['{They} share{s} some hard-earned life advice.', 'A thoughtful conversation over coffee.', '"You remind me of myself at your age."'],
  'chat.any.fail': ['{They} check{s} {their} phone the whole time.', 'The conversation dies after two sentences.', '"Uh huh." {They} wander{s} off.'],
  // ---- compliment
  'compliment.jock.ok': ['"Thanks. You should come to the game Friday."', '{They} grin{s}. "Finally someone noticed."', '"You’re not so bad yourself."'],
  'compliment.nerd.ok': ['{They} turn{s} red and push up {their} glasses. "R-really?"', '"Statistically, that’s the nicest thing I’ve heard this week."', '{They} smile{s} at the floor.'],
  'compliment.social.ok': ['"Stop, you’re sweet." {They} clearly love{s} it.', '"I know, right?" {They} wink{s}.', '{They} return{s} the compliment instantly.'],
  'compliment.artsy.ok': ['"Nobody ever notices that. Thank you."', '{They} hug{s} you. Unexpected.', '"You see things. I like that."'],
  'compliment.edgy.ok': ['"…Thanks." A tiny smile.', '{They} roll{s} {their} eyes, but {they} {is} pleased.', '"Weird thing to say. But cool."'],
  'compliment.sweet.ok': ['{They} beam{s}. "You just made my day!"', '"Aww, you too!"', '{They} remember{s} it for weeks.'],
  'compliment.adult.ok': ['"That’s kind of you to say."', '{They} nod{s}, genuinely touched.', '"Well, thank you."'],
  'compliment.any.fail': ['{They} shrug{s} and turn back to {their} friends.', '"Uh… okay?"', '{They} look{s} at you like you’re selling something.'],
  // ---- joke
  'joke.jock.ok': ['{They} wheeze-laugh{s} and almost fall over.', '"Bro. BRO." {They} can’t stop laughing.'],
  'joke.nerd.ok': ['{They} snort{s}. "That’s a pun. I respect it."', '{They} counter{s} with a worse joke. You both lose it.'],
  'joke.social.ok': ['{They} repeat{s} your joke to the whole group.', '"Okay, you’re hilarious."'],
  'joke.artsy.ok': ['{They} laugh{s} so hard {they} drop{s} {their} sketchbook.', '"That was weird. I loved it."'],
  'joke.edgy.ok': ['{They} actually laugh{s}. Rare.', 'A dark joke lands perfectly.'],
  'joke.sweet.ok': ['{They} giggle{s} for a full minute.', '"You’re ridiculous." Said warmly.'],
  'joke.adult.ok': ['{They} chuckle{s} politely, then for real.', '"Ha! That’s a good one."'],
  'joke.any.fail': ['Silence. Crickets. Someone coughs.', '{They} {do}n’t get it.', '"…Was that a joke?"'],
  // ---- flirt
  'flirt.jock.ok': ['{They} flex{s} jokingly. "You like what you see?"', '{They} smile{s} and move a little closer.'],
  'flirt.nerd.ok': ['{They} blush{s} hard. "Are you… flirting with me?"', '{They} stammer{s} something adorable.'],
  'flirt.social.ok': ['{They} bite{s} {their} lip and flirt right back.', '"Smooth. Very smooth."'],
  'flirt.artsy.ok': ['"You’re a little bit poetic, you know that?"', '{They} tuck{s} {their} hair back and smile.'],
  'flirt.edgy.ok': ['{They} smirk{s}. "Not bad."', 'A long look that says more than words.'],
  'flirt.sweet.ok': ['{They} giggle{s} and look away, smiling.', '"You’re making me nervous!"'],
  'flirt.adult.ok': ['{They} raise{s} an eyebrow, amused and interested.', '"Well, aren’t you charming."'],
  'flirt.any.fail': ['{They} laugh{s} — at you, not with you.', '"I’m flattered, but no."', '{They} take{s} a polite step back.'],
  // ---- insult
  'insult.any.ok': ['{They} go{es} quiet. That landed.', '{Their} face hardens. You made an enemy.', '"Wow. Okay." {They} storm{s} off.'],
  'insult.edgy.ok': ['{They} insult{s} you right back, worse.', '"Say that again."'],
  // ---- hang out
  'hangout.jock.ok': ['You shoot hoops until sunset.', 'A pickup game turns into a whole afternoon.'],
  'hangout.nerd.ok': ['A marathon co-op session. Snacks everywhere.', 'You build something weird together.'],
  'hangout.social.ok': ['{They} drag{s} you to three places in one afternoon.', 'You end up in {their} story. Twice.'],
  'hangout.artsy.ok': ['A gallery, then a cheap noodle place.', 'You make a terrible collaborative painting. Love it.'],
  'hangout.edgy.ok': ['Rooftops, headphones, very few words.', 'You wander the city aimlessly. Perfect.'],
  'hangout.sweet.ok': ['Baking cookies. Burning cookies. Laughing.', 'A long walk and a good talk.'],
  'hangout.adult.ok': ['A proper dinner, good conversation.', '{They} show{s} you {their} favorite spot in town.'],
  'hangout.any.fail': ['{They} cancel{s} last minute.', 'It was… fine. A bit awkward.'],
  // ---- ask number
  'number.any.ok': ['{They} type{s} {their} number into your phone.', '"Text me sometime." {They} hand{s} your phone back.'],
  'number.any.fail': ['"Maybe next time."', '{They} laugh{s} it off and change the subject.'],
  // ---- deep talk
  'deeptalk.any.ok': ['{They} tell{s} you something {they} {have} never told anyone.', 'Hours pass. You understand each other better now.'],
  'deeptalk.any.fail': ['{They} change{s} the subject fast.', '"I don’t really talk about that stuff."'],
  // ---- dates
  'date.any.ok': ['A perfect evening with {name}.', '{They} hold{s} your hand the whole way home.', 'You can’t stop smiling about it.'],
  'date.any.fail': ['An awkward silence over dessert.', '{They} spend{s} half the date on {their} phone.'],
  // ---- mature (18+ only, both people; non-explicit)
  'night.any.ok': ['You spent the night together. Fade to black.', 'The rest of the night was yours and {name}’s. Fade to black.', 'The lights went out. Morning came slowly, and {name} was still smiling.'],
  'fwb.any.ok': ['No labels, no pressure. Fade to black.', 'Just friends. Mostly. Fade to black.'],
  'uup.any.ok': ['{name}: "u up?" 🌙', '{name}: "can’t sleep… you around?"'],
};

export const MATURE_POOLS = new Set(['night.any.ok', 'fwb.any.ok', 'uup.any.ok']);

/** Audit of mature line resolutions (tests prove nobody under 18 is ever involved). */
export const MATURE_LINE_AUDIT: { key: string; playerAge: number; npcAge: number }[] = [];

export const ALL_POOLS = P;

export function line(g: Game, interaction: string, p: Person, ok: boolean): string {
  const group = GROUP_OF[p.archetype] ?? 'any';
  const outcome = ok ? 'ok' : 'fail';
  const key = P[`${interaction}.${group}.${outcome}`] ? `${interaction}.${group}.${outcome}` : `${interaction}.any.${outcome}`;
  const pool = P[key];
  if (!pool) return '';
  if (MATURE_POOLS.has(key)) {
    MATURE_LINE_AUDIT.push({ key, playerAge: g.age, npcAge: g.ageOf(p) });
    if (g.age < 18 || g.ageOf(p) < 18) throw new Error(`mature line ${key} with a minor`);
  }
  return say(pool[Math.floor(Math.random() * pool.length)], p, g.s.name);
}
