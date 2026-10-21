// Quality gate. `--quick` = typecheck + feature tests. Full = + lint, vitest, production build.
import { execSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const quick = process.argv.includes('--quick');
const tests = readdirSync('tests').filter((f) => /^test-.*\.ts$/.test(f)).map((f) => `npx tsx tests/${f}`);
const steps = [
  ['typecheck', 'npx tsc --noEmit'],
  ...tests.map((t) => [t.split('/').pop(), t]),
  ...(quick ? [] : [['lint', 'npx eslint src tests'], ['vitest', 'npx vitest run'], ['build', 'npx vite build']]),
];

let failed = 0;
for (const [name, cmd] of steps) {
  process.stdout.write(`▶ ${name} ... `);
  try {
    execSync(cmd, { stdio: 'pipe' });
    console.log('✅');
  } catch (e) {
    failed++;
    console.log('❌');
    console.log(String(e.stdout ?? '') + String(e.stderr ?? ''));
  }
}
console.log(failed ? `\n❌ ${failed} step(s) failed` : '\n✅ All gates passed');
process.exit(failed ? 1 : 0);
