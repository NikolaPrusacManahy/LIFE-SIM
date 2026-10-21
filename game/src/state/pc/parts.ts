// Update 0.8 — custom PC parts. Fictional brands only (AMB, Intol, Nvidio…). Pure data, no imports.

export type PartSlot =
  | 'case' | 'mobo' | 'cpu' | 'cooler' | 'gpu' | 'ram' | 'storage' | 'psu' | 'fans'
  | 'monitor' | 'keyboard' | 'mouse' | 'headset' | 'webcam' | 'mic' | 'chair' | 'desk' | 'rgb';

export const SLOT_LABEL: Record<PartSlot, string> = {
  case: 'Case', mobo: 'Motherboard', cpu: 'CPU', cooler: 'CPU cooler', gpu: 'Graphics card', ram: 'RAM', storage: 'Storage', psu: 'Power supply', fans: 'Case fans',
  monitor: 'Monitor', keyboard: 'Keyboard', mouse: 'Mouse', headset: 'Headset', webcam: 'Webcam', mic: 'Microphone', chair: 'Gaming chair', desk: 'Desk', rgb: 'RGB kit',
};
export const SLOT_ICON: Record<PartSlot, string> = {
  case: '🗄️', mobo: '🟩', cpu: '🔲', cooler: '🌀', gpu: '🎴', ram: '📏', storage: '💾', psu: '🔌', fans: '💨',
  monitor: '🖥️', keyboard: '⌨️', mouse: '🖱️', headset: '🎧', webcam: '📷', mic: '🎙️', chair: '🪑', desk: '🪵', rgb: '🌈',
};

/** Needed for a first boot. The rest are upgrades. */
export const REQUIRED: PartSlot[] = ['case', 'mobo', 'cpu', 'cooler', 'gpu', 'ram', 'storage', 'psu', 'monitor', 'keyboard', 'mouse'];
/** Assembly order inside the case (peripherals are just plugged in). */
export const BUILD_ORDER: PartSlot[] = ['mobo', 'cpu', 'cooler', 'ram', 'storage', 'gpu', 'psu'];

export interface PartDef {
  id: string;
  slot: PartSlot;
  tier: 1 | 2 | 3 | 4;
  name: string;
  price: number;
  /** contribution to the PC score */
  score: number;
  socket?: 'AM' | 'LG';
  ram?: 'D4' | 'D5';
  /** power draw (W) */
  draw?: number;
  /** PSU capacity (W) */
  watts?: number;
  /** GPU length / case max GPU (mm) */
  len?: number;
  maxGpu?: number;
  /** cooler height / case max cooler (mm) */
  height?: number;
  maxCooler?: number;
}

const P = (id: string, slot: PartSlot, tier: PartDef['tier'], name: string, price: number, score: number, extra: Partial<PartDef> = {}): PartDef => ({ id: `pc_${id}`, slot, tier, name, price, score, ...extra });

