import type { Game } from '../Game';
import { newId } from '../Game';
import { addItem, itemCount } from '../inventory/items';

// Update 0.12 — writing: a journal page or a story. Fill a preset with your choices, or write freely.
// Everything you write goes into the notebook in your bag, readable any time.

export type WriteKind = 'journal' | 'story';
export interface NoteEntry { id: string; kind: WriteKind; title: string; text: string; date: string }

/** A template: text with {0}, {1}… slots and the choices for each slot. */
export interface Template { id: string; kind: WriteKind; title: string; text: string; slots: string[][] }

export const TEMPLATES: Template[] = [
  { id: 'j_day', kind: 'journal', title: 'Today', text: 'Dear diary, today I felt {0}. Mostly because of {1}. If I’m honest, what I really want is {2}. Tomorrow I’m going to {3}.',
    slots: [['happy', 'tired', 'anxious', 'invincible', 'lonely'], ['work', 'someone special', 'nothing at all', 'my family', 'money'], ['peace and quiet', 'to be loved', 'to be rich', 'a fresh start', 'an adventure'], ['try harder', 'call someone I miss', 'sleep in', 'take a risk', 'be kinder to myself']] },
  { id: 'j_dream', kind: 'journal', title: 'Last night’s dream', text: 'I dreamed I was {0} in {1}. Everyone I knew was {2}. When I woke up I felt {3}.',
    slots: [['flying', 'lost', 'famous', 'a kid again', 'being chased'], ['an endless city', 'my old school', 'the ocean', 'space', 'a house I’d never seen'], ['laughing', 'gone', 'strangers', 'younger', 'watching me'], ['calm', 'shaken', 'inspired', 'nostalgic', 'confused']] },
  { id: 's_hero', kind: 'story', title: 'The Unlikely Hero', text: 'Once upon a time, {0} lived in {1}. One day, {2} changed everything. With nothing but {3}, they set out — and in the end, {4}.',
    slots: [['a nervous knight', 'a burned-out hacker', 'a talking cat', 'an old fisherman', 'a girl with a secret'], ['a floating city', 'a quiet village', 'neon-soaked Tokyo', 'the bottom of the sea', 'a dying star'], ['a mysterious letter', 'a dragon', 'a stranger’s smile', 'a power outage', 'a song nobody else could hear'], ['courage', 'a rusty sword', 'a laptop', 'a terrible map', 'their best friend'], ['they found home', 'nobody believed them', 'they became a legend', 'the world was saved', 'it was all a dream']] },
  { id: 's_love', kind: 'story', title: 'A Love Story', text: 'They met {0}, on the {1} day of the year. It was {2} at first sight. But {3} stood between them, until {4}.',
    slots: [['in the rain', 'at a funeral', 'in a bookshop', 'on a train', 'online'], ['coldest', 'last', 'longest', 'worst', 'luckiest'], ['love', 'hatred', 'confusion', 'rivalry', 'friendship'], ['an ocean', 'a secret', 'her father', 'his pride', 'time itself'], ['one of them finally said it', 'the war ended', 'a letter arrived', 'they both grew up', 'the very last page']] },
];

/** Fill a template with the chosen options. */
export function compose(t: Template, picks: number[]): string {
  return t.text.replace(/\{(\d)\}/g, (_, i: string) => t.slots[Number(i)][picks[Number(i)] ?? 0] ?? '…');
}

export const NOTE_MAX = 4000;
export const notebook = (g: Game) => g.s.notebook;

/** Save a page into the notebook (the notebook goes into your bag the first time). */
export function saveNote(g: Game, kind: WriteKind, title: string, text: string): NoteEntry | null {
  const body = text.trim().slice(0, NOTE_MAX);
  if (!body) return null;
  const e: NoteEntry = { id: newId(), kind, title: title.trim().slice(0, 60) || (kind === 'journal' ? 'Journal' : 'Untitled story'), text: body, date: g.dateLabel };
  g.s.notebook.unshift(e);
  if (g.s.notebook.length > 200) g.s.notebook.length = 200;
  if (!itemCount(g, 'notebook')) addItem(g, 'notebook');
  return e;
}

/** How much a page is worth (0–1): longer, fuller pages count more. */
export const writeScore = (text: string) => Math.max(0.2, Math.min(1, text.trim().length / 240));
