import { bump } from '../npc/interactions';
import { isRomanceEligible } from '../npc/identity';
import type { CtxReply, MsgType } from './convo';

// Update 0.14 — a big library of incoming messages and reactions, so chats feel alive and varied.
// Everything here is friendly/mundane/satirical: no explicit content. New message KINDS (with contextual replies)
// go in EXTRA_CONTEXT; new random openers go in STARTERS; extra NPC reaction lines go in EXTRA_REACT.

/** Random opening texts, grouped so textsTick can pick a fitting one; each carries the message KIND for its replies. */
export const STARTERS: Record<string, { kind: string; lines: string[] }> = {
  friend_check: { kind: 'question', lines: [
    'yo what are you up to', 'hey stranger 👀 long time', 'how’s life treating you?', 'random but I was just thinking about you',
    'you alive?? lol', 'ok be honest how are you ACTUALLY doing', 'what’s new with you', 'miss your face, update me',
  ] },
  friend_hang: { kind: 'invite', lines: [
    'wanna do something this week?', 'bored. entertain me 😭', 'coffee soon? I need to vent', 'come over, I got snacks',
    'let’s go do something stupid and fun', 'the usual spot later?', 'I found a new place we HAVE to try', 'board game night at mine?',
  ] },
  friend_meme: { kind: 'meme', lines: [
    '[sends a meme] this is you', '[a dog in a tiny hat] 🐶', 'I can’t stop laughing at this [video]', 'tag yourself I’m the tired one',
    '[cursed image] I’m so sorry', 'why is this literally us', '[a cat knocking over a cup] me on a monday', 'ranked our friend group, you’re top 3 don’t tell the others',
  ] },
  friend_rant: { kind: 'drama', lines: [
    'ok I need to vent for a sec', 'you will NOT believe what happened at work', 'I’m so done with my roommate', 'can I tell you something? keep it between us',
    'drama update: it got worse', 'my family is being my family again', 'I did something dumb, don’t judge me', 'so. a lot happened today.',
  ] },
  friend_good: { kind: 'news', lines: [
    'GUESS WHAT 🎉', 'I have good news!!', 'okay something great happened', 'you’re the first person I’m telling —',
    'remember that thing I was stressed about? it worked out 😭', 'big news, call me when you can', 'I did the thing!! I actually did it', 'life is good today ☀️',
  ] },
  friend_fav: { kind: 'favour', lines: [
    'tiny favour? can you help me move saturday 🥺', 'could you cover for me? I’ll explain later', 'can I crash at yours for a night?', 'need a ride tomorrow, any chance?',
    'can you water my plants while I’m away?', 'would you proofread something for me?', 'can you hype me up, I have a big thing tomorrow', 'need your honest opinion on something',
  ] },
  bestie_deep: { kind: 'deep', lines: [
    'do you ever feel like everyone’s moving faster than you?', 'sometimes I don’t know what I’m doing with my life', 'can I be real with you for a sec', 'I’ve been thinking a lot lately',
    'do you think people really change?', 'I’m scared I’m making the wrong choices', 'thank you for always being there btw, I mean it', 'what do you actually want out of life?',
  ] },
  partner_sweet: { kind: 'sweet', lines: [
    'just wanted to say I’m lucky to have you ❤️', 'thinking about you 🥰', 'can’t wait to see you', 'you crossed my mind and I smiled like an idiot',
    'hope your day’s going okay, text me later ❤️', 'I made your favourite tonight 😊', 'counting down till I see you', 'you’re my favourite person, that’s all',
  ] },
  partner_miss: { kind: 'missyou', lines: [
    'I miss you :(', 'the bed’s too big without you', 'when are you home?', 'wish you were here right now',
    'okay it’s been a few hours and I already miss you, embarrassing', 'come home soon ❤️', 'can we do something just us soon?', 'I keep reaching for my phone to text you things',
  ] },
  partner_worry: { kind: 'checkin', lines: [
    'are we okay? you’ve been distant', 'can we talk tonight? nothing bad, I just want to check in', 'I feel like we haven’t really talked in a while', 'do you still feel the same about us?',
    'I need us to be on the same page about something', 'be honest — is everything alright between us?',
  ] },
  ex_closure: { kind: 'ex2am', lines: [
    'I saw something that reminded me of you', 'hope you’re doing well, genuinely', 'weird question — do you ever think about what happened?', 'I’m not trying to start anything, I just miss talking to you',
    'found some of your stuff, want it back?', 'I’m sorry about how things ended', 'you popped up in a memory today', 'no agenda, just… hi.',
  ] },
  family_warm: { kind: 'family', lines: [
    'proud of you, you know that?', 'call your mother once in a while 😤❤️', 'we’re doing a family dinner sunday, you in?', 'found your baby photos, sending the worst one',
    'how are you really doing, sweetheart?', 'the house feels quiet without you', 'don’t forget to eat something green', 'your room is exactly how you left it',
  ] },
  coworker_vent: { kind: 'coworker', lines: [
    'did you see that email?? unreal', 'cover for me, I’m taking a long lunch 😌', 'the boss is in a MOOD today', 'meeting that could’ve been an email: part 47',
    'are you coming to the work thing friday?', 'new person started, jury’s out', 'I accidentally replied-all. pray for me.', 'lunch? I need to complain about the printer',
  ] },
  rival_jab: { kind: 'jab', lines: [
    'heard you’re trying to catch up to me 😏', 'cute effort today. really.', 'may the best one win. (it’s me)', 'nice try. almost impressive.',
    'don’t strain yourself keeping up', 'saw what you did. not bad. not good either.',
  ] },
  admirer_hint: { kind: 'admirer_hint', lines: [
    'ok this is random but I’ve wanted to text you for a while', 'I always get a little nervous around you, it’s dumb', 'you’re kind of the highlight of my day, no pressure', 'is it weird that I look for you in a room?',
    'I rehearsed this text like five times lol', 'you make being around you really easy', 'I think about our last conversation a lot',
  ] },
};

