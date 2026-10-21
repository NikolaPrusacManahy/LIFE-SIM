import { describe, expect, it } from 'vitest';
import { createLife, randomLook } from '../../src/state/newGame';
import { ACTIVITIES } from '../../src/state/activities';
import { EVENTS } from '../../src/state/events';
import { LOC_BY_ID } from '../../src/state/data/locations';
import { simulateLife } from '../sim';
import { resolveAll } from '../harness';

const life = () => createLife({ name: 'Vi', familyName: 'Test', gender: 'female', background: 'middle', hometown: 'city', traits: [], look: randomLook() });

describe('catalogs', () => {
  it('activity ids are unique', () => {
    const ids = ACTIVITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('every activity points to a real location', () => {
    for (const a of ACTIVITIES) expect(LOC_BY_ID[a.loc], a.id).toBeDefined();
  });
  it('event ids are unique', () => {
    const ids = EVENTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('time', () => {
  it('four actions advance one month', () => {
    const g = life();
    g.s.events = [];
    const start = g.s.clock;
    for (let i = 0; i < 4; i++) {
      resolveAll(g);
      g.doActivity(g.isNight ? 'sleep' : 'relax');
    }
    expect(g.s.clock).toBe(start + 1);
    expect(g.s.phase).toBe(0);
  });
  it('actions are blocked while an event is pending', () => {
    const g = life();
    expect(g.currentEvent?.id).toBe('hs_first_day');
    expect(g.doActivity('relax')).toBeNull();
  });
});

describe('simulation', () => {
  it('a whole life ends in death with a cause', () => {
    const g = simulateLife('rich', 'country', 12000);
    expect(g.s.dead?.cause).toBeTruthy();
  });
});
