import {
  MONTHS, PHASES, STAT_LABEL,
  type ActiveEvent, type FxKind, type GameState, type LogKind, type MeterKey, type Person, type Phase, type Role, type StatKey,
} from './types';
import { ACT_BY_ID, type ActivityDef } from './activities';
import { EVENT_BY_ID, type ChoiceDef, type EventDef } from './events';
import { ACHIEVEMENT_BY_ID } from './data/achievements';
import { TRAIT_BY_ID } from './data/traits';
import { makeNpc } from './npc/generator';
import { newMonth } from './systems/monthly';
import { currentObligations, recordSkips } from './systems/obligations';
import { netWorth } from './systems/finance';
import { ageGate } from './rules/us';
import { settings } from './settings';
import { rollEncounter } from './encounters/pools';
import { textsTick } from './phone/texts';
import { pursuitTick } from './crime/pursuit';
import { grounded } from './systems/trouble';

/** Update 0.3 — default log kind per activity category (drives Diary filters). */
const CAT_KIND: Partial<Record<ActivityDef['cat'], LogKind>> = { study: 'school', work: 'work', romance: 'love', money: 'money', crime: 'crime' };

/** Update 0.4 — every mature event resolution (tests prove nobody under 18 is ever involved). */
export const MATURE_EVENT_AUDIT: { id: string; playerAge: number; npcAge: number | null; mature: boolean }[] = [];

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
let uid = 0;
export const newId = () => `${Date.now().toString(36)}${(uid++).toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export interface ActionResult {
  title: string;
  icon: string;
  text: string;
  deltas: Record<string, number>;
  fx: FxKind[];
  monthPassed: boolean;
}

export interface ActivityStatus {
  visible: boolean;
  ok: boolean;
  reason?: string;
}

export interface ResolvedChoice {
  choice: ChoiceDef;
  disabled: string | null;
}

export class Game {
  s: GameState;
  private deltas: Record<string, number> = {};
  private fxq: FxKind[] = [];
  private listeners = new Set<() => void>();
  private monthFlag = false;
  /** set by systems to request saving; UI wires this */
  onSave: ((g: Game) => void) | null = null;

  constructor(state: GameState) {
    this.s = state;
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  notify() {
    for (const fn of this.listeners) fn();
  }

  // ------------------------------------------------------------------ time
  get ageMonths() { return this.s.clock - this.s.bornAt; }
  get age() { return Math.floor(this.ageMonths / 12); }
  get month() { return ((this.s.clock % 12) + 12) % 12; }
  get year() { return this.s.startYear + Math.floor(this.s.clock / 12); }
  get phase(): Phase { return PHASES[this.s.phase]; }
  get isSummer() { return this.month >= 5 && this.month <= 7; }
  get isWinter() { return this.month === 11 || this.month <= 1; }
  get isNight() { return this.s.phase === 3; }
  get dateLabel() { return `${MONTHS[this.month]} ${this.year}`; }
  get jailed() { return !!this.s.crime.jail; }
  get livesWithParents() { return this.s.housing === 'parents'; }
  ageOf(p: Person) { return Math.floor((this.s.clock - p.bornMonths) / 12); }

  // ------------------------------------------------------------------ traits / assets / degrees
  hasTrait(id: string) { return this.s.traits.includes(id); }
  has(asset: string) { return this.s.assets.includes(asset); }
  give(asset: string) { if (!this.has(asset)) this.s.assets.push(asset); }
  take(asset: string) { this.s.assets = this.s.assets.filter((a) => a !== asset); }
  hasDegree(d: string) { return this.s.education.degrees.includes(d); }
  /** Update 0.4 — inventory item check */
  hasItem(id: string) { return (this.s.inventory[id] ?? 0) > 0; }

  // ------------------------------------------------------------------ stat helpers
  private track(k: string, d: number) {
    if (!d) return;
    this.deltas[k] = (this.deltas[k] ?? 0) + d;
  }

  gainMult(k: StatKey) {
    let m = 1;
    for (const t of this.s.traits) m *= TRAIT_BY_ID[t]?.mult?.[k] ?? 1;
    return m;
  }

  /** Adjust a 0..100 stat. Learnable stats get trait multipliers & diminishing returns. */
  stat(k: StatKey, d: number): number {
    if (!d) return 0;
    const st = this.s.stats;
    let delta = d;
    if (d > 0 && k !== 'energy' && k !== 'health' && k !== 'mood') {
      delta *= this.gainMult(k) * Math.max(0.22, 1 - st[k] / 125);
    }
    if (k === 'health' && d < 0 && this.hasTrait('iron')) delta *= 0.7;
    const before = st[k];
    st[k] = clamp(before + delta, 0, 100);
    const real = st[k] - before;
    this.track(k, real);
    return real;
  }

  stats(changes: Partial<Record<StatKey | MeterKey | 'money', number>>) {
    for (const [k, v] of Object.entries(changes)) {
      if (!v) continue;
      if (k === 'money') this.money(v);
      else if (k === 'karma' || k === 'heat' || k === 'fame') this.meter(k, v);
      else this.stat(k as StatKey, v);
    }
  }

  meter(k: MeterKey, d: number) {
    if (!d) return;
    if (k === 'heat' && d > 0 && this.hasTrait('hothead')) d *= 1.25;
    const lo = k === 'karma' ? -100 : 0;
    const before = this.s[k];
    this.s[k] = clamp(before + d, lo, 100);
    this.track(k, this.s[k] - before);
  }
  karma(d: number) { this.meter('karma', d); }
  heat(d: number) { this.meter('heat', d); }
  fame(d: number) { this.meter('fame', d); }

  money(d: number) {
    const r = Math.round(d);
    if (!r) return;
    this.s.money += r;
    this.track('money', r);
  }
  canAfford(n: number) { return this.s.money >= n; }

  flag(k: string) { return this.s.flags[k] ?? 0; }
  setFlag(k: string, v = 1) { this.s.flags[k] = v; }
  inc(k: string, d = 1) { this.s.flags[k] = (this.s.flags[k] ?? 0) + d; return this.s.flags[k]; }

  onCooldown(id: string) { return (this.s.cooldowns[id] ?? -1) > this.s.turn; }
  cooldown(id: string, turns: number) { this.s.cooldowns[id] = this.s.turn + turns; }

  // ------------------------------------------------------------------ randomness
  chance(p: number) { return Math.random() < p; }
  rand(a: number, b: number) { return Math.floor(a + Math.random() * (b - a + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

  /** probability of beating `difficulty` with stat value `v` */
  odds(v: number, difficulty: number) {
    let p = 0.5 + (v - difficulty) / 70;
    if (this.hasTrait('lucky')) p += 0.07;
    return clamp(p, 0.04, 0.96);
  }
  statOdds(k: StatKey, difficulty: number) {
    let p = this.odds(this.s.stats[k], difficulty);
    if (this.hasTrait('hothead') && (k === 'fitness' || k === 'street')) p = clamp(p + 0.08, 0.04, 0.96);
    return p;
  }
  check(k: StatKey, difficulty: number) { return Math.random() < this.statOdds(k, difficulty); }
  pct(k: StatKey, difficulty: number) { return `${Math.round(this.statOdds(k, difficulty) * 100)}%`; }

  // ------------------------------------------------------------------ narrative
  log(text: string, kind: LogKind = 'info', pid?: string) {
    this.s.log.unshift({ turn: this.s.turn, date: `${this.dateLabel} · ${this.phase}`, text, kind, ...(pid ? { pid } : {}) });
    if (this.s.log.length > 120) this.s.log.length = 120;
  }
  fx(f: FxKind) { this.fxq.push(f); }
  banner(text: string, color?: number) { this.fx({ type: 'banner', text, color }); }
  burst(kind: Extract<FxKind, { type: 'burst' }>['kind']) { this.fx({ type: 'burst', kind }); }

  queue(id: string, ctx: Record<string, any> = {}, front = false) {
    if (!EVENT_BY_ID[id]) { console.warn('unknown event', id); return; }
    const ev: ActiveEvent = { id, ctx };
    if (front) this.s.events.unshift(ev);
    else this.s.events.push(ev);
  }
  queued(id: string) { return this.s.events.some((e) => e.id === id); }

  achieve(id: string) {
    if (this.s.achievements.includes(id)) return;
    const a = ACHIEVEMENT_BY_ID[id];
    if (!a) return;
    this.s.achievements.push(id);
    this.log(`🏆 Achievement unlocked: ${a.name}`, 'milestone');
    this.banner(`🏆 ${a.name}`, 0xffd166);
  }
  milestone(text: string) {
    this.s.milestones.push(`Age ${this.age}: ${text}`);
    this.log(text, 'milestone');
  }

  // ------------------------------------------------------------------ people
  /** Update 0.4 — every NPC is fully generated (gender, pronouns, sexuality, archetype, traits, looks). */
  addPerson(role: Role, o: Partial<Person> & { age?: number } = {}): Person {
    const age = o.age ?? this.age;
    const { age: _age, ...rest } = o;
    const p = makeNpc(newId(), { role, age, clock: this.s.clock, gender: o.gender, name: o.name, surname: o.surname, rel: o.rel, met: o.met ?? this.dateLabel, where: o.where ?? o.met, tags: o.tags, bornMonths: o.bornMonths, archetype: o.archetype });
    Object.assign(p, rest, { id: p.id, role, pronouns: o.pronouns ?? p.pronouns });
    this.s.people.push(p);
    return p;
  }
  peopleBy(...roles: Role[]) { return this.s.people.filter((p) => p.alive && roles.includes(p.role)); }
  firstBy(...roles: Role[]) { return this.peopleBy(...roles)[0] ?? null; }
  personById(id: string) { return this.s.people.find((p) => p.id === id) ?? null; }
  get partner() { return this.firstBy('spouse', 'engaged', 'partner', 'dating'); }
  get parents() { return this.peopleBy('mother', 'father'); }
  rel(p: Person | null | undefined, d: number) {
    if (!p) return;
    const m = d > 0 && this.hasTrait('empath') ? 1.5 : 1;
    p.rel = clamp(p.rel + d * m, 0, 100);
  }

  die(cause: string) {
    if (this.s.dead) return;
    this.s.dead = { cause, age: this.age };
    this.log(`💀 You died at age ${this.age}: ${cause}`, 'bad');
  }

  // ------------------------------------------------------------------ activities
  activityStatus(def: ActivityDef): ActivityStatus {
    if (def.minAge !== undefined && this.age < def.minAge) return { visible: false, ok: false };
    if (def.maxAge !== undefined && this.age > def.maxAge) return { visible: false, ok: false };
    if (def.region && def.region !== this.s.region) return { visible: false, ok: false };
    if (def.when && !def.when(this)) return { visible: false, ok: false };
    if (def.gate) {
      const gate = ageGate(def.gate, this);
      // 21+ venues: a fake ID gets 16–20s through the door, at a risk
      const fakeOk = def.legality === 'illegalUnder21' && (!def.venue || (this.hasItem('fakeid') && this.age >= 16));
      if (!gate.allowed && !fakeOk) return { visible: true, ok: false, reason: def.venue && this.age >= 16 ? `${gate.reason} (or a fake ID)` : gate.reason };
    }
    if (grounded(this) && this.s.phase >= 2 && def.loc !== 'home') return { visible: true, ok: false, reason: 'Grounded' };
    if (def.phases && !def.phases.includes(this.phase)) {
      return { visible: true, ok: false, reason: `Only ${def.phases.map((p) => p).join('/')}` };
    }
    const lock = def.lock?.(this);
    if (lock) return { visible: true, ok: false, reason: lock };
    const cost = this.costOf(def);
    if (cost > 0 && this.s.money < cost) return { visible: true, ok: false, reason: `Need $${cost.toLocaleString()}` };
    if (def.cooldown && this.onCooldown(`act:${def.id}`)) return { visible: true, ok: false, reason: 'Done recently' };
    const e = this.energyCost(def);
    if (e > 0 && this.s.stats.energy < e) return { visible: true, ok: false, reason: 'Too tired' };
    return { visible: true, ok: true };
  }

  costOf(def: ActivityDef) {
    return typeof def.cost === 'function' ? def.cost(this) : def.cost ?? 0;
  }

  energyCost(def: ActivityDef) {
    let e = def.energy;
    if (e <= 0) return e;
    if (this.hasTrait('nightowl') && this.s.phase >= 2) e *= 0.65;
    if (this.s.stats.health < 30) e *= 1.3;
    if (this.age >= 60) e *= 1 + (this.age - 60) / 60;
    return Math.round(e);
  }

  canAct() {
    return !this.s.dead && this.s.events.length === 0 && !this.s.underworld.scene;
  }

  doActivity(id: string): ActionResult | null {
    const def = ACT_BY_ID[id];
    if (!def || !this.canAct()) return null;
    const st = this.activityStatus(def);
    if (!st.ok) return null;
    this.monthFlag = false;
    const obligations = currentObligations(this);
    this.s.location = def.loc;
    const cost = this.costOf(def);
    if (cost) this.money(-cost);
    const e = this.energyCost(def);
    if (e > 0) this.stat('energy', -e);
    if (def.cooldown) this.cooldown(`act:${def.id}`, def.cooldown);
    const text = def.run(this);
    recordSkips(this, obligations, def.id);
    this.log(text, def.kind ?? CAT_KIND[def.cat] ?? 'info');
    if (def.loc !== 'home' && !def.panel) rollEncounter(this, def.loc);
    this.endPhase();
    return this.result(def.name, def.icon, text);
  }

  /** Spend a time slot on something not in the activity table (e.g. people interactions). */
  spendTurn(title: string, icon: string, fn: () => string, pid?: string): ActionResult | null {
    if (!this.canAct()) return null;
    this.monthFlag = false;
    const obligations = currentObligations(this);
    const text = fn();
    recordSkips(this, obligations, '__social');
    this.log(text, 'love', pid);
    this.endPhase();
    return this.result(title, icon, text);
  }

  private result(title: string, icon: string, text: string): ActionResult {
    const r: ActionResult = { title, icon, text, deltas: this.deltas, fx: this.fxq, monthPassed: this.monthFlag };
    this.deltas = {};
    this.fxq = [];
    this.save();
    this.notify();
    return r;
  }

  /** Drain any deltas/fx produced outside of an action (e.g. buying something from a panel). */
  flush(title = '', icon = '', text = ''): ActionResult {
    return this.result(title, icon, text);
  }

  private endPhase() {
    this.s.turn++;
    this.s.phase++;
    if (this.s.phase >= PHASES.length) {
      this.s.phase = 0;
      this.s.clock++;
      this.monthFlag = true;
      newMonth(this);
    }
    if (!this.s.dead && this.s.stats.health <= 0) this.die(this.pick(['Your body gave out', 'Complications from poor health']));
    if (!this.s.dead) this.rollRandomEvent();
    if (!this.s.dead) textsTick(this);
    if (!this.s.dead) pursuitTick(this);
    this.s.netWorthPeak = Math.max(this.s.netWorthPeak, netWorth(this));
  }

  private rollRandomEvent() {
    if (this.s.events.length) return;
    const p = this.jailed ? 0.22 : 0.27;
    if (!this.chance(p)) return;
    const pool: { def: EventDef; w: number }[] = [];
    let total = 0;
    for (const def of Object.values(EVENT_BY_ID)) {
      const r = def.random;
      if (!r) continue;
      if (r.once && this.flag(`ev:${def.id}`)) continue;
      if (def.mature && (!settings.mature || this.age < 18)) continue;
      if (this.onCooldown(`ev:${def.id}`)) continue;
      if (r.jail === undefined ? this.jailed : r.jail !== this.jailed) continue;
      if (!r.when(this)) continue;
      const w = typeof r.weight === 'function' ? r.weight(this) : r.weight ?? 1;
      if (w <= 0) continue;
      pool.push({ def, w });
      total += w;
    }
    if (!pool.length) return;
    let roll = Math.random() * total;
    for (const { def, w } of pool) {
      roll -= w;
      if (roll <= 0) {
        const r = def.random!;
        this.cooldown(`ev:${def.id}`, r.cooldown ?? 48);
        if (r.once) this.setFlag(`ev:${def.id}`);
        this.queue(def.id, r.ctx ? r.ctx(this) : {});
        return;
      }
    }
  }

  // ------------------------------------------------------------------ events
  get currentEvent(): ActiveEvent | null { return this.s.events[0] ?? null; }

  eventTitle(ev: ActiveEvent) {
    const def = EVENT_BY_ID[ev.id];
    return typeof def.title === 'function' ? def.title(this, ev.ctx) : def.title;
  }
  eventText(ev: ActiveEvent) {
    return EVENT_BY_ID[ev.id].text(this, ev.ctx);
  }
  /** Update 0.4 — the person an event is about (for the chip and the NPC avatar). */
  eventPerson(ev: ActiveEvent): Person | null {
    const def = EVENT_BY_ID[ev.id];
    const id = def.who ? def.who(this, ev.ctx) : ev.ctx.pid;
    if (id) return this.personById(id);
    // older events: find a known person named in the text
    const text = def.text(this, ev.ctx);
    return this.s.people.find((p) => p.alive && p.name.length >= 3 && new RegExp(`\\b${p.name}\\b`).test(text)) ?? null;
  }

  eventIcon(ev: ActiveEvent) {
    return EVENT_BY_ID[ev.id].icon ?? '❗';
  }
  choicesFor(ev: ActiveEvent): ResolvedChoice[] {
    const def = EVENT_BY_ID[ev.id];
    const list = typeof def.choices === 'function' ? def.choices(this, ev.ctx) : def.choices;
    const out = list
      .filter((c) => !c.when || c.when(this, ev.ctx))
      .map((c) => ({ choice: c, disabled: c.req ? c.req(this, ev.ctx) : null }));
    // Context can go stale between queueing and showing (e.g. fired before a promotion) — never soft-lock.
    if (!out.some((c) => !c.disabled)) out.push({ choice: { label: 'Continue', run: () => '' }, disabled: null });
    return out;
  }

  resolveChoice(idx: number): ActionResult | null {
    const ev = this.s.events[0];
    if (!ev) return null;
    const choices = this.choicesFor(ev);
    const rc = choices[idx];
    if (!rc || rc.disabled) return null;
    const title = this.eventTitle(ev);
    const icon = this.eventIcon(ev);
    const def = EVENT_BY_ID[ev.id];
    const who = this.eventPerson(ev);
    if (def.mature) {
      MATURE_EVENT_AUDIT.push({ id: ev.id, playerAge: this.age, npcAge: who ? this.ageOf(who) : null, mature: settings.mature });
      if (this.age < 18 || (who && this.ageOf(who) < 18) || !settings.mature) throw new Error(`mature event ${ev.id} resolved outside the 18+ gate`);
    }
    this.s.events.shift();
    this.monthFlag = false;
    const text = rc.choice.run(this, ev.ctx);
    if (text) this.log(`${icon} ${text}`, 'event', who?.id);
    if (!this.s.dead && this.s.stats.health <= 0) this.die('Your injuries were too severe');
    return this.result(title, icon, text);
  }

  // ------------------------------------------------------------------ autopilot
  autoActionId(): string | null {
    const obs = currentObligations(this);
    for (const ob of obs) {
      for (const id of ob.acts) {
        const d = ACT_BY_ID[id];
        if (d && this.activityStatus(d).ok) return id;
      }
    }
    const order = this.jailed
      ? this.isNight ? ['jail_sleep'] : ['jail_headdown', 'jail_sleep']
      : this.s.underworld.pursuit && !this.s.underworld.pursuit.settled
        ? this.isNight ? ['run_sleep', 'run_hide'] : ['run_hide', 'run_backroads']
        : this.isNight ? ['sleep'] : this.s.stats.energy < 40 ? ['nap', 'relax'] : ['relax', 'nap'];
    for (const id of order) {
      const d = ACT_BY_ID[id];
      if (d && this.activityStatus(d).ok) return id;
    }
    return null;
  }

  /** Run default routine until the month rolls over or something interrupts. */
  autopilot(): ActionResult[] {
    const out: ActionResult[] = [];
    for (let i = 0; i < 4; i++) {
      if (!this.canAct()) break;
      const id = this.autoActionId();
      if (!id) break;
      const r = this.doActivity(id);
      if (!r) break;
      out.push(r);
      if (r.monthPassed) break;
    }
    return out;
  }

  save() {
    this.onSave?.(this);
  }

  describeDelta(k: string, v: number) {
    const label = (STAT_LABEL as Record<string, string>)[k] ?? k;
    if (k === 'money') return `${v > 0 ? '+' : '-'}$${Math.abs(Math.round(v)).toLocaleString()}`;
    const n = Math.round(v);
    return `${n > 0 ? '+' : ''}${n} ${label}`;
  }
}
