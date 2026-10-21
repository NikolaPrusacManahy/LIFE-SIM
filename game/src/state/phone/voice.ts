import type { Game } from '../Game';
import type { Person } from '../types';
import type { Persona } from '../npc/persona';
import { say } from '../npc/identity';

// Update 0.12 — how each persona sounds in chat. Their replies, their openers, what they want to talk about.

type Lines = { greet: string[]; talk: string[]; flirt: string[]; ok: string[]; fail: string[]; open: string[] };

export const VOICE: Record<Persona, Lines> = {
  shy: {
    greet: ['h-hi… 👉👈', 'oh! um. hi ☺️', 'hey… s-sorry, I was just about to text you too'],
    talk: ['it was… okay. better now that you asked', 'um. I read a book. it was nice. sorry that’s boring', 'I… I don’t really talk about this with anyone…'],
    flirt: ['w-what?! 😳 you can’t just SAY that', '…I’m hiding under my blanket now', 'my face is so red right now. thanks.'],
    ok: ['…thank you. really. ☺️', 'that made me smile. a lot.', 'okay… 👉👈'],
    fail: ['oh… o-okay', 'sorry… I don’t know what to say', '…'],
    open: ['h-hey… are you busy? sorry. never mind', 'i saw a cat and thought of you. sorry. is that weird', 'um… hi. that’s it. hi.'],
  },
  otaku: {
    greet: ['YAHALLO~ (≧▽≦)', 'ohayo senpai!! ✨', 'konnichiwa~ just finished an episode, perfect timing'],
    talk: ['the new arc just dropped and I am NOT okay 😭', 'today was filler-episode energy tbh', 'I’m rereading the manga for the 4th time. no regrets'],
    flirt: ['n-nani?! you’re acting like a shoujo protagonist rn 😳', 'senpai noticed me… I can die happy ✨', 'this is literally episode 12 confession scene energy'],
    ok: ['sugoi!! ✨', 'that’s so kawaii~ (◕‿◕)', 'arigatou!! you get it!!'],
    fail: ['…that’s so cringe, even for me', 'nande?? 😑', 'you’re giving villain arc'],
    open: ['have you seen the new season?? we NEED to talk', 'I found a ramen place that tastes like it’s from an anime 🍜', 'which character would you be? I’ll start: you’re totally the quiet genius'],
  },
  nerd: {
    greet: ['hello world 👋', 'ping. you there?', 'hey — 0 latency reply, impressive'],
    talk: ['spent 6 hours on a bug. it was a missing semicolon.', 'my build’s thermals are finally under 70°C 🥲', 'reading about quantum computing again. you?'],
    flirt: ['you’re like a 4090 in a world of integrated graphics', 'my heart rate just spiked. logging this.', 'are you open source? because I’d love to contribute 😳'],
    ok: ['ACK ✅', 'nice, that compiles', '10/10, would run again'],
    fail: ['error 404: response not found', 'that’s… not well optimised', 'hmm. segfault.'],
    open: ['ok hear me out: I built a smart mirror from an old monitor', 'did you see the new GPU leak??', 'want me to fix your laptop? I’m bored'],
  },
  yandere: {
    greet: ['there you are~ ♡', 'hi hi hi ♡ I was waiting', 'you took 4 minutes to reply. it’s okay. I forgive you ♡'],
    talk: ['I just want to know everything about you ♡ everything.', 'who were you with today? just curious~', 'nothing matters when I’m talking to you ♡'],
    flirt: ['you’re mine, you know that? ♡', 'say it again. slower. ♡', 'I’d do anything for you. anything. ♡'],
    ok: ['♡♡♡', 'you always know what to say ♡', 'I saved that. I save all of them ♡'],
    fail: ['…why would you say that to me', 'is it because of someone else?', 'I’ll pretend I didn’t read that ♡'],
    open: ['you looked so cute today ♡ the blue suits you', 'good night ♡ I’ll be thinking about you. always.', 'you’re only talking to me, right? ♡'],
  },
  booknerd: {
    greet: ['Salutations. Your timing is impeccable.', 'Ah — a welcome interruption to chapter twelve.', 'Hello! I was just thinking about you, somewhere between paragraphs.'],
    talk: ['Today was rather melancholic, in a Brontë sort of way.', 'I’m rereading Dostoevsky. Equal parts despair and delight.', 'My day was unremarkable, but this conversation redeems it entirely.'],
    flirt: ['You are, quite frankly, the most compelling plot twist of my year.', 'If you were a novel, I would refuse to put you down.', 'I’m usually eloquent. You render me… inarticulate.'],
    ok: ['How delightfully put.', 'Exquisite. Truly.', 'I shall treasure that sentiment.'],
    fail: ['How… pedestrian.', 'I find that rather unpersuasive.', 'Hm. Let us say I remain unconvinced.'],
    open: ['Have you read anything that changed you? I need a recommendation.', 'I found a first edition at a flea market. I am beside myself.', 'Quick: favourite opening line of any book. Go.'],
  },
  gamer: {
    greet: ['yo gg 🎮', 'sup, just got off a ranked match', 'ayyy you’re online'],
    talk: ['got hard stuck in plat again 💀', 'this boss is literally unbeatable, skill issue (mine)', 'no-lifed the new patch ngl'],
    flirt: ['ok you’re actually S-tier', 'my heart just took crit damage', 'you’re my player 2 fr'],
    ok: ['W', 'based', 'GG EZ'],
    fail: ['L', 'that’s a throw', 'bro is lagging irl'],
    open: ['hop on discorb?? texting on phone is so slow 😩', 'you on PC tonight? let’s call', 'dude I’ll stream for you, join my call'],
  },
  gyaru: {
    greet: ['heyyy babe 💅✨', 'omg hiii', 'ugh finally, you texted'],
    talk: ['did u SEE what Jess wore today?? tragic.', 'just got my nails done, they’re literally perfect', 'the mall was so mid today tbh'],
    flirt: ['hmm… you’re kinda cute. for now 💅', 'ok fine you’re a 7. maybe an 8.', 'babe that was almost smooth lol'],
    ok: ['slay ✨', 'ok cute', 'periodt 💅'],
    fail: ['ew', 'that’s so cringe babe', 'who taught you to talk like that lol'],
    open: ['rate my outfit 1–10 and be honest. (it’s a 10)', 'should I get the pink bag or the blonder highlights', 'ur coming to the party right? dress cute pls'],
  },
  golddigger: {
    greet: ['hey you 😘 how’s your bank account?', 'hiii… I saw the cutest bag today 👀', 'hey handsome/hot stuff 💎'],
    talk: ['I only date people with ambition. and a car.', 'my rent is due soon, no big deal 🙃', 'my ex bought me Cartier. just saying.'],
    flirt: ['say that again but with a gift card', 'you’re cute. cuter with dinner reservations 💸', 'words are nice. jewellery is nicer 💎'],
    ok: ['love that for us 💸', 'ok you’re learning 😘', 'that’s more like it'],
    fail: ['mm, not convinced. try Venmo.', 'cute but broke energy', 'talk is cheap babe'],
    open: ['there’s a sale ending tonight 🥺💳', 'take me somewhere expensive this weekend?', 'I deserve flowers. big ones.'],
  },
};

