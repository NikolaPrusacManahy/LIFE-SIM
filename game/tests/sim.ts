import { createLife, randomLook, type NewLifeOptions } from '../src/state/newGame';
import type { Game } from '../src/state/Game';
import { visibleLocations } from '../src/state/systems/world';
import { activitiesAt } from '../src/state/activities';
import { visibleCareers, applyJob } from '../src/state/systems/career';
import { availablePrograms, enroll, fundingOptions } from '../src/state/systems/education';
import { interactionsFor } from '../src/state/systems/relationships';
import { doInteraction } from '../src/state/npc/interactions';
import { nextProfile, swipe } from '../src/state/systems/dating';
import type { Background, Region } from '../src/state/types';
import { COVER_ACTIONS, coverUp, finishScene } from '../src/state/crime/evidence';
import { sendChip, chipsFor, tabsFor, threadState } from '../src/state/phone/chat';
import { answer, contextReplies, pendingMessage } from '../src/state/phone/convo';
import { addItem } from '../src/state/inventory/items';
import { SITES, actionLock, siteLock, webAct } from '../src/state/web/sites';
import { closeSession } from '../src/state/pc/session';
import { DRINKS, drinkLock, endNight, orderDrink } from '../src/state/nightlife/night';
import { approach, chipsFor as nightChips, current, talk } from '../src/state/nightlife/talk';
import { chooseLeave, leaveOptions } from '../src/state/nightlife/leave';
import { INCIDENT_CHOICES, NIGHT_ACTIONS, nightAct, resolveIncident } from '../src/state/nightlife/extras';
import { actionLock as dateLock, actionsFor, answerOffer, dateAct, doMoment, endDate, momentLock } from '../src/state/datenight/date';
import type { Moment } from '../src/state/datenight/types';

