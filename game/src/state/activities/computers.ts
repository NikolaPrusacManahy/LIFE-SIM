import type { ActivityDef } from './types';
import { deviceLock, openSession } from '../pc/session';
import { canBuild } from '../pc/build';
import { PARTS } from '../pc/parts';
import { itemCount } from '../inventory/items';

// Update 0.8 — computers. A sitting takes no time (one per time slot) and gives a few actions on the Doors desktop.

const laptopAt = (loc: string): ActivityDef => ({
  id: `laptop_${loc}`, loc, name: 'Use Your Laptop', icon: '💻', desc: 'Web & games free. 12 ⚡ for Hackr / START-UP.', cat: 'fun', energy: 4, free: true,
  when: (g) => g.has('laptop'),
  lock: (g) => deviceLock(g, 'laptop'),
  run: (g) => {
    if (loc !== 'home') g.setFlag('laptopPublic', g.s.clock);
    return openSession(g, 'laptop');
  },
});

export const COMPUTER_ACTS: ActivityDef[] = [
  {
    id: 'use_pc', loc: 'home', name: 'Use Your PC', icon: '🖥️', desc: 'Your build. 12 ⚡ for Hackr / START-UP.', cat: 'fun', energy: 4, free: true,
    when: (g) => g.has('pc'),
    lock: (g) => deviceLock(g, 'pc'),
    run: (g) => openSession(g, 'pc'),
  },
  laptopAt('home'),
  laptopAt('library'),
  laptopAt('campus'),
  laptopAt('downtown'),
  laptopAt('mainstreet'),
  {
    id: 'library_pc', loc: 'library', name: 'Public Computer', icon: '🖥️', desc: 'Public. Web & games free. 4 ⚡ for START-UP.', cat: 'study', energy: 4, free: true,
    lock: (g) => deviceLock(g, 'library'),
    run: (g) => openSession(g, 'library'),
  },
  {
    id: 'build_pc', loc: 'home', name: 'Build a PC', icon: '🔧', desc: 'Assemble the parts in your bag.', cat: 'panel', energy: 0, panel: 'pcbuild',
    when: (g) => canBuild(g) || (g.has('pc') && PARTS.some((p) => itemCount(g, p.id) > 0)),
    run: () => '',
  },
];
