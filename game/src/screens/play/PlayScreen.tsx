import { MiniHost } from '../mini/MiniHost';
import { useCallback, useEffect, useReducer, useState, type RefObject } from 'react';
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
import { ResultCard } from './ResultCard';
import { Desktop } from '../desktop/Desktop';
import { BuildScreen } from '../pc/BuildScreen';
import { NightScreen } from '../night/NightScreen';
import { DateScreen } from '../date/DateScreen';
import { NotificationBanner } from '../phone/NotificationBanner';
import { IDLE, canShowBanners, canShowEvents, pipelineReducer } from '../../state/pipeline';
import { pendingBanners } from '../../state/phone/notify';
import { PhoneDevice } from '../phone/PhoneDevice';
import { KioskCard } from '../phone/KioskCard';
import type { AppId } from '../phone/apps';
import { PauseMenu } from '../pause/PauseMenu';
import { DeathScreen } from '../death/DeathScreen';
import { MonthSummary, type MonthReport } from './MonthSummary';
import { PeopleScreen } from '../people/PeopleScreen';
import { EvidenceScreen } from '../crime/EvidenceScreen';
import { NewsTicker, PursuitHud } from '../crime/PursuitHud';
import { sfxForText } from '../../ui/audio';
import { cur } from '../../ui/currency';

const PANEL_APP: Record<Exclude<PanelId, 'pcbuild'>, AppId> = { jobs: 'jobs', school: 'school', shop: 'shop', housing: 'homes', bank: 'bank', blackmarket: 'blackmarket', crime: 'crime' };

interface Props {
  game: Game;
  stage: RefObject<StageHandle | null>;
  tab: string;
  setTab: (id: string) => void;
  onTitle: () => void;
  onRestart: () => void;
  onChild: (id: string) => void;
  /** Update 0.12 — tells the stage when a story card (not its result) is open */
  onEventOpen?: (open: boolean) => void;
}