/** New message kinds with their reply chips. Merged into CONTEXT by convo.ts. Keep replies short and clear. */
export const EXTRA_CONTEXT: Record<string, { type: MsgType; replies: CtxReply[] }> = {
  favour: { type: 'request', replies: [
    { id: 'fav_yes', label: 'Of course, I got you 🙌', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 3); } },
    { id: 'fav_maybe', label: 'Let me check and get back to you', intent: 'defer' },
    { id: 'fav_no', label: 'Sorry, can’t this time', intent: 'decline' },
  ] },
  deep: { type: 'serious', replies: [
    { id: 'dp_there', label: 'I’m here. Talk to me ❤️', intent: 'kind', run: (_g, p) => { bump(p, 'trust', 5); bump(p, 'rel', 2); } },
    { id: 'dp_same', label: 'Honestly? I feel that too', intent: 'kind', run: (g, p) => { bump(p, 'trust', 4); g.stat('mood', 2); } },
    { id: 'dp_light', label: 'Deep for a tuesday 😅', intent: 'kind', run: (_g, p) => bump(p, 'rel', 1) },
    { id: 'dp_read', label: 'Leave on read', intent: 'read', run: (_g, p) => { bump(p, 'trust', -4); bump(p, 'rel', -2); } },
  ] },
  sweet: { type: 'flirt', replies: [
    { id: 'sw_back', label: 'You’re going to make me cry ❤️', intent: 'kind', run: (_g, p) => { bump(p, 'romance', 5); bump(p, 'rel', 2); } },
    { id: 'sw_tease', label: 'Simp 😏 (I love it)', intent: 'flirt', run: (_g, p) => bump(p, 'romance', 3) },
    { id: 'sw_busy', label: 'Aw, talk later though, busy 🏃', intent: 'cold', run: (_g, p) => bump(p, 'romance', -1) },
  ] },
  missyou: { type: 'flirt', replies: [
    { id: 'my_2', label: 'Miss you more 🥺', intent: 'kind', run: (_g, p) => { bump(p, 'romance', 4); bump(p, 'rel', 2); } },
    { id: 'my_soon', label: 'Home soon, I promise ❤️', intent: 'kind', run: (_g, p) => bump(p, 'romance', 3) },
    { id: 'my_read', label: 'Leave on read', intent: 'read', run: (_g, p) => { bump(p, 'romance', -6); bump(p, 'trust', -3); } },
  ] },
  jab: { type: 'other', replies: [
    { id: 'jb_back', label: 'Big talk. Prove it.', intent: 'cold', run: (_g, p) => { bump(p, 'rivalry', 6); bump(p, 'respect', 3); } },
    { id: 'jb_laugh', label: 'lol okay buddy 😂', intent: 'react', run: (_g, p) => bump(p, 'rivalry', 2) },
    { id: 'jb_truce', label: 'We could just… not?', intent: 'kind', run: (_g, p) => { bump(p, 'rivalry', -5); bump(p, 'rel', 2); } },
  ] },
  admirer_hint: { type: 'flirt', replies: [
    { id: 'ah_warm', label: 'That’s really sweet 😊 tell me more', intent: 'flirt', when: (g, p) => isRomanceEligible(g, p), run: (_g, p) => { bump(p, 'romance', 5); bump(p, 'attraction', 4); } },
    { id: 'ah_friend', label: 'I like you a lot — as a friend', intent: 'shutdown', run: (_g, p) => { bump(p, 'romance', -6); bump(p, 'rel', 1); } },
    { id: 'ah_shy', label: 'Oh. Um. I didn’t know what to say to that', intent: 'kind', run: (_g, p) => bump(p, 'attraction', 2) },
  ] },
  congrats: { type: 'goodnews', replies: [
    { id: 'cg_thx', label: 'Thank you!! means a lot 🥹', intent: 'kind', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'cg_us', label: 'Couldn’t have done it without you ❤️', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 2); } },
  ] },
  family: { type: 'greeting', replies: [
    { id: 'fm_love', label: 'Love you too ❤️ I’ll visit soon', intent: 'kind', run: (_g, p) => { bump(p, 'rel', 4); bump(p, 'trust', 2); } },
    { id: 'fm_ok', label: 'I’m good, promise 🙂', intent: 'kind', run: (_g, p) => bump(p, 'rel', 2) },
    { id: 'fm_busy', label: 'Can’t talk now, later?', intent: 'cold', run: (_g, p) => bump(p, 'rel', -1) },
    { id: 'fm_read', label: 'Leave on read', intent: 'read', run: (_g, p) => { bump(p, 'rel', -3); bump(p, 'trust', -2); } },
  ] },
  coworker: { type: 'question', replies: [
    { id: 'cw_same', label: 'Ugh, SAME. tell me everything', intent: 'kind', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'cw_lunch', label: 'Lunch? I need to vent too', intent: 'accept', run: (_g, p) => bump(p, 'rel', 3) },
    { id: 'cw_pro', label: 'Keeping my head down tbh', intent: 'cold', run: (_g, p) => bump(p, 'rel', -1) },
  ] },
};

