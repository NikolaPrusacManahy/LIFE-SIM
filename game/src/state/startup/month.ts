import type { Game } from '../Game';
import { DIVIDEND_TAX, costsOf, dividendRate, hypeFloor, outputOf, refreshStatus, revenueOf, startup } from './company';
import { fmt } from '../systems/finance';

// Update 0.11 — the company keeps running between your computer sittings.

export function startupMonth(g: Game) {
  const c = startup(g);
  if (!c) return;
  // development toward the next launch
  if (c.progress < 100) c.progress = Math.min(100, c.progress + outputOf(c));
  // hype fades a little every month; the market does its thing
  // the higher the hype, the faster it fades
  c.hype = Math.max(Math.min(c.hype, hypeFloor(c)), c.hype - (3 + c.hype * 0.05) * (1 - 0.15 * c.skills.brand));
  const r = Math.random();
  const viral = 0.05 + 0.02 * c.skills.viral;
  if (c.version && r < viral) {
    c.hype = Math.min(100, c.hype + 15);
    g.log(`📈 ${c.name} went viral this month!`, 'money');
  } else if (c.version && r < viral + 0.04 * (1 - 0.2 * c.skills.stability)) {
    c.quality = Math.max(10, c.quality - 10);
    g.log(`📉 A bug in ${c.name}’s product made headlines. Quality −10.`, 'bad');
  }
  c.revenue = revenueOf(c);
  const costs = costsOf(c);
  c.profit = c.revenue - costs;
  c.cash += c.profit;
  // real money: your share of the dividend goes to your own account
  if (c.profit > 0 && c.cash > 0) {
    const out = Math.round(Math.min(c.cash, c.profit * dividendRate(c)));
    c.cash -= out;
    const net = Math.round(out * c.stake * (1 - DIVIDEND_TAX));
    if (net > 0) {
      g.money(net);
      c.paid = (c.paid ?? 0) + net;
      g.log(`💼 ${c.name} paid you ${fmt(net)} (your share, after tax).`, 'money');
    }
  }
  if (c.progress >= 100 && !g.flag(`launchReady:${c.version}`)) {
    g.setFlag(`launchReady:${c.version}`);
    g.log(`🛠️ ${c.name} v${c.version + 1} is ready to launch. (Computer → START-UP)`, 'money');
  }
  if (c.profit > 0) {
    c.redMonths = 0;
    c.greenMonths++;
    if (c.greenMonths % 6 === 0) c.points++;
  } else c.greenMonths = 0;
  if (c.cash < 0) {
    c.redMonths++;
    g.log(`⚠️ ${c.name} is ${fmt(-c.cash)} in the red (${c.redMonths}/3 months).`, 'bad');
    if (c.redMonths >= 3) {
      c.closed = true;
      c.stake = 0;
      g.stat('mood', -15);
      g.milestone(`${c.name} went under`);
    }
  }
  refreshStatus(g);
}
