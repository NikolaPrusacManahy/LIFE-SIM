import type { Game } from '../Game';
import { pcMonth } from '../pc/build';
import { bitconsMonth } from '../systems/bitcons';

// Update 0.8 — the web keeps going between sessions.

export function webMonth(g: Game) {
  const w = g.s.web;
  // ViewTube ad money + slow organic growth
  if (w.channel && w.channel.subs > 100) {
    const ads = Math.round(w.channel.subs * 0.02);
    g.money(ads);
    if (ads >= 50) g.log(`▶️ ViewTube ad revenue: $${ads}.`, 'money');
  }
  // old Chirp posts resurface when you have a job
  if (w.chirp.posts >= 8 && g.s.job && g.chance(0.04)) {
    g.s.job.warnings++;
    g.log(`🐤 HR found your old Chirp posts. Warning ${g.s.job.warnings}/3. (Delete them!)`, 'bad');
  }
  // a laptop used in public can walk away
  if (g.has('laptop') && g.flag('laptopPublic') >= g.s.clock - 1 && g.chance(0.02)) {
    g.take('laptop');
    g.log('💻 Your laptop was stolen from a café table.', 'bad');
  }
  bitconsMonth(g);
  pcMonth(g);
}
