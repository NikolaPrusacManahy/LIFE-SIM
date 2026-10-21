import type { Game } from '../Game';
import type { PartDef, PartSlot } from './parts';
import { BUILD_ORDER, PART_BY_ID, PARTS, REQUIRED, SLOT_LABEL } from './parts';
import { addItem, itemCount, spendItem } from '../inventory/items';

// Update 0.8 — compatibility, assembly (with very real mistakes), PC score and ageing.

/** The best part of each slot you're holding in the bag (what a build would use). */
export function bagParts(g: Game): Partial<Record<PartSlot, PartDef>> {
  const out: Partial<Record<PartSlot, PartDef>> = {};
  for (const p of PARTS) if (itemCount(g, p.id) > 0 && (!out[p.slot] || p.tier > out[p.slot]!.tier)) out[p.slot] = p;
  return out;
}

export const missingParts = (parts: Partial<Record<PartSlot, PartDef>>) => REQUIRED.filter((s) => !parts[s]);
export const canBuild = (g: Game) => missingParts(bagParts(g)).length === 0;

/** Every compatibility problem in a set of parts (PartPicker shows these; assembly fails on them). */
export function compatibility(parts: Partial<Record<PartSlot, PartDef>>): string[] {
  const out: string[] = [];
  const { mobo, cpu, ram, psu, gpu, cooler } = parts;
  const kase = parts.case;
  if (mobo && cpu && mobo.socket !== cpu.socket) out.push(`${cpu.name} doesn’t fit the ${mobo.socket}-socket motherboard`);
  if (mobo && ram && mobo.ram !== ram.ram) out.push(`${ram.name} RAM won’t go into a ${mobo.ram} motherboard`);
  const draw = (cpu?.draw ?? 0) + (gpu?.draw ?? 0) + 80;
  if (psu && draw > (psu.watts ?? 0)) out.push(`Power supply too weak: ${psu.watts}W for about ${draw}W`);
  if (kase && gpu && (gpu.len ?? 0) > (kase.maxGpu ?? 999)) out.push(`${gpu.name} is too long for the ${kase.name}`);
  if (kase && cooler && (cooler.height ?? 0) > (kase.maxCooler ?? 999)) out.push(`${cooler.name} is too tall for the ${kase.name}`);
  return out;
}

export function pcScore(parts: Partial<Record<PartSlot, string>>, noPaste = false, mess = false): number {
  let s = 0;
  for (const id of Object.values(parts)) s += PART_BY_ID[id!]?.score ?? 0;
  if (noPaste) s *= 0.7;
  if (mess) s *= 0.9;
  return Math.round(s);
}

export interface AssemblyResult {
  ok: boolean;
  /** what happened at each step */
  steps: string[];
  /** a part that broke (static zap) */
  broken?: PartSlot;
}

/**
 * Put it together. `order` is the slot order the player dragged in; `paste` = remembered thermal paste.
 * Incompatible parts are found here — the parts stay in the bag so you can swap them.
 */
export function assemble(g: Game, order: PartSlot[], paste: boolean): AssemblyResult {
  const parts = bagParts(g);
  const steps: string[] = [];
  const missing = missingParts(parts);
  if (missing.length) return { ok: false, steps: [`Missing: ${missing.map((s) => SLOT_LABEL[s]).join(', ')}`] };
  const issues = compatibility(parts);
  if (issues.length) return { ok: false, steps: issues.map((i) => `✖ ${i}`) };
  const guide = g.s.web.guides.includes('pc');
  const inOrder = BUILD_ORDER.every((s, i) => order[i] === s);
  let mess = !inOrder;
  let broken: PartSlot | undefined;
  for (const slot of BUILD_ORDER) {
    const okStep = g.check('smarts', guide ? 25 : 40);
    if (okStep) steps.push(`✔ ${SLOT_LABEL[slot]} in.`);
    else if (slot === 'ram') steps.push('⚠ RAM wasn’t fully seated — no boot. You reseated it. Click.');
    else if (slot === 'gpu' && !broken && g.chance(guide ? 0.15 : 0.35)) {
      broken = 'gpu';
      steps.push('⚡ A static zap. The graphics card is dead.');
    } else {
      mess = true;
      steps.push(`⚠ ${SLOT_LABEL[slot]} in, cables everywhere.`);
    }
  }
  if (broken) {
    spendItem(g, parts[broken]!.id);
    return { ok: false, steps: [...steps, 'Order a new one and try again.'], broken };
  }
  // done: parts leave the bag and become the PC
  const installed: Partial<Record<PartSlot, string>> = {};
  for (const [slot, p] of Object.entries(parts) as [PartSlot, PartDef][]) {
    installed[slot] = p.id;
    spendItem(g, p.id);
  }
  // keep any older installed parts the new build didn't replace (upgrades)
  g.s.pc = { parts: { ...g.s.pc.parts, ...installed }, score: 0, built: g.s.clock, noPaste: !paste, mess, mining: g.s.pc.mining };
  g.s.pc.score = pcScore(g.s.pc.parts, !paste, mess);
  g.give('pc');
  if (!paste) steps.push('… you forgot the thermal paste.');
  steps.push(`🌈 First boot! PC score ${g.s.pc.score}.`);
  g.burst('confetti');
  g.banner('FIRST BOOT', 0x8b72f5);
  g.milestone('Built your own PC');
  return { ok: true, steps };
}

/** Monthly: overheating, old parts dying, crypto mining (with an electricity bill). */
export function pcMonth(g: Game) {
  if (!g.has('pc')) return;
  const pc = g.s.pc;
  if (pc.noPaste && g.chance(0.25)) {
    g.queue('pc_overheat');
    return;
  }
  const age = g.s.clock - pc.built;
  if (age > 36 && pc.parts.gpu && g.chance(0.03)) {
    const dead = PART_BY_ID[pc.parts.gpu];
    delete pc.parts.gpu;
    pc.score = pcScore(pc.parts, pc.noPaste, pc.mess);
    g.log(`💀 Your ${dead?.name ?? 'graphics card'} died after ${Math.floor(age / 12)} years. Order a new one on Nile.`, 'bad');
    return;
  }
  if (pc.mining && pc.parts.gpu) {
    const income = Math.round(pc.score * 4 * (0.6 + Math.random() * 0.8));
    const bill = 60 + Math.round(pc.score * 1.2);
    g.money(income - bill);
    g.log(`⛏️ Mining: +$${income} coins, −$${bill} electricity.`, 'money');
  }
}

/** A PC is usable once every required slot is filled. */
export const pcReady = (g: Game) => g.has('pc') && REQUIRED.every((s) => g.s.pc.parts[s]);

/** Put a single replacement part in (no full rebuild needed). */
export function installPart(g: Game, id: string): string {
  const p = PART_BY_ID[id];
  if (!p || !g.has('pc') || !spendItem(g, id)) return '';
  const old = g.s.pc.parts[p.slot];
  if (old) addItem(g, old);
  const next = { ...g.s.pc.parts, [p.slot]: id };
  const asParts = Object.fromEntries(Object.entries(next).map(([k, v]) => [k, PART_BY_ID[v!]])) as Partial<Record<PartSlot, PartDef>>;
  const issues = compatibility(asParts);
  if (issues.length) {
    if (old) spendItem(g, old);
    addItem(g, id);
    return `✖ ${issues[0]}`;
  }
  g.s.pc.parts = next;
  g.s.pc.score = pcScore(next, g.s.pc.noPaste, g.s.pc.mess);
  return `${p.name} installed. PC score ${g.s.pc.score}.`;
}
