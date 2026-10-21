import { fmt } from '../systems/finance';
import { DAY, NOT_NIGHT, type ActivityDef } from './types';
import { maybeMeet, pct } from './helpers';
import { riskCatch } from '../systems/trouble';
import { addItem } from '../inventory/items';
import { legalAge } from '../rules/us';

/** Downtown (city) and Main Street (country) share most services. */
const both = (defs: Omit<ActivityDef, 'loc'>[]): ActivityDef[] =>
  defs.flatMap((d) => [
    { ...d, id: `${d.id}`, loc: 'downtown' },
    { ...d, id: `${d.id}_c`, loc: 'mainstreet' },
  ]);

const noop = () => '';

export const TOWN_ACTS: ActivityDef[] = [
  ...both([
    { id: 'jobs', name: 'Job Center', icon: '📋', desc: 'Browse openings & apply.', cat: 'panel', energy: 0, panel: 'jobs', run: noop },
    { id: 'shop', name: 'Shops', icon: '🛍️', desc: 'Laptops, guitars, cars.', cat: 'panel', energy: 0, panel: 'shop', run: noop },
    { id: 'realty', name: 'Real Estate', icon: '🏘️', desc: 'Rent or buy a home.', cat: 'panel', energy: 0, panel: 'housing', run: noop },
    { id: 'bank', name: 'Bank', icon: '🏦', desc: 'Invest & pay debt.', cat: 'panel', energy: 0, panel: 'bank', run: noop },
    {
      id: 'coffee', name: 'Coffee & People-Watch', icon: '☕', desc: 'Small joys.', cat: 'fun', energy: 4, cost: 6, phases: NOT_NIGHT,
      run: (g) => {
        g.stat('mood', 4);
        g.stat('creativity', 0.8);
        maybeMeet(g, 0.05, 'a coffee shop');
        return g.pick(['A perfect latte.', 'You invented backstories for strangers.', 'The barista drew a heart in your foam.']);
      },
    },
    {
      id: 'shopping', name: 'Shopping Spree', icon: '👟', desc: 'Retail therapy.', cat: 'fun', energy: 10, cost: 250, phases: NOT_NIGHT,
      run: (g) => {
        g.stat('mood', 9);
        g.stat('looks', 1.5);
        return 'New fit. You look fantastic.';
      },
    },
    {
      id: 'makeover', name: 'Salon Makeover', icon: '💇', desc: 'Fresh look.', cat: 'fun', energy: 5, cost: 400, phases: DAY, cooldown: 12,
      run: (g) => {
        g.stat('looks', 4);
        g.stat('mood', 6);
        g.burst('sparkle');
        return 'You barely recognized yourself. In a good way.';
      },
    },
    {
      id: 'volunteer', name: 'Volunteer', icon: '🤲', desc: 'Help at the shelter.', cat: 'faith', energy: 15, phases: NOT_NIGHT,
      run: (g) => {
        g.karma(4);
        g.stat('mood', 5);
        g.stat('charm', 1);
        return g.pick(['You served 200 meals.', 'A kid at the shelter hugged you.', 'You sorted donations all afternoon.']);
      },
    },
    {
      id: 'busk', name: 'Busk on the Street', icon: '🪕', desc: 'Play for tips.', cat: 'money', energy: 15, phases: NOT_NIGHT,
      lock: (g) => (g.has('guitar') ? null : 'Needs a guitar'),
      run: (g) => {
        const amt = Math.round(g.rand(5, 30) + g.s.stats.creativity * 1.2 + g.s.fame);
        g.money(amt);
        g.stat('creativity', 1.5);
        g.fame(0.4);
        return `Your case filled with ${fmt(amt)} in tips.`;
      },
    },
    {
      id: 'lottery', name: 'Lottery Ticket', icon: '🎟️', desc: '$5 dream.', cat: 'money', energy: 2, cost: 5,
      gate: 'lottery',
      run: (g) => {
        const r = Math.random();
        if (r < 0.0004) {
          g.money(2_000_000);
          g.achieve('jackpot');
          g.burst('coins');
          g.banner('💰 JACKPOT 💰', 0xffd166);
          return 'YOU WON $2,000,000. You screamed in the store.';
        }
        if (r < 0.03) {
          g.money(100);
          return 'Won $100!';
        }
        return 'Not a winner. Never are.';
      },
    },
    // ---- Update 0.3
    {
      id: 'mall', name: 'Hang at the Mall', icon: '🛍️', desc: 'Window shopping, food court.', cat: 'social', energy: 8, phases: NOT_NIGHT,
      run: (g) => {
        g.stat('mood', 5);
        for (const f of g.peopleBy('friend').slice(0, 2)) g.rel(f, 3);
        maybeMeet(g, 0.06, 'the mall');
        return g.pick(['Pretzels and people-watching.', 'You tried on clothes you will never buy.', 'The food court was packed.']);
      },
    },
    {
      id: 'arcade', name: 'Arcade', icon: '👾', desc: 'High scores, low stakes.', cat: 'fun', energy: 8, cost: 10,
      run: (g) => {
        g.stat('mood', 7);
        g.stat('smarts', 0.3);
        return g.chance(0.2) ? 'New high score! Your initials are on the board.' : 'You fed the claw machine $6. No plushie.';
      },
    },
    {
      id: 'cinema', name: 'Movies', icon: '🎬', desc: 'Popcorn and a big screen.', cat: 'fun', energy: 5, cost: 14, phases: ['afternoon', 'evening'],
      run: (g) => {
        g.stat('mood', 7);
        g.stat('creativity', 1);
        const p = g.partner;
        if (p) g.rel(p, 4);
        return g.pick(['A blockbuster with a ridiculous twist.', 'An indie film that made you think.', 'A horror movie. You screamed. Loudly.']);
      },
    },
    {
      id: 'bowling', name: 'Bowling', icon: '🎳', desc: 'Strikes and silly shoes.', cat: 'social', energy: 10, cost: 12, phases: ['afternoon', 'evening'],
      run: (g) => {
        g.stat('mood', 6);
        for (const f of g.peopleBy('friend').slice(0, 3)) g.rel(f, 4);
        return g.chance(0.15) ? 'Three strikes in a row — a turkey!' : 'Mostly gutter balls. Lots of laughing.';
      },
    },
    {
      id: 'shoplift', name: 'Shoplift', icon: '🫳', desc: 'Five-finger discount.', cat: 'money', energy: 8, legality: 'illegal', cooldown: 4,
      risk: (g) => pct(g.odds((g.s.stats.street + g.s.stats.smarts) / 2, 35)),
      preview: () => ['Security 60% if spotted'],
      run: (g) => {
        g.karma(-4);
        g.inc('crimes');
        if (Math.random() < g.odds((g.s.stats.street + g.s.stats.smarts) / 2, 35)) {
          g.stat('looks', 1);
          g.stat('street', 1.5);
          g.stat('mood', 3);
          return 'You walked out with a hoodie you didn’t pay for. Heart pounding.';
        }
        if (riskCatch(g, 0.6, { name: 'Shoplifting', sev: g.age < 18 ? 2 : 1, kind: 'theft', by: 'security' })) return 'A hand on your shoulder: "Come with me, please."';
        return 'A clerk saw you. You dropped it and ran.';
      },
    },
    {
      id: 'fake_id', name: 'Buy a Fake ID', icon: '🪪', desc: 'Gets you into bars and clubs underage. Risky.', cat: 'money', energy: 6, cost: 150, gate: 'fakeId', legality: 'illegal',
      when: (g) => g.age < legalAge(g, 'alcohol') && !g.hasItem('fakeid'),
      preview: () => ['Police 12%'],
      run: (g) => {
        if (riskCatch(g, 0.12, { name: 'Buying a fake ID', sev: 1, kind: 'id', by: 'police' })) return 'The "contact" was an undercover cop…';
        addItem(g, 'fakeid');
        g.karma(-2);
        return 'Meet "Jordan Miller, 23". Bars and clubs might let you in now.';
      },
    },
    {
      id: 'tattoo', name: 'Tattoo Parlour', icon: '🖋️', desc: 'Ink something meaningful (or not).', cat: 'fun', energy: 10, cost: 120, gate: 'tattoo', cooldown: 6,
      run: (g) => {
        const n = g.inc('tattoos');
        g.stat('looks', 1.5);
        g.stat('mood', 6);
        g.fame(0.2);
        return n === 1 ? `Your first tattoo: ${g.pick(['a tiny moon', 'a koi fish', 'your grandma’s handwriting', 'a dagger with roses'])}.` : `Tattoo #${n}. You’re running out of skin.`;
      },
    },
  ]),
  {
    id: 'diner', loc: 'mainstreet', name: 'Diner Breakfast', icon: '🥞', desc: 'Pancakes & local gossip.', cat: 'social', energy: 4, cost: 12, phases: ['morning', 'afternoon'],
    run: (g) => {
      g.stat('mood', 5);
      g.stat('charm', 0.5);
      maybeMeet(g, 0.05, 'the diner');
      return g.pick(['Flo refilled your coffee 6 times.', 'You heard who’s dating who in three counties.', 'Best pancakes in the state.']);
    },
  },
];
