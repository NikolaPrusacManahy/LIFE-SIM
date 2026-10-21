import type { EventDef } from './types';
import { SCHOOL_EVENTS } from './school';
import { WORK_EVENTS } from './work';
import { LOVE_EVENTS } from './love';
import { LIFE_EVENTS } from './life';
import { TROUBLE_EVENTS } from './trouble';
import { ADULT_EVENTS } from './adult';
import { LIFE03_EVENTS } from './life03';
import { PEOPLE_EVENTS } from './people';
import { UNDERWORLD_EVENTS } from './underworld';
import { CHAT_EVENTS } from './chat';

export type { EventDef, ChoiceDef, Ctx } from './types';

export const EVENTS: EventDef[] = [...SCHOOL_EVENTS, ...WORK_EVENTS, ...LOVE_EVENTS, ...LIFE_EVENTS, ...TROUBLE_EVENTS, ...ADULT_EVENTS, ...LIFE03_EVENTS, ...PEOPLE_EVENTS, ...UNDERWORLD_EVENTS, ...CHAT_EVENTS];

export const EVENT_BY_ID: Record<string, EventDef> = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
