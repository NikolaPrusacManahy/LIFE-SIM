import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Stage, type StageView } from './stage/Stage';
import type { FxKind } from '../state/types';

export interface StageHandle {
  play: (fx: FxKind[]) => void;
  floatDeltas: (d: Record<string, number>, label: (k: string, v: number) => string) => void;
}

/** Mounts the PixiJS stage once; `view` updates are pushed to it on every render. */
export const StageCanvas = forwardRef<StageHandle, { view: StageView }>(function StageCanvas({ view }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Stage | null>(null);

  useEffect(() => {
    const s = new Stage();
    stage.current = s;
    s.init(host.current!);
    return () => {
      s.destroy();
      stage.current = null;
    };
  }, []);

  useEffect(() => {
    stage.current?.setView(view);
  });

  useImperativeHandle(ref, () => ({
    play: (fx) => stage.current?.play(fx),
    floatDeltas: (d, label) => stage.current?.floatDeltas(d, label),
  }));

  return <div className="stg-host" ref={host} />;
});
