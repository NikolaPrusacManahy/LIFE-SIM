import type { ActivityDef } from './types';
import { HOME_ACTS } from './home';
import { SCHOOL_ACTS } from './school';
import { WORK_ACTS } from './work';
import { TOWN_ACTS } from './town';
import { OUTDOOR_ACTS } from './outdoors';
import { NIGHTLIFE_ACTS } from './nightlife';
import { TRAVEL_ACTS } from './travel';
import { SERVICE_ACTS } from './services';
import { JAIL_ACTS } from './jail';
import { CASINO_ACTS } from './casino';
import { UNDERWORLD_ACTS } from './underworld';

export type { ActivityDef, ActCategory, PanelId } from './types';

export const ACTIVITIES: ActivityDef[] = [
  ...HOME_ACTS,
  ...SCHOOL_ACTS,
  ...WORK_ACTS,
  ...TOWN_ACTS,
  ...OUTDOOR_ACTS,
  ...NIGHTLIFE_ACTS,
  ...TRAVEL_ACTS,
  ...SERVICE_ACTS,
  ...JAIL_ACTS,
  ...CASINO_ACTS,
  ...UNDERWORLD_ACTS,
];

export const ACT_BY_ID: Record<string, ActivityDef> = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));

export const activitiesAt = (loc: string) => ACTIVITIES.filter((a) => a.loc === loc);