/** Extra NPC reaction lines, merged into the REACT pools in convo.ts (variety only; no new behaviour). */
export const EXTRA_REACT: Record<string, string[]> = {
  kind: ['honestly you’re the best 💜', 'this is why I keep you around', 'you always know what to say', 'okay that unreasonably cheered me up', 'saving this text forever', 'you get me 🥹', 'see THIS is friendship', 'I’m telling everyone how great you are', 'brb crying (good crying)', 'you’re a whole green flag'],
  accept: ['IT’S HAPPENING 🎉', 'okay now I’m excited', 'already picking my outfit', 'don’t you dare cancel 😤❤️', 'counting down', 'yesss best news today', 'okay it’s officially a plan 📅', 'see you there, don’t be late 😏'],
  money: ['you literally saved me 🙏', 'paying you back the SECOND I can', 'ok you’re officially my favourite', 'I owe you dinner. several dinners.', 'guardian angel behaviour'],
  react: ['SCREAMING 😂', 'no because why is it so accurate', 'ok that’s going in the group chat', 'I’m wheezing', 'stop I can’t 💀', 'sending this to everyone I know', 'unhinged. love it.'],
  flirt: ['okay okay you win this round 😳', 'why are you like this (don’t stop)', 'my face is doing a thing', 'smooth. annoyingly smooth.', 'I’m blushing at my phone like a loser'],
  apology: ['…okay. thank you for that, really', 'I appreciate you saying it', 'we’re good. come here.', 'that actually means a lot', 'okay. let’s start over.'],
  cold: ['wow. ok then.', 'cool. cool cool cool.', 'noted.', 'that’s how it is huh', 'alright. forget I said anything.', 'k.'],
  shutdown: ['yeah… friends. totally. 🙂', 'no I get it, all good', 'thanks for being honest at least', 'oof. okay. noted.'],
};
