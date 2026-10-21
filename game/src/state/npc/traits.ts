import type { Person } from '../types';

// Update 0.4 — hidden NPC traits, revealed by spending time together.

export interface NpcTraitDef {
  id: string;
  name: string;
  icon: string;
  desc: string;
  /** interaction ids that reveal this trait faster */
  revealBy: string[];
  /** never generated for minors */
  adultOnly?: boolean;
  /** archetypes that roll this more often */
  likes?: string[];
}

export const NPC_TRAITS: NpcTraitDef[] = [
  { id: 'kind', name: 'Kind', icon: '💗', desc: 'Forgives more easily.', revealBy: ['hangout', 'askhelp', 'chat'], likes: ['sweetheart', 'religious'] },
  { id: 'jealous', name: 'Jealous', icon: '😒', desc: 'Fights when you talk to others.', revealBy: ['date', 'flirt'], likes: ['player', 'popular'] },
  { id: 'loyal', name: 'Loyal', icon: '🛡️', desc: 'Defends you in a crisis.', revealBy: ['secret', 'askhelp'], likes: ['jock', 'sweetheart'] },
  { id: 'liar', name: 'Liar', icon: '🤥', desc: 'Sometimes lies.', revealBy: ['chat', 'asklife', 'confront'], likes: ['hustler', 'player'] },
  { id: 'gossip', name: 'Gossip', icon: '🗣️', desc: 'Your secrets spread.', revealBy: ['secret', 'gossip'], likes: ['gossip', 'popular', 'influencer'] },
  { id: 'funny', name: 'Funny', icon: '😂', desc: 'Mood boost when together.', revealBy: ['hangout', 'joke'], likes: ['clown', 'party'] },
  { id: 'ambitious', name: 'Ambitious', icon: '📈', desc: 'Might move away for a career.', revealBy: ['hang_study', 'asklife'], likes: ['overachiever', 'career'] },
  { id: 'lazy', name: 'Lazy', icon: '🛋️', desc: 'Fails shared tasks.', revealBy: ['hang_study', 'askhelp'], likes: ['gamer', 'homebody'] },
  { id: 'partyanimal', name: 'Party Animal', icon: '🎉', desc: 'Always inviting you out.', revealBy: ['invite', 'hangout'], likes: ['party', 'popular'] },
  { id: 'homebody', name: 'Homebody', icon: '🏠', desc: 'Prefers quiet plans.', revealBy: ['askout', 'invite'], likes: ['homebody', 'loner', 'gamer'] },
  { id: 'romantic', name: 'Romantic', icon: '🌹', desc: 'Big gestures, expects them too.', revealBy: ['date', 'gift'], likes: ['sweetheart', 'artsy'] },
  { id: 'commitphobe', name: 'Commitment-phobic', icon: '🏃', desc: 'Hesitates at "official".', revealBy: ['date', 'official'], likes: ['player', 'freespirit'] },
  { id: 'wantskids', name: 'Wants Kids', icon: '🍼', desc: 'Dreams of a family.', revealBy: ['deeptalk'], adultOnly: true },
  { id: 'nokids', name: 'Doesn’t Want Kids', icon: '🚫', desc: 'Child-free by choice.', revealBy: ['deeptalk'], adultOnly: true },
  { id: 'hothead', name: 'Hot-headed', icon: '🔥', desc: 'Fights escalate.', revealBy: ['argue', 'insult', 'confront'], likes: ['bully', 'jock', 'rebel'] },
  { id: 'generous', name: 'Generous', icon: '🎁', desc: 'Lends you money.', revealBy: ['askmoney', 'gift'], likes: ['richkid', 'sweetheart'] },
  { id: 'cheap', name: 'Cheap', icon: '🪙', desc: 'Never pays.', revealBy: ['date', 'gift', 'askmoney'], likes: ['hustler'] },
  { id: 'religious', name: 'Religious', icon: '🙏', desc: 'Faith shapes their choices.', revealBy: ['deeptalk', 'asklife'], likes: ['religious'] },
  { id: 'addictive', name: 'Addictive Personality', icon: '🌀', desc: 'Prone to bad habits.', revealBy: ['invite', 'hangout'], adultOnly: true, likes: ['party'] },
  { id: 'secretrich', name: 'Secretly Rich', icon: '💎', desc: 'More money than they let on.', revealBy: ['asklife', 'hangout'] },
  { id: 'secretbroke', name: 'Secretly Broke', icon: '🧾', desc: 'Struggling behind the scenes.', revealBy: ['asklife', 'askmoney'] },
  { id: 'musical', name: 'Musical', icon: '🎵', desc: 'Talented musician.', revealBy: ['hangout', 'hang_music'], likes: ['artsy', 'goth'] },
  { id: 'artistic', name: 'Artistic', icon: '🎨', desc: 'Draws, paints, creates.', revealBy: ['hangout'], likes: ['artsy', 'goth'] },
  { id: 'sporty', name: 'Sporty', icon: '⚽', desc: 'Lives for the game.', revealBy: ['hang_sport'], likes: ['jock', 'athlete'] },
  { id: 'manipulative', name: 'Manipulative', icon: '🕸️', desc: 'Guilt-trips you.', revealBy: ['confront', 'argue', 'askmoney'], likes: ['bully', 'player', 'popular'] },
  { id: 'clingy', name: 'Clingy', icon: '🧲', desc: 'Texts constantly.', revealBy: ['date', 'chat'], likes: ['sweetheart'] },
  { id: 'adventurous', name: 'Adventurous', icon: '🧗', desc: 'Wants to try new things.', revealBy: ['hangout', 'date'], likes: ['freespirit', 'rebel'] },
  { id: 'shy', name: 'Shy', icon: '🙈', desc: 'Slow to open up.', revealBy: ['chat', 'compliment'], likes: ['loner', 'nerd'] },
  { id: 'nightowl', name: 'Night Owl', icon: '🦉', desc: 'Texts at 3am.', revealBy: ['chat'], likes: ['gamer', 'goth'] },
  { id: 'earlybird', name: 'Early Bird', icon: '🐦', desc: 'Up at 5am, every day.', revealBy: ['chat'], likes: ['athlete', 'career'] },
  { id: 'allergic', name: 'Allergic to Flowers', icon: '🤧', desc: 'Flower gifts backfire.', revealBy: ['gift'] },
  { id: 'hassecret', name: 'Has a Secret', icon: '🔒', desc: 'There’s something they haven’t told you.', revealBy: ['secret', 'deeptalk'] },
  { id: 'smart', name: 'Brilliant', icon: '🧠', desc: 'Helps you study.', revealBy: ['hang_study', 'chat'], likes: ['nerd', 'overachiever'] },
  { id: 'competitive', name: 'Competitive', icon: '🏁', desc: 'Has to win everything.', revealBy: ['challenge', 'hang_sport'], likes: ['jock', 'athlete', 'overachiever'] },
  { id: 'optimist', name: 'Optimist', icon: '🌞', desc: 'Lifts your mood.', revealBy: ['chat', 'deeptalk'], likes: ['sweetheart', 'activist'] },
  { id: 'cynic', name: 'Cynic', icon: '🌧️', desc: 'Expects the worst.', revealBy: ['chat', 'deeptalk'], likes: ['goth', 'loner', 'rebel'] },
  { id: 'activist', name: 'Activist', icon: '📢', desc: 'Fights for causes.', revealBy: ['asklife', 'deeptalk'], likes: ['activist'] },
  { id: 'vain', name: 'Vain', icon: '🪞', desc: 'Loves compliments.', revealBy: ['compliment'], likes: ['popular', 'influencer'] },
  { id: 'honest', name: 'Brutally Honest', icon: '🗯️', desc: 'Says it like it is.', revealBy: ['asklife', 'confront'] },
  { id: 'foodie', name: 'Foodie', icon: '🍜', desc: 'Every date is a food date.', revealBy: ['hang_food', 'date'] },
];

