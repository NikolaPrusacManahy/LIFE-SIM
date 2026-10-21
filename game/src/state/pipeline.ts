import type { ActionResult } from './Game';

// Update 0.8 — the action pipeline: chosen → result card (must be dismissed) → queued events → banners → next slot.
// Pure so tests can prove nothing jumps in between.

export type Stage = 'idle' | 'result' | 'locked';

export interface Pipeline {
  stage: Stage;
  result: ActionResult | null;
}

export type PipelineAction =
  | { type: 'result'; result: ActionResult }
  | { type: 'dismiss' }
  /** a mini-game / scene holds the queue until it ends */
  | { type: 'lock' }
  | { type: 'unlock'; result?: ActionResult };

export const IDLE: Pipeline = { stage: 'idle', result: null };

export function pipelineReducer(p: Pipeline, a: PipelineAction): Pipeline {
  switch (a.type) {
    case 'result':
      return { stage: 'result', result: a.result };
    case 'dismiss':
      return p.stage === 'result' ? IDLE : p;
    case 'lock':
      return { stage: 'locked', result: null };
    case 'unlock':
      return a.result ? { stage: 'result', result: a.result } : IDLE;
  }
}

/** Queued story events may only show once the result card is gone and nothing holds the queue. */
export const canShowEvents = (p: Pipeline) => p.stage === 'idle';
/** Text banners wait for events too. */
export const canShowBanners = (p: Pipeline, eventsPending: boolean) => p.stage === 'idle' && !eventsPending;