export interface SimOptions {
  maxTurns?: number;
  /** shift the starting age (years added to 14) */
  ageOffset?: number;
  /** chance per turn to interact with someone (exercises relationships / 18+ gates) */
  social?: number;
  /** called whenever an event is about to be resolved */
  onEvent?: (g: Game) => void;
  /** Update 0.5 — chance per turn to pick a crime (activity or Underworld interaction) */
  crime?: number;
  /** Update 0.5 — chance per turn to send a chat chip */
  chat?: number;
  /** Update 0.5 — start with crime gear in the bag */
  gear?: boolean;
  /** Update 0.5.1 — creator options (startAge, millionaire, rules) */
  start?: Partial<NewLifeOptions>;
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** Play a life with random-but-legal inputs. Returns the finished game. */
export function simulateLife(bg: Background, home: Region, opts: SimOptions | number = {}): Game {
  const o: SimOptions = typeof opts === 'number' ? { maxTurns: opts } : opts;
  const g = createLife({ name: 'Test', familyName: 'Sim', gender: pick(['female', 'male', 'nonbinary'] as const), background: bg, hometown: home, traits: ['genius', 'lucky'], look: randomLook(), ...o.start });
  if (o.ageOffset) {
    g.s.bornAt -= o.ageOffset * 12;
    if (o.ageOffset >= 4) {
      g.s.education.current = null;
      g.s.education.degrees.push('hs');
    }
  }
  const social = o.social ?? 0.05;
  if (o.gear) for (const id of ['lockpick', 'gloves', 'mask', 'burner', 'knife', 'sedative', 'poison', 'restraints']) addItem(g, id, 2);
  const maxTurns = o.maxTurns ?? 8000;
  for (let i = 0; i < maxTurns && !g.s.dead; i++) {
    const ev = g.currentEvent;
    if (ev) {
      o.onEvent?.(g);
      const choices = g.choicesFor(ev).map((c, idx) => ({ c, idx })).filter((x) => !x.c.disabled);
      if (!choices.length) throw new Error(`event ${ev.id} has no enabled choice`);
      g.resolveChoice(pick(choices).idx);
      continue;
    }
    // Update 0.10 — on a date: do things, take the moments that open up, then say goodnight
    if (g.s.date) {
      playDateStep(g);
      continue;
    }
    // Update 0.8 — a night out: drink, mingle, maybe leave with someone, then head home
    if (g.s.night) {
      playNightStep(g);
      continue;
    }
    // Update 0.8 — at a computer: do a few things on the web, then shut down
    if (g.s.session) {
      const sites = SITES.filter((x) => !siteLock(g, x) && x.actions.length);
      const site = sites.length && Math.random() < 0.8 ? pick(sites) : null;
      const a = site ? pick(site.actions.filter((x) => !actionLock(g, x))) : null;
      if (site && a && g.s.session.left > 0) webAct(g, site.id, a.id);
      else closeSession(g);
      continue;
    }
    // Update 0.5 — an open crime scene blocks every other action: cover up, then leave
    const scene = g.s.underworld.scene;
    if (scene) {
      const acts = COVER_ACTIONS.filter((a) => !scene.used.includes(a.id) && !a.req?.(g));
      if (scene.actionsLeft > 0 && acts.length && Math.random() < 0.8) coverUp(g, pick(acts).id);
      else finishScene(g);
      continue;
    }
    if (o.chat && Math.random() < o.chat) {
      const p = pick(g.s.people.filter((x) => x.hasNumber && threadState(g, x) === 'open'));
      if (p) {
        // Update 0.8 — answer their message first (contextual replies), otherwise start something
        const pend = pendingMessage(g, p.id);
        const ctx = pend ? contextReplies(g, p, pend).filter((x) => !x.reason) : [];
        if (pend && ctx.length) answer(g, p.id, pend.id, pick(ctx).reply.id);
        else {
          const chips = chipsFor(g, p, pick(tabsFor(g, p))).filter((c) => !c.reason);
          if (chips.length) sendChip(g, p.id, pick(chips).chip.id, Math.random() < 0.5);
        }
      }
    }
    if (o.crime && Math.random() < o.crime && g.canAct()) {
      const crimeActs = visibleLocations(g).flatMap((l) => activitiesAt(l.id)).filter((a) => a.cat === 'crime' && g.activityStatus(a).ok);
      const targets = g.s.people.filter((x) => x.alive && x.status === 'alive');
      const p = Math.random() < 0.5 ? pick(targets) : null;
      const uw = p ? interactionsFor(g, p).filter((a) => a.ok && a.def.group === 'Underworld') : [];
      if (p && uw.length) {
        const a = pick(uw);
        const opts = (a.options ?? []).filter((x) => !x.reason);
        if (!a.options || opts.length) {
          doInteraction(g, p.id, a.def.id, opts.length ? pick(opts).id : undefined);
          continue;
        }
      }
      if (crimeActs.length) {
        g.doActivity(pick(crimeActs).id);
        continue;
      }
    }
    if (i % 40 === 0) {
      const jobs = visibleCareers(g).filter((x) => x.st.ok);
      if (jobs.length && (!g.s.job || Math.random() < 0.2)) applyJob(g, pick(jobs).c.id);
      const progs = availablePrograms(g).filter((x) => x.st.ok);
      if (progs.length && Math.random() < 0.5) {
        const p = pick(progs).p;
        const f = fundingOptions(g, p).find((x) => x.ok);
        if (f) enroll(g, p.id, f.id);
      }
      if (g.age >= 18 && Math.random() < 0.5) swipe(g, nextProfile(g), true);
    }
    if (Math.random() < social) {
      const p = pick(g.s.people.filter((x) => x.alive));
      const acts = p ? interactionsFor(g, p).filter((a) => a.ok) : [];
      if (p && acts.length) {
        const a = pick(acts);
        const opts = (a.options ?? []).filter((o) => !o.reason);
        if (a.options && !opts.length) continue;
        const opt = opts.length ? pick(opts).id : undefined;
        doInteraction(g, p.id, a.def.id, opt);
        continue;
      }
    }
    if (Math.random() < 0.5) {
      g.autopilot();
      continue;
    }
    const acts = visibleLocations(g).flatMap((l) => activitiesAt(l.id)).filter((a) => !a.panel && g.activityStatus(a).ok);
    const a = pick(acts);
    if (a) g.doActivity(a.id);
    else g.autopilot();
  }
  return g;
}

/** Update 0.8 — one random step of a night out (exported for the nightlife test). */
export function playNightStep(g: Game) {
  const n = g.s.night!;
  if (n.incident) {
    resolveIncident(g, pick(INCIDENT_CHOICES[n.incident.kind]).id);
    return;
  }
  if (n.time <= 0) {
    endNight(g);
    return;
  }
  const c = current(g);
  if (c) {
    const opts = leaveOptions(g, c);
    if (opts.length && Math.random() < 0.5) {
      chooseLeave(g, pick(opts), 'the bar');
      return;
    }
    const chips = nightChips(g, c).filter((x) => !x.reason);
    talk(g, chips.length ? pick(chips).chip : 'leave');
    return;
  }
  const r = Math.random();
  if (r < 0.3) {
    const d = DRINKS.filter((x) => !drinkLock(g, x.id));
    if (d.length) orderDrink(g, pick(d).id);
  } else if (r < 0.75) {
    const idx = n.crowd.map((x, i) => ({ x, i })).filter((y) => !y.x.done && (y.x.zone !== 'vip' || n.vip));
    if (idx.length) approach(g, pick(idx).i);
  } else if (r < 0.95) {
    const acts = NIGHT_ACTIONS.filter((a) => (!a.zone || a.zone === n.zone) && !a.lock?.(g));
    if (acts.length) nightAct(g, pick(acts).id);
  } else endNight(g);
}

/** Update 0.10 — one random step of a date (exported for the date test). */
export function playDateStep(g: Game) {
  const d = g.s.date!;
  if (d.offer) {
    answerOffer(g, Math.random() < 0.6);
    return;
  }
  if (d.time <= 0) {
    endDate(g);
    return;
  }
  const open = (['hands', 'kiss', 'french', 'yours', 'restroom'] as Moment[]).filter((m) => !momentLock(g, m));
  if (open.length && Math.random() < 0.4) {
    doMoment(g, pick(open));
    return;
  }
  const acts = actionsFor(g).filter((a) => !dateLock(g, a));
  if (acts.length) dateAct(g, pick(acts).id);
  else endDate(g);
}