export const NPC_TRAIT_BY_ID: Record<string, NpcTraitDef> = Object.fromEntries(NPC_TRAITS.map((t) => [t.id, t]));

export const hasTrait = (p: Person, id: string) => p.traits.some((t) => t.id === id);
export const knowsTrait = (p: Person, id: string) => p.traits.some((t) => t.id === id && t.revealed);

/** Pick 3–6 traits weighted by archetype. Adult-only traits only for 18+. */
export function rollTraits(archetype: string, adult: boolean, rnd = Math.random): Person['traits'] {
  const n = 3 + Math.floor(rnd() * 4);
  const pool = NPC_TRAITS.filter((t) => adult || !t.adultOnly);
  const out: Person['traits'] = [];
  const conflicts: Record<string, string> = { wantskids: 'nokids', nokids: 'wantskids', secretrich: 'secretbroke', secretbroke: 'secretrich', generous: 'cheap', cheap: 'generous', nightowl: 'earlybird', earlybird: 'nightowl', optimist: 'cynic', cynic: 'optimist', homebody: 'partyanimal', partyanimal: 'homebody' };
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const weighted = pool.flatMap((t) => (t.likes?.includes(archetype) ? [t, t, t, t] : [t]));
    const t = weighted[Math.floor(rnd() * weighted.length)];
    if (out.some((x) => x.id === t.id || conflicts[x.id] === t.id)) continue;
    out.push({ id: t.id, revealed: false, progress: 0 });
  }
  return out;
}

/** Spend time → progress on traits this interaction reveals. Returns newly revealed trait names. */
export function discover(p: Person, interaction: string, amount = 34): string[] {
  const found: string[] = [];
  for (const t of p.traits) {
    if (t.revealed) continue;
    const def = NPC_TRAIT_BY_ID[t.id];
    const gain = def?.revealBy.includes(interaction) ? amount : amount / 6;
    t.progress = Math.min(100, t.progress + gain);
    if (t.progress >= 100) {
      t.revealed = true;
      found.push(def?.name ?? t.id);
    }
  }
  return found;
}
