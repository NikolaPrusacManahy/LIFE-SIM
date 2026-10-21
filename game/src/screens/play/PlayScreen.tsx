import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ActionResult, Game } from '../../state/Game';
import type { ActivityDef, PanelId } from '../../state/activities';
import { visibleLocations } from '../../state/systems/world';
import { hasPhone } from '../../state/systems/phone';
import type { StageHandle } from '../../fx/StageCanvas';
import { useEscape } from '../../hooks/useEscape';
import { StatsCard } from './hud/StatsCard';
import { TopPills } from './hud/TopPills';
import { PlacesCard } from './hud/PlacesCard';
import { ActionsCard } from './hud/ActionsCard';
import { EventModal } from './EventModal';
import { ActionToast } from './ActionToast';
import { PhoneDevice } from '../phone/PhoneDevice';
import { KioskCard } from '../phone/KioskCard';
import type { AppId } from '../phone/apps';
import { PauseMenu } from '../pause/PauseMenu';
import { DeathScreen } from '../death/DeathScreen';
import { MonthSummary, type MonthReport } from './MonthSummary';
import { PeopleScreen } from '../people/PeopleScreen';
import { EvidenceScreen } from '../crime/EvidenceScreen';
import { NewsTicker, PursuitHud } from '../crime/PursuitHud';
import { unreadCount } from '../../state/phone/texts';
import { sfx, sfxForText } from '../../ui/audio';

const PANEL_APP: Record<PanelId, AppId> = { jobs: 'jobs', school: 'school', shop: 'shop', housing: 'homes', bank: 'bank', blackmarket: 'blackmarket', crime: 'crime' };

interface Props {
  game: Game;
  stage: RefObject<StageHandle | null>;
  tab: string;
  setTab: (id: string) => void;
  onTitle: () => void;
  onRestart: () => void;
  onChild: (id: string) => void;
}

/** Façade for the main game screen: routes input to the engine and results to the stage. */
export function PlayScreen({ game, stage, tab, setTab, onTitle, onRestart, onChild }: Props) {
  const [toast, setToast] = useState<ActionResult | null>(null);
  const [eventResult, setEventResult] = useState<ActionResult | null>(null);
  const [device, setDevice] = useState<{ app: AppId | null } | null>(null);
  const [kiosk, setKiosk] = useState<{ app: AppId; title: string; icon: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [report, setReport] = useState<MonthReport | null>(null);
  const [people, setPeople] = useState<{ pid: string | null } | null>(null);

  useEscape(() => setPaused((p) => !p));

  // Update 0.5.1 — ping when a new text lands
  const unread = hasPhone(game) ? unreadCount(game) : 0;
  const lastUnread = useRef(unread);
  useEffect(() => {
    if (unread > lastUnread.current) sfx('notify');
    lastUnread.current = unread;
  }, [unread]);

  // fall back to the first place if the browsed one disappears (graduated, quit job, moved)
  const locs = visibleLocations(game);
  useEffect(() => {
    if (!locs.some((l) => l.id === tab)) setTab(locs[0]?.id ?? 'home');
  });

  const play = useCallback(
    (r: ActionResult) => {
      stage.current?.play(r.fx);
      stage.current?.floatDeltas(r.deltas, (k, v) => game.describeDelta(k, v));
    },
    [game, stage],
  );

  const act = (def: ActivityDef) => {
    if (def.panel) return setKiosk({ app: PANEL_APP[def.panel], title: def.name, icon: def.icon });
    const r = game.doActivity(def.id);
    if (r) {
      sfxForText(r.text);
      play(r);
      setToast(r);
    }
  };

  const autopilot = () => {
    const startTurn = game.s.turn;
    const label = game.dateLabel;
    const rs = game.autopilot();
    if (!rs.length) return;
    const merged: ActionResult = { ...rs[rs.length - 1], title: 'Your routine', icon: '⏩', text: rs.map((r) => r.text).filter(Boolean).slice(-2).join(' '), deltas: {}, fx: [] };
    for (const r of rs) {
      for (const [k, v] of Object.entries(r.deltas)) merged.deltas[k] = (merged.deltas[k] ?? 0) + v;
      merged.fx.push(...r.fx);
    }
    play(merged);
    if (merged.monthPassed) setReport({ label, deltas: merged.deltas, entries: game.s.log.filter((l) => l.turn >= startTurn) });
    else setToast(merged);
  };

  const choose = (i: number) => {
    const r = game.resolveChoice(i);
    if (r) {
      play(r);
      setEventResult(r);
    }
  };

  const onResult = (r: ActionResult) => {
    sfxForText(r.text);
    play(r);
    if (r.title) setToast(r);
  };
  const openPeople = (pid?: string) => {
    setDevice(null);
    setPeople({ pid: pid ?? null });
  };
  const host = { game, onResult, onTitle, onRestart, openPeople };

  const hideToast = useCallback(() => setToast(null), []);
  const showEvent = !!eventResult || !!game.currentEvent;
  const scene = !!game.s.underworld.scene && !showEvent;
  if (game.s.dead && !showEvent) return <DeathScreen game={game} onChild={onChild} onNewLife={onRestart} />;

  return (
    <div className={`ply-screen ${game.s.underworld.pursuit && !game.s.underworld.pursuit.settled ? 'ply-pursuit' : ''}`}>
      <PursuitHud game={game} />
      <NewsTicker game={game} />
      <StatsCard game={game} />
      <TopPills game={game} onDevice={() => setDevice({ app: null })} onPeople={() => openPeople()} onAutopilot={autopilot} onPause={() => setPaused(true)} />
      <PlacesCard game={game} tab={tab} setTab={setTab} />
      <ActionsCard game={game} tab={tab} onAct={act} onGo={setTab} onStory={() => setDevice({ app: 'diary' })} />
      {toast && !showEvent && <ActionToast key={toast.title + game.s.turn} game={game} result={toast} onDone={hideToast} />}
      {showEvent && <EventModal game={game} result={eventResult} onChoose={choose} onContinue={() => setEventResult(null)} />}
      {device && !showEvent && <PhoneDevice {...host} mode={hasPhone(game) ? 'phone' : 'journal'} initial={device.app} onClose={() => setDevice(null)} />}
      {kiosk && !showEvent && <KioskCard {...host} app={kiosk.app} title={kiosk.title} icon={kiosk.icon} onClose={() => setKiosk(null)} />}
      {scene && <EvidenceScreen game={game} onResult={onResult} />}
      {people && !showEvent && <PeopleScreen game={game} initial={people.pid} onClose={() => setPeople(null)} onResult={onResult} />}
      {report && !showEvent && <MonthSummary game={game} report={report} onClose={() => setReport(null)} />}
      {paused && <PauseMenu onResume={() => setPaused(false)} onTitle={onTitle} onRestart={onRestart} />}
    </div>
  );
}