export const PARTS: PartDef[] = [
  P('case1', 'case', 1, 'Boxo Mini Tower', 60, 1, { maxGpu: 260, maxCooler: 140 }),
  P('case2', 'case', 2, 'Fractl Mid Air', 110, 2, { maxGpu: 330, maxCooler: 165 }),
  P('case3', 'case', 3, 'Lian Lee Glassbox', 180, 3, { maxGpu: 400, maxCooler: 175 }),
  P('mobo_am1', 'mobo', 1, 'AzRock B-Basic (AM, D4)', 90, 2, { socket: 'AM', ram: 'D4' }),
  P('mobo_am2', 'mobo', 3, 'AzRock X-Pro (AM, D5)', 240, 5, { socket: 'AM', ram: 'D5' }),
  P('mobo_lg1', 'mobo', 2, 'Gigabite H-Plus (LG, D4)', 130, 3, { socket: 'LG', ram: 'D4' }),
  P('mobo_lg2', 'mobo', 4, 'Gigabite Z-Ultra (LG, D5)', 320, 6, { socket: 'LG', ram: 'D5' }),
  P('cpu_am1', 'cpu', 1, 'AMB Rizen 3 (AM)', 110, 6, { socket: 'AM', draw: 65 }),
  P('cpu_am2', 'cpu', 2, 'AMB Rizen 5 (AM)', 190, 11, { socket: 'AM', draw: 90 }),
  P('cpu_am3', 'cpu', 3, 'AMB Rizen 7 (AM)', 330, 16, { socket: 'AM', draw: 120 }),
  P('cpu_lg1', 'cpu', 2, 'Intol Core i5 (LG)', 210, 11, { socket: 'LG', draw: 110 }),
  P('cpu_lg2', 'cpu', 4, 'Intol Core i9 (LG)', 560, 20, { socket: 'LG', draw: 210 }),
  P('cool1', 'cooler', 1, 'Stock-ish Fan', 20, 1, { height: 70 }),
  P('cool2', 'cooler', 2, 'Coolr Tower 212', 45, 3, { height: 158 }),
  P('cool3', 'cooler', 3, 'Noctwa Giant Tower', 110, 5, { height: 170 }),
  P('gpu1', 'gpu', 1, 'Nvidio GTZ 1630', 160, 8, { draw: 75, len: 200 }),
  P('gpu2', 'gpu', 2, 'Nvidio RTZ 4060', 320, 18, { draw: 130, len: 250 }),
  P('gpu3', 'gpu', 3, 'Radeyon RX 7800', 520, 26, { draw: 260, len: 310 }),
  P('gpu4', 'gpu', 4, 'Nvidio RTZ 4090 Titan', 1600, 40, { draw: 450, len: 360 }),
  P('ram1', 'ram', 1, '8 GB D4', 30, 3, { ram: 'D4' }),
  P('ram2', 'ram', 2, '16 GB D4', 55, 6, { ram: 'D4' }),
  P('ram3', 'ram', 3, '32 GB D5', 120, 10, { ram: 'D5' }),
  P('ssd1', 'storage', 1, '500 GB HDD', 35, 2),
  P('ssd2', 'storage', 2, '1 TB SSD', 70, 5),
  P('ssd3', 'storage', 3, '2 TB NVMe', 140, 8),
  P('psu1', 'psu', 1, 'CheapVolt 400W', 40, 1, { watts: 400 }),
  P('psu2', 'psu', 2, 'Corsaire 650W Gold', 90, 2, { watts: 650 }),
  P('psu3', 'psu', 3, 'Seasonik 1000W Platinum', 210, 3, { watts: 1000 }),
  P('fans1', 'fans', 2, 'Airflow 3-pack', 35, 2),
  P('mon1', 'monitor', 1, '24" 60Hz Office', 110, 2),
  P('mon2', 'monitor', 2, '27" 144Hz', 260, 5),
  P('mon3', 'monitor', 4, '34" Ultrawide OLED', 900, 9),
  P('kb1', 'keyboard', 1, 'Membrane Basic', 15, 0),
  P('kb2', 'keyboard', 3, 'Clacky Mech TKL', 110, 1),
  P('mouse1', 'mouse', 1, 'Office Mouse', 10, 0),
  P('mouse2', 'mouse', 3, 'Logitek Pro Light', 80, 1),
  P('head1', 'headset', 2, 'HyperZ Cloud', 70, 1),
  P('cam1', 'webcam', 2, 'Logitek C9 Webcam', 60, 1),
  P('mic1', 'mic', 2, 'Blue Yetti Mic', 110, 1),
  P('chair1', 'chair', 2, 'Throne Gaming Chair', 220, 1),
  P('desk1', 'desk', 2, 'Standing Desk', 280, 1),
  P('rgb1', 'rgb', 1, 'RGB Everything Kit', 40, 1),
];
export const PART_BY_ID: Record<string, PartDef> = Object.fromEntries(PARTS.map((p) => [p.id, p]));
export const partsFor = (slot: PartSlot) => PARTS.filter((p) => p.slot === slot);
