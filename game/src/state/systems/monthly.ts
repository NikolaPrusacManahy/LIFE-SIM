import type { Game } from '../Game';
import { educationMonth } from './education';
import { careerMonth } from './career';
import { jailMonth, orgMonth } from './crime';
import { monthlyFinances, netWorth } from './finance';
import { relationshipsMonth } from './relationships';
import { ASSET_BY_ID } from './finance';
import { intimacyMonth } from './intimacy';
import { underworldMonth } from '../crime/month';
import { addictionMonth } from './addiction';
import { sealJuvenileRecord } from './trouble';
import { peopleMonth } from '../events/people';
import { ensureStaff, retireStaff } from '../npc/school';
import { legalAge } from '../rules/us';
import { godMonth } from './god';
import { webMonth } from '../web/month';

/** Update 0.4 — fire scheduled follow-up events whose time has come. */
function fireSchedule(g: Game) {
  const due = g.s.schedule.filter((x) => x.at <= g.s.clock);
  g.s.schedule = g.s.schedule.filter((x) => x.at > g.s.clock);
  for (const d of due) g.queue(d.id, d.ctx);
}

export function newMonth(g: Game) {
  const s = g.s;
  // a fresh "day": you never fully skip recovery
  if (s.stats.energy < 15) g.stat('health', -2);
  g.stat('energy', 10);

  if (g.jailed) {
    jailMonth(g);
    if (g.s.crime.jail?.juvie) educationMonth(g);
  } else {
    educationMonth(g);
    careerMonth(g);
  }
  orgMonth(g);
  monthlyFinances(g);
  relationshipsMonth(g);
  peopleMonth(g);
  ensureStaff(g);
  retireStaff(g);
  fireSchedule(g);
  intimacyMonth(g);
  addictionMonth(g);
  underworldMonth(g);
  godMonth(g);
  webMonth(g);
  body(g);
  birthday(g);
  checkAchievements(g);
}

function body(g: Game) {
  const s = g.s;
  const st = s.stats;
  const age = g.age;
  g.stat('mood', (50 - st.mood) * 0.07);
  for (const a of s.assets) if (ASSET_BY_ID[a]?.mood) g.stat('mood', ASSET_BY_ID[a].mood! * 0.5);
  if (st.fitness > 15) g.stat('fitness', age > 40 ? -0.9 : -0.5);
  if (age > 33) g.stat('looks', -0.12 - (age > 55 ? 0.12 : 0));
  // health
  if (age < 40 && st.health < 100) g.stat('health', 0.6);
  if (age >= 40) {
    let decay = (age - 40) * 0.013;
    if (st.fitness > 55) decay *= 0.6;
    if (g.hasTrait('iron')) decay *= 0.7;
    g.stat('health', -decay);
  }
  if (st.mood < 15) g.stat('health', -0.6);
  // heat cools off
  g.heat(s.crime.fugitive ? -1 : -3.5);
  if (s.crime.fugitive && g.chance(0.04 + s.heat / 400)) g.queue('busted', { name: 'Prison escape', sev: 4, kind: 'other' }, true);
  if (st.mood < 12 && !g.onCooldown('ev:depression') && !g.queued('depression')) {
    g.cooldown('ev:depression', 48);
    g.queue('depression');
  }
  if (st.health < 18 && !g.onCooldown('ev:health_crisis')) {
    g.cooldown('ev:health_crisis', 24);
    g.queue('health_crisis');
  }
  // old age
  if (age >= 72) {
    const p = 0.0018 * Math.pow(1.13, age - 72) * (1.7 - st.health / 100);
    if (g.chance(p)) g.die(g.pick(['Passed peacefully in their sleep', 'Heart failure', 'Old age', 'A stroke']));
  }
}

function birthday(g: Game) {
  if (g.ageMonths % 12 !== 0) return;
  const age = g.age;
  g.log(`🎂 Happy birthday! You turned ${age}.`, 'milestone');
  g.burst('confetti');
  if (age === 16) g.queue('sweet16');
  if (age === 18) {
    sealJuvenileRecord(g);
    if (g.flag('grandmaTrust')) {
      g.money(g.flag('grandmaTrust'));
      g.log(`👵 Grandma’s trust fund paid out: $${g.flag('grandmaTrust').toLocaleString()}.`, 'money');
      g.setFlag('grandmaTrust', 0);
    }
    g.queue('adulthood');
    if (g.s.sexuality === 'unsure') g.queue('settle_sexuality');
  }
  // the night the bars open: 21 in the US, 18 in the EU
  if (age === legalAge(g, 'alcohol')) g.queue('turn21');
  if (age === 40 || age === 50) g.queue('midlife');
  if (age === 30 || age === 60 || age === 80) g.queue('reflection', { age });
  if (age === 100) g.achieve('centenarian');
}

export function checkAchievements(g: Game) {
  const s = g.s;
  const nw = netWorth(g);
  if (nw >= 1_000_000) g.achieve('millionaire');
  if (nw >= 1_000_000_000) g.achieve('billionaire');
  if (s.fame >= 80) g.achieve('famous');
  if (s.karma >= 80) g.achieve('saint');
  if (s.karma <= -80) g.achieve('monster');
  if (s.stats.smarts >= 95) g.achieve('bigbrain');
  if (s.stats.fitness >= 95) g.achieve('peak');
  if (s.crime.record.length >= 3) g.achieve('careercriminal');
  if (g.peopleBy('child').length >= 3) g.achieve('bigfamily');
  const degrees = s.education.degrees.filter((d) => d !== 'hs' && d !== 'ged').length;
  if (degrees >= 3) g.achieve('scholar3');
}
