// Tiny ✅/❌ assertion helper for tsx feature tests.
let fails = 0;
export function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? '✅' : '❌'} ${name}${!ok && detail ? ` — ${detail}` : ''}`);
  if (!ok) fails++;
}
export function done() {
  if (fails) {
    console.log(`\n${fails} check(s) failed`);
    process.exit(1);
  }
  console.log('\nall checks passed');
}

/** Resolve pending events by picking the first enabled choice (never loops on a disabled one). */
export function resolveAll(g: import('../src/state/Game').Game) {
  for (let guard = 0; g.currentEvent && guard < 50; guard++) {
    const i = g.choicesFor(g.currentEvent).findIndex((c) => !c.disabled);
    g.resolveChoice(Math.max(0, i));
  }
}
