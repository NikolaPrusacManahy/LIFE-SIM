// Update 0.8 — plans and notifications (saved).

export type PlanKind = 'party' | 'movie' | 'food' | 'date' | 'game' | 'talk' | 'hang' | 'over';
export type PlanSource = 'invite' | 'mine' | 'date' | 'surprise' | 'anniversary' | 'birthday' | 'checkin';

export interface Plan {
  id: string;
  pid: string;
  kind: PlanKind;
  /** the time slot (turn) it happens in */
  turn: number;
  status: 'set' | 'done' | 'missed' | 'cancelled';
  source: PlanSource;
}

export type NoteKind = 'text' | 'plan' | 'bill' | 'news' | 'expired';

export interface Note {
  id: string;
  kind: NoteKind;
  pid?: string;
  icon: string;
  text: string;
  turn: number;
  read: boolean;
  /** banner already shown */
  shown: boolean;
}