const CATEGORY: Record<string, keyof Lines> = { greet: 'greet', missyou: 'greet', talk: 'talk', meme: 'talk', vent: 'talk', advice: 'talk', deep: 'talk', flirt: 'flirt', doyoulike: 'flirt', ilike: 'flirt', selfie: 'flirt' };

/** Their reply, in their voice (mature lines are never rewritten). */
export function voiced(g: Game, p: Person, pool: string, ok: boolean, line: string): string {
  if (!p.persona || !g.chance(0.7)) return line;
  const v = VOICE[p.persona];
  const cat = CATEGORY[pool];
  const list = cat && ok ? v[cat] : ok ? v.ok : v.fail;
  return say(list[Math.floor(Math.random() * list.length)], p, g.s.name);
}

/** What they text you out of nowhere. */
export const personaOpener = (g: Game, p: Person) => (p.persona ? g.pick(VOICE[p.persona].open) : '');

/** Update 0.12 — what each persona wants to hear about (a chip that lands with them). */
export const PERSONA_CHIPS: { id: string; persona: Persona; label: string }[] = [
  { id: 'p_anime', persona: 'otaku', label: '🎌 Which anime are you watching?' },
  { id: 'p_manga', persona: 'otaku', label: '📚 Recommend me a manga' },
  { id: 'p_build', persona: 'nerd', label: '🖥️ Ask about their PC build' },
  { id: 'p_tech', persona: 'nerd', label: '📡 Talk tech news' },
  { id: 'p_gentle', persona: 'shy', label: '🌸 “No pressure to reply”' },
  { id: 'p_proud', persona: 'shy', label: '☺️ “I like talking to you”' },
  { id: 'p_only', persona: 'yandere', label: '♡ “You’re the only one”' },
  { id: 'p_where', persona: 'yandere', label: '📍 Tell them where you are' },
  { id: 'p_reading', persona: 'booknerd', label: '📚 What are you reading?' },
  { id: 'p_quote', persona: 'booknerd', label: '✒️ Quote a poem' },
  { id: 'p_ranked', persona: 'gamer', label: '🎮 Duo queue tonight?' },
  { id: 'p_clip', persona: 'gamer', label: '🎬 Send them a clip' },
  { id: 'p_nails', persona: 'gyaru', label: '💅 Compliment their style' },
  { id: 'p_mall', persona: 'gyaru', label: '🛍️ Talk fashion' },
  { id: 'p_gift', persona: 'golddigger', label: '💸 Send them $100' },
  { id: 'p_rich', persona: 'golddigger', label: '💎 Talk about your money' },
];