/** Façade for the main game screen: routes input to the engine and results to the stage. */
export function PlayScreen({ game, stage, tab, setTab, onTitle, onRestart, onChild, onEventOpen }: Props) {
  // Update 0.8 — strict order: result card → queued events → banners
  const [pipe, dispatch] = useReducer(pipelineReducer, IDLE);
  const [banner, setBanner] = useState<string | null>(null);
  const [eventResult, setEventResult] = useState<ActionResult | null>(null);
  const [device, setDevice] = useState<{ app: AppId | null; thread?: string } | null>(null);
  const [kiosk, setKiosk] = useState<{ app: AppId; title: string; icon: string } | null>(null);
  const [paused, setPaused] = useState(false);
  const [report, setReport] = useState<MonthReport | null>(null);
  const [people, setPeople] = useState<{ pid: string | null } | null>(null);
  const [build, setBuild] = useState(false);
  // Update 0.12 — an activity's minigame (coding, cooking, writing, the gym)
  const [mini, setMini] = useState<ActivityDef | null>(null);

  useEscape(() => setPaused((p) => !p));

  // fall back to the first place if the browsed one disappears (graduated, quit job, moved)
  const locs = visibleLocations(game);
  useEffect(() => {
    if (!locs.some((l) => l.id === tab)) setTab(locs[0]?.id ?? 'home');
  });

  const play = useCallback(
    (r: ActionResult) => {
      stage.current?.play(r.fx);
      stage.current?.floatDeltas(r.deltas, (k, v) => cur(game.describeDelta(k, v)));
    },
    [game, stage],
  );

  const act = (def: ActivityDef) => {
    if (def.panel === 'pcbuild') return setBuild(true);
    if (def.panel) return setKiosk({ app: PANEL_APP[def.panel], title: def.name, icon: def.icon });
    if (def.mini && game.activityStatus(def).ok) return setMini(def);
    runAct(def);
  };
  const runAct = (def: ActivityDef) => {
    const r = game.doActivity(def.id);
    if (r) {
      sfxForText(r.text);
      play(r);
      dispatch({ type: 'result', result: r });
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
    else dispatch({ type: 'result', result: merged });
  };

  const choose = (i: number) => {
    const r = game.resolveChoice(i);
    if (r) {
      play(r);
      setEventResult(r);
    }
  };

  /** `card` = false for instant phone actions (the app shows its own inline message). */
  const onResult = (r: ActionResult, card = true) => {
    sfxForText(r.text);
    play(r);
    if (r.title && card) dispatch({ type: 'result', result: r });
  };
  const openChat = (pid: string) => {
    setPeople(null);
    setDevice({ app: 'people', thread: pid });
  };
  const openPeople = (pid?: string) => {
    setDevice(null);
    setPeople({ pid: pid ?? null });
  };
  const host = { game, onResult, onTitle, onRestart, openPeople, openChat };

  const dismiss = useCallback(() => dispatch({ type: 'dismiss' }), []);
  const eventsPending = !!eventResult || !!game.currentEvent;
  // Update 0.8 — a computer sitting holds the queue until you shut down
  const showEvent = eventsPending && canShowEvents(pipe) && !game.s.session && !game.s.night && !game.s.date;
  // Update 0.10 — a story card, date, night out or computer sitting takes over: put the phone / panels away
  const takeover = showEvent || !!game.s.date || !!game.s.night || !!game.s.session;
  const cardOpen = showEvent && !eventResult;
  useEffect(() => onEventOpen?.(cardOpen), [cardOpen, onEventOpen]);
  useEffect(() => {
    if (!takeover) return;
    setDevice(null);
    setKiosk(null);
    setPeople(null);
  }, [takeover]);
  // next banner, only once the result card and all queued events are done
  const nextBanner = banner ?? (canShowBanners(pipe, eventsPending) && hasPhone(game) ? pendingBanners(game)[0]?.id ?? null : null);
  const bannerNote = nextBanner ? game.s.notes.find((n) => n.id === nextBanner) ?? null : null;
  useEffect(() => {
    if (nextBanner && nextBanner !== banner) setBanner(nextBanner);
  }, [nextBanner, banner]);
  const bannerDone = useCallback(() => setBanner(null), []);
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
      {pipe.stage === 'result' && pipe.result && <ResultCard key={`${pipe.result.title}-${game.s.turn}`} game={game} result={pipe.result} onDone={dismiss} />}
      {bannerNote && !showEvent && pipe.stage === 'idle' && <NotificationBanner key={bannerNote.id} game={game} note={bannerNote} onOpen={openChat} onDone={bannerDone} />}
      {showEvent && <EventModal game={game} result={eventResult} onChoose={choose} onContinue={() => setEventResult(null)} />}
      {device && !takeover && <PhoneDevice {...host} mode={hasPhone(game) ? 'phone' : 'journal'} initial={device.app} thread={device.thread} onClose={() => setDevice(null)} />}
      {kiosk && !takeover && <KioskCard {...host} app={kiosk.app} title={kiosk.title} icon={kiosk.icon} onClose={() => setKiosk(null)} />}
      {scene && <EvidenceScreen game={game} onResult={onResult} />}
      {people && !takeover && <PeopleScreen game={game} initial={people.pid} onClose={() => setPeople(null)} onResult={onResult} onOpenChat={hasPhone(game) ? openChat : undefined} />}
      {report && !showEvent && <MonthSummary game={game} report={report} onClose={() => setReport(null)} />}
      {game.s.session && pipe.stage === 'idle' && (
        <Desktop game={game} host={{ ...host, onClose: () => undefined }} onShutdown={(summary) => onResult(game.flush('Computer session', '🖥️', summary))} />
      )}
      {game.s.night && pipe.stage === 'idle' && (
        <NightScreen game={game} onChange={() => onResult(game.flush('', '', ''), false)} onEnd={(summary) => onResult(game.flush('Night out', '🌙', summary))} />
      )}
      {game.s.date && pipe.stage === 'idle' && (
        <DateScreen game={game} onChange={() => onResult(game.flush('', '', ''), false)} onEnd={(summary) => onResult(game.flush('Date', '🕯️', summary))} />
      )}
      {build && !showEvent && <BuildScreen game={game} onClose={() => setBuild(false)} onResult={onResult} />}
      {mini && !showEvent && <MiniHost game={game} def={mini} onCancel={() => setMini(null)} onDone={(r) => { const d = mini; setMini(null); game.mini = r; runAct(d); }} />}
      {paused && <PauseMenu onResume={() => setPaused(false)} onTitle={onTitle} onRestart={onRestart} />}
    </div>
  );
}
